import pandas as pd
import numpy as np
import os
import keras
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
from keras.callbacks import (
    ReduceLROnPlateau, EarlyStopping, ModelCheckpoint
)

import joblib

from app.ml_models.src.data_processing.data_processing import DataProcessing


class TrainModel:
    def __init__(self):
        self.scalers = {}

    def prepare_data(self, df: pd.DataFrame):
        df = df.copy()

        x_data = DataProcessing().prepare_data(df)
        y_data = DataProcessing().add_target(x_data).values

        x_data = x_data.values

        x_data, y_data = self._create_sequences(x_data, y_data, lookback=24)

        print(len(x_data))

        train_size, val_size = int(0.8 * len(x_data)), int(0.1 * len(x_data))

        x_train = x_data[:train_size]
        y_train = y_data[:train_size]

        print(len(x_train), len(y_train))

        x_val = x_data[train_size: train_size + val_size]
        y_val = y_data[train_size: train_size + val_size]

        print(len(x_val), len(y_val))

        x_test = x_data[train_size + val_size:]
        y_test = y_data[train_size + val_size:]

        print(len(x_test), len(y_test))

        self.scalers['feature'] = StandardScaler()

        x_train_reshape = x_train.reshape(-1, x_train.shape[-1])
        x_train_scaled = self.scalers['feature'].fit_transform(x_train_reshape)
        x_train = x_train_scaled.reshape(x_train.shape)

        x_val_reshape = x_val.reshape(-1, x_val.shape[-1])
        x_val_scaled = self.scalers['feature'].fit_transform(x_val_reshape)
        x_val = x_val_scaled.reshape(x_val.shape)

        x_test_reshape = x_test.reshape(-1, x_test.shape[-1])
        x_test_scaled = self.scalers['feature'].fit_transform(x_test_reshape)
        x_test = x_test_scaled.reshape(x_test.shape)

        self.scalers['target'] = StandardScaler()
        y_train = self.scalers['target'].fit_transform(y_train)
        y_val = self.scalers['target'].transform(y_val)
        y_test = self.scalers['target'].transform(y_test)

        y_train_dict = {
            'open': y_train[:, 0],
            'high': y_train[:, 1],
            'low': y_train[:, 2],
            'close': y_train[:, 3]
        }

        y_val_dict = {
            'open': y_val[:, 0],
            'high': y_val[:, 1],
            'low': y_val[:, 2],
            'close': y_val[:, 3]
        }

        y_test_dict = {
            'open': y_test[:, 0],
            'high': y_test[:, 1],
            'low': y_test[:, 2],
            'close': y_test[:, 3]
        }

        return (x_train, y_train_dict), (x_val, y_val_dict), (x_test, y_test_dict), (train_size, val_size)

    def _create_sequences(self, X_data: np.ndarray, y_data: np.ndarray, lookback: int) -> tuple:
        X_seq, y_seq = [], []

        for i in range(lookback, len(X_data)):
            # Входные фичи (только фичи, без целей)
            X_seq.append(X_data[i - lookback:i, :])
            # Целевые переменные (текущий временной шаг)
            y_seq.append(y_data[i, :])

        return np.array(X_seq), np.array(y_seq)

    def train_model(self, train, val, model, epoch):
        x_train, y_train = train
        x_val, y_val = val

        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                filepath='models/checkpoint/best_model.keras',
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1
            )
        ]

        history = model.fit(
            x_train, y_train,
            batch_size=32,
            epochs=epoch,
            validation_data=(x_val, y_val),
            callbacks=callbacks,
            verbose=1,
            shuffle=False
        )

        return history

    def save_model(self, model, path='models/stock_train_models/ml_stock_model.keras'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        model.save(path)
        scaler_path = path.replace('.keras', '_scalers.pkl')
        joblib.dump(self.scalers, scaler_path)
        print(f"Модель сохранена: {path}")
        print(f"Скейлеры сохранены: {scaler_path}")

    def load_model(self, path='models/stock_train_models/ml_stock_model.keras'):
        model = keras.models.load_model(path)
        scaler_path = path.replace('.keras', '_scalers.pkl')

        scalers = joblib.load(scaler_path)

        return model, scalers
