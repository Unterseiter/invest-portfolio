import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from typing import Tuple, List, Optional


class StockDataPreprocessor:
    def __init__(self, sequence_length: int = 60, test_size: float = 0.2):
        self.sequence_length = sequence_length
        self.test_size = test_size
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.feature_scaler = StandardScaler()

    def create_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Создание технических индикаторов"""
        data = df.copy()

        # Простые скользящие средние
        data['SMA_7'] = data['close'].rolling(window=7).mean()
        data['SMA_21'] = data['close'].rolling(window=21).mean()
        data['SMA_50'] = data['close'].rolling(window=50).mean()

        # Экспоненциальные скользящие средние
        data['EMA_12'] = data['close'].ewm(span=12).mean()
        data['EMA_26'] = data['close'].ewm(span=26).mean()

        # MACD
        data['MACD'] = data['EMA_12'] - data['EMA_26']
        data['MACD_Signal'] = data['MACD'].ewm(span=9).mean()
        data['MACD_Histogram'] = data['MACD'] - data['MACD_Signal']

        # RSI (Relative Strength Index)
        delta = data['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        data['RSI'] = 100 - (100 / (1 + rs))

        # Bollinger Bands
        data['BB_Middle'] = data['close'].rolling(window=20).mean()
        bb_std = data['close'].rolling(window=20).std()
        data['BB_Upper'] = data['BB_Middle'] + (bb_std * 2)
        data['BB_Lower'] = data['BB_Middle'] - (bb_std * 2)
        data['BB_Width'] = data['BB_Upper'] - data['BB_Lower']

        # Волатильность
        data['Volatility'] = data['close'].rolling(window=20).std()

        # Процентное изменение
        data['Price_Change'] = data['close'].pct_change()
        data['Volume_Change'] = data['volume'].pct_change()

        # Лаговые признаки
        for i in range(1, 6):
            data[f'Close_Lag_{i}'] = data['close'].shift(i)
            data[f'Volume_Lag_{i}'] = data['volume'].shift(i)

        # Целевая переменная - цена через n дней (например, 1 день)
        data['Target'] = data['close'].shift(-1)

        # Удаляем NaN значения
        data = data.dropna()

        return data

    def prepare_lstm_data(self, data: pd.DataFrame, feature_columns: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """Подготовка данных для LSTM модели"""
        # Выбираем фичи
        features = data[feature_columns].values
        target = data['Target'].values

        # Масштабируем фичи
        features_scaled = self.feature_scaler.fit_transform(features)
        target_scaled = self.scaler.fit_transform(target.reshape(-1, 1))

        X, y = [], []

        for i in range(self.sequence_length, len(features_scaled)):
            X.append(features_scaled[i - self.sequence_length:i])
            y.append(target_scaled[i, 0])

        X = np.array(X)
        y = np.array(y)

        return X, y

    def train_test_split(self, X: np.ndarray, y: np.ndarray) -> Tuple:
        """Разделение на train/test"""
        split_index = int(len(X) * (1 - self.test_size))

        X_train = X[:split_index]
        X_test = X[split_index:]
        y_train = y[:split_index]
        y_test = y[split_index:]

        return X_train, X_test, y_train, y_test

    def inverse_transform_predictions(self, predictions: np.ndarray) -> np.ndarray:
        """Обратное преобразование предсказаний к оригинальной шкале"""
        return self.scaler.inverse_transform(predictions.reshape(-1, 1)).flatten()