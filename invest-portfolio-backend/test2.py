import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib
import keras

from app.ml_models.src.utils.config import Config
from database.db_connection import db_connection, close_connection
from app.ml_models.src.data_processing.feature_engineer import FeatureEngineer


def predict_next_candle(df, scalers, model):
    config = Config()
    feature_engineer = FeatureEngineer(config)
    df_processed = feature_engineer.prepare_features(df)

    # Подготавливаем данные для предсказания
    feature_columns = ['volume', 'sma_20', 'sma_50', 'rsi', 'macd', 'bollinger_upper',
                       'bollinger_lower', 'atr', 'hour', 'day_of_week', 'month', 'price_range',
                       'body_size', 'upper_shadow', 'lower_shadow']
    recent_data = df_processed[feature_columns].tail(60).values
    scaled_data = scalers['feature'].transform(recent_data)
    input_sequence = scaled_data.reshape(1, 60, len(feature_columns))

    # Предсказание
    prediction = model.predict(input_sequence)

    # Обратное масштабирование
    temp_array = np.zeros((1, 4))
    result = {}
    for i, key in enumerate(['open', 'high', 'low', 'close']):
        temp_array[0, i] = prediction[key][0][0]
        unscaled = scalers['target'].inverse_transform(temp_array)
        result[key] = unscaled[0, i]
        temp_array[0, i] = 0  # сброс

    return result


def predict_multiple_candles(df, scalers, model, steps=5):
    predictions = []
    current_data = df.copy()

    for _ in range(steps):
        # Предсказываем следующую свечу
        pred = predict_next_candle(current_data, scalers, model)

        # Создаем новую строку с предсказанием
        new_row = current_data.iloc[-1:].copy()
        new_row['datetime'] += pd.Timedelta(hours=1)
        for key, value in pred.items():
            new_row[key] = value

        predictions.append((pred['open'], pred['high'], pred['low'], pred['close']))
        # Добавляем к данным для следующего предсказания
        current_data = pd.concat([current_data, new_row])

    return predictions


# Простой пример использования
def simple_example():
    # Загрузка модели
    model = keras.models.load_model('app/ml_models/models/trained/hybrid_candle_model.keras')
    scalers = joblib.load('app/ml_models/models/trained/hybrid_candle_model_scalers.pkl')

    # Создаем тестовые данные
    ticker = 'sber'

    connection = db_connection()
    cursor = connection.cursor()

    queue = f"""SELECT date, open, high, low, close, volume
                   FROM {ticker}
                   WHERE date < '2025-11-02'
                   ORDER BY date DESC
                   LIMIT 84"""
    cursor.execute(queue)
    data = cursor.fetchall()[::-1]

    close_connection(connection)

    df = pd.DataFrame(data=data[0:60], columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
    print(df)

    prediction_result = predict_multiple_candles(df, scalers, model, steps=24)

    # Для тестирования
    test_df = pd.DataFrame(data=data[60:], columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
    res_df = pd.DataFrame(data=prediction_result, columns=['open', 'high', 'low', 'close'])

    metric = 'close'

    a = []
    for i in range(5):
        test_value = round(float(test_df.loc[i, metric]), 2)
        res_value = round(float(res_df.loc[i, metric]), 2)

        print(f'Дата время: {test_df.loc[i, "datetime"]}')
        print(f'Историческая цена: {test_value}')
        print(f'Предсказание: {res_value}')
        print(f'Разница: {test_value - res_value:.2f}')
        a.append(abs(round(test_value - res_value, 2)))
        print()
        print('-' * 50)
        print()

    print(f'Средняя разность: {sum(a) / len(a):.2f}')

    # Простой график
    plt.figure(figsize=(10, 6))
    plt.plot(test_df['datetime'], test_df[metric], label='Исторические данные', color='blue')
    plt.plot(test_df['datetime'], res_df[metric], label='Предсказанные данные', color='red')
    plt.title('Исторические данные цены')
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    simple_example()
