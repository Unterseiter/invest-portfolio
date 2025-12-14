import os
import pandas as pd
import numpy as np

from datetime import datetime, timedelta

from app.models.predict_model import PredictModel, TablePredicts
from typing import List

from database.db_connection import db_connection, close_connection

from app.ml_models.src.model.ml_model import MlModelStock, MlModelTrend
from app.ml_models.src.data_processing.data_processing import DataProcessing
from app.ml_models.src.data_processing.data_processing_trend import DataProcessingTrend
from app.ml_models.src.model import train_model_stock, train_model_trend

from app.utils.prepare_template_predict import (calc_market_signal, calc_assurance_trend, calc_volatility,
                                                calc_balance_models, calc_recommendation_signal)


def serialize_date(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


class MlPredictService:

    @classmethod
    def predict(self, hours, ticker):
        path_trend = f'app/ml_models/models/trend_train_models/ml_{ticker}_trend_model.keras'
        path_stock = f'app/ml_models/models/stock_train_models/ml_stock_{ticker}_model.keras'

        if not os.path.exists(path_trend):
            self._train_model_trend(ticker)

        if not os.path.exists(path_stock):
            self._train_model_stock(ticker)

        connection = db_connection()
        cursor = connection.cursor()

        queue = f"""SELECT date FROM {ticker} ORDER BY date DESC LIMIT 1;"""
        cursor.execute(queue)
        last_date = cursor.fetchall()[0][0]

        queue = f"""SELECT open, high, low, close
                            FROM {ticker}
                            WHERE date >= '2025-10-01'
                            ORDER BY date DESC
                            LIMIT 45"""
        cursor.execute(queue)

        data = cursor.fetchall()

        close_connection(connection)

        df = pd.DataFrame(data, columns=['open', 'high', 'low', 'close'])

        model_trend = train_model_trend.TrainModel().load_model(path=path_trend)
        model_stock, scalers = train_model_stock.TrainModel().load_model(path=path_stock)

        table_predict = []
        list_trend_predict = []

        for i in range(hours):

            trend_res, trend_predict = self._predict_trend(model_trend, df[i + 29:])
            stock_predict = self._predict_stock(model_stock, scalers, df[i:], trend_res)

            pred = []
            pred.append(last_date + timedelta(hours=1))
            for key in ['open', 'high', 'low', 'close']:
                pred.append(stock_predict[key])

            table_predict.append(pred)
            list_trend_predict.append(trend_predict)

            print(stock_predict)
            print(list(stock_predict.values()))

            df_row = pd.DataFrame([stock_predict])
            df = pd.concat([df, df_row], ignore_index=True)

        return table_predict, list_trend_predict

    @classmethod
    def template_predict(cls, table_predict, trend_predict, hours) -> PredictModel:

        # Создаем шаблон
        market_signal, score_market_signal = calc_market_signal(trend_predict, table_predict)
        assurance = calc_assurance_trend(score_market_signal, trend_predict)
        balance_signal, score_balance_signal = calc_balance_models(trend_predict, table_predict)
        volatility_signal, volatility = calc_volatility(table_predict)
        recommendation_signal = calc_recommendation_signal(table_predict, volatility,
                                                           score_balance_signal, score_market_signal)

        model = PredictModel(
            hours=hours,
            market_signal=market_signal,
            assurance=float(assurance),
            balance=balance_signal,
            volatility=volatility_signal,
            recommendation_signal=recommendation_signal,
            table_predict=[TablePredicts(
                date=serialize_date(row[0]),
                open=float(row[1]),
                high=float(row[2]),
                low=float(row[3]),
                close=float(row[4]),
            ) for row in table_predict]
        )
        print(model.to_dict())

        return model

    @classmethod
    def _predict_trend(self, model, df: pd.DataFrame):
        try:
            df = df.copy()

            df['close'] = pd.to_numeric(df['close'], errors='coerce')
            df['open'] = pd.to_numeric(df['open'], errors='coerce')

            x_data = DataProcessingTrend().prepare_data(df, 14, 100)

            pred = model.predict(x_data)

            up, flat, down = pred[0]
            mx = max(pred[0])

            if flat == mx:
                res = 0
            elif up == mx:
                res = 1
            else:
                res = -1

            return res, pred[0]

        except Exception as e:

            print(f'Сервис ml_predict. Ошибка в предсказании тренд модели: {e}')
            return None

    @classmethod
    def _predict_stock(self, model, scalers, df: pd.DataFrame, trend_res):
        try:
            df = df.copy()

            x_data = DataProcessing().prepare_data(df)
            x_data.loc[x_data.index[-1], 'trend'] = trend_res
            x_data = x_data.values

            x_seq = []
            x_seq.append(x_data)
            x_data = np.array(x_seq)

            x_data_reshape = x_data.reshape(-1, x_data.shape[-1])
            x_data_scaled = scalers['feature'].fit_transform(x_data_reshape)
            x_data = x_data_scaled.reshape(x_data.shape)

            predict = model.predict(x_data)

            list_predict = {}

            temp_array = np.zeros((1, 4))
            for j, key in enumerate(['open', 'high', 'low', 'close']):
                temp_array[0, j] = predict[key][0]
                unscaled = scalers['target'].inverse_transform(temp_array)
                list_predict[key] = np.exp(unscaled[0, j]) * float(df.loc[df.index[-1], key])
                temp_array[0, j] = 0

            return list_predict

        except Exception as e:

            print(f'Сервис ml_predict. Ошибка в предсказании сток модели: {e}')
            return False


    @classmethod
    def _train_model_trend(self, ticker):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = f"""SELECT close, open
                            FROM {ticker}
                            WHERE date >= '2024-01-01'
                            ORDER BY date"""
            cursor.execute(queue)

            data = cursor.fetchall()

            close_connection(connection)

            df = pd.DataFrame(data, columns=['close', 'open'])
            df['close'] = pd.to_numeric(df['close'], errors='coerce')
            df['open'] = pd.to_numeric(df['open'], errors='coerce')

            model = MlModelTrend().create_model(14, 100)

            train_model = train_model_trend.TrainModel()

            train, val, test = train_model.prepare_data(df)

            history = train_model.train_model(train, val, model, 1000)

            train_model.save_model(model, path=f'app/ml_models/models/trend_train_models/ml_{ticker}_trend_model.keras')

            return True

        except Exception as e:

            print(f'Сервис ml_predict. Ошибка в обучении тренд модели: {e}')
            return False

    @classmethod
    def _train_model_stock(self, ticker):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = f"""SELECT open, high, low, close
                                    FROM {ticker}
                                    WHERE date >= '2025-01-01'
                                    ORDER BY date"""
            cursor.execute(queue)

            data = cursor.fetchall()

            close_connection(connection)

            df = pd.DataFrame(data, columns=['open', 'high', 'low', 'close'])

            model = MlModelStock().create_model(8, 24)

            train_model = train_model_stock.TrainModel()

            train, val, test, size = train_model.prepare_data(df)

            history = train_model.train_model(train, val, model, 100)

            train_model.save_model(model, path=f'app/ml_models/models/stock_train_models/ml_stock_{ticker}_model.keras')

            return True

        except Exception as e:
            print(f'Сервис ml_predict. Ошибка в обучении сток модели: {e}')
            return False
