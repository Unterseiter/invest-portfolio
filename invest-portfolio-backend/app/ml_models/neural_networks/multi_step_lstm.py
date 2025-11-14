import numpy as np
from keras.models import Sequential
from keras.layers import LSTM, Dense, Dropout
from keras.optimizers import Adam
from keras.callbacks import EarlyStopping, ReduceLROnPlateau
from app.ml_models.base_model import BaseModel


class MultiStepLSTMModel(BaseModel):
    def __init__(self, sequence_length: int, feature_count: int, prediction_horizon: int = 24):
        self.sequence_length = sequence_length
        self.feature_count = feature_count
        self.prediction_horizon = prediction_horizon
        self.model = None

    def build_model(self):
        """Построение модели"""
        model = Sequential([
            LSTM(100, return_sequences=True, input_shape=(self.sequence_length, self.feature_count)),
            Dropout(0.2),
            LSTM(100, return_sequences=True),
            Dropout(0.2),
            LSTM(50),
            Dropout(0.2),
            Dense(100, activation='relu'),
            Dense(self.prediction_horizon)  # 24 выхода - прогноз на каждый час
        ])

        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )

        self.model = model
        return model

    def fit(self, X_train: np.ndarray, y_train: np.ndarray,
            X_val: np.ndarray = None, y_val: np.ndarray = None,
            epochs: int = 100, batch_size: int = 32, **kwargs):
        """Обучение модели (реализация абстрактного метода)"""
        if self.model is None:
            self.build_model()

        callbacks = [
            EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True),
            ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=10, min_lr=0.0001)
        ]

        validation_data = (X_val, y_val) if X_val is not None else None

        history = self.model.fit(
            X_train, y_train,
            validation_data=validation_data,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1,
            shuffle=False
        )

        return history.history

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Предсказание"""
        if self.model is None:
            raise ValueError("Модель не обучена. Сначала вызовите fit()")
        return self.model.predict(X)

    # Для обратной совместимости оставляем метод train
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray = None, y_val: np.ndarray = None,
              epochs: int = 100, batch_size: int = 32):
        """Алиас для fit (для обратной совместимости)"""
        return self.fit(X_train, y_train, X_val, y_val, epochs, batch_size)