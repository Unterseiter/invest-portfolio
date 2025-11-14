# ml_models/neural_networks/single_step_lstm.py
import numpy as np
import tensorflow as tf
from keras.models import Sequential
from keras.layers import LSTM, Dense, Dropout
from keras.optimizers import Adam
from keras.callbacks import EarlyStopping, ReduceLROnPlateau
from app.ml_models.base_model import BaseModel


class SingleStepLSTMModel(BaseModel):
    """LSTM модель для прогнозирования на 1 шаг вперед (цена через 24 часа)"""

    def __init__(self, sequence_length: int, feature_count: int):
        self.sequence_length = sequence_length
        self.feature_count = feature_count
        self.model = None

    def build_model(self):
        """Построение модели для одношагового прогноза"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(self.sequence_length, self.feature_count)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(1, activation='linear')  # Один выход - цена через 24 часа
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
        """Обучение модели"""
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
        """Предсказание цены через 24 часа"""
        if self.model is None:
            raise ValueError("Модель не обучена. Сначала вызовите fit()")
        return self.model.predict(X).flatten()