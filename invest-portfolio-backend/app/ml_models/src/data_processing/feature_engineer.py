import pandas as pd
import numpy as np
from typing import List, Tuple
import talib
from sklearn.metrics import accuracy_score, precision_score, recall_score


class FeatureEngineer:
    def __init__(self, config):
        self.config = config

    def add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Добавление технических индикаторов"""
        df = df.copy()

        # Цены для расчетов
        high, low, close, volume = df['high'], df['low'], df['close'], df['volume']

        # Скользящие средние
        df['sma_20'] = talib.SMA(close, timeperiod=20)
        df['sma_50'] = talib.SMA(close, timeperiod=50)

        # RSI
        df['rsi'] = talib.RSI(close, timeperiod=14)

        # MACD
        macd, macdsignal, macdhist = talib.MACD(close)
        df['macd'] = macd
        df['macd_signal'] = macdsignal
        df['macd_hist'] = macdhist

        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = talib.BBANDS(close, timeperiod=20)
        df['bollinger_upper'] = bb_upper
        df['bollinger_lower'] = bb_lower
        df['bollinger_middle'] = bb_middle

        # ATR (Average True Range)
        df['atr'] = talib.ATR(high, low, close, timeperiod=14)

        # Volume indicators
        df['volume_sma'] = talib.SMA(volume, timeperiod=20)

        return df

    def add_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Добавление временных фич"""
        df = df.copy()
        datetime_col = pd.to_datetime(df['datetime'])

        df['hour'] = datetime_col.dt.hour
        df['day_of_week'] = datetime_col.dt.dayofweek
        df['month'] = datetime_col.dt.month
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

        return df

    def add_price_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Добавление производных ценовых фич"""
        df = df.copy()

        # Волатильность
        df['price_range'] = (df['high'] - df['low']) / df['close']
        df['body_size'] = abs(df['close'] - df['open']) / df['close']

        # Моменты свечей
        df['is_green'] = (df['close'] > df['open']).astype(int)
        df['upper_shadow'] = (df['high'] - np.maximum(df['open'], df['close'])) / df['close']
        df['lower_shadow'] = (np.minimum(df['open'], df['close']) - df['low']) / df['close']

        return df

    def create_sequences(self, data: np.ndarray, lookback: int) -> Tuple[np.ndarray, np.ndarray]:
        """Создание последовательностей для обучения"""
        X, y = [], []

        for i in range(lookback, len(data)):
            X.append(data[i - lookback:i])  # Последовательность фич
            y.append(data[i, :4])  # Целевые переменные: open, high, low, close

        return np.array(X), np.array(y)

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Полная подготовка фич"""
        df = self.add_technical_indicators(df)
        df = self.add_time_features(df)
        df = self.add_price_features(df)

        # Заполнение пропусков
        df = df.fillna(method='bfill').fillna(method='ffill')

        return df

    def prepare_trend_labels(self, df, lookforward=5):
        """Подготовка меток тренда на основе будущих цен"""
        close_prices = df['close'].values

        trends = []
        for i in range(len(close_prices) - lookforward):
            current_price = close_prices[i]
            future_price = close_prices[i + lookforward]

            change_percent = (future_price - current_price) / current_price * 100

            # Определение тренда
            if change_percent > 1.0:  # Восходящий тренд
                trend = [0, 0, 1]
            elif change_percent < -1.0:  # Нисходящий тренд
                trend = [1, 0, 0]
            else:  # Боковой тренд
                trend = [0, 1, 0]

            trends.append(trend)

        # Добавляем нули для последних элементов
        trends.extend([[0, 1, 0]] * min(lookforward, len(close_prices)))

        return np.array(trends)

    def calculate_trend_metrics(self, y_true, y_pred):
        """Расчет метрик для тренда"""
        true_trends = np.argmax(y_true, axis=1)
        pred_trends = np.argmax(y_pred, axis=1)

        accuracy = accuracy_score(true_trends, pred_trends)
        precision = precision_score(true_trends, pred_trends, average='weighted')
        recall = recall_score(true_trends, pred_trends, average='weighted')

        return {
            'trend_accuracy': accuracy,
            'trend_precision': precision,
            'trend_recall': recall
        }