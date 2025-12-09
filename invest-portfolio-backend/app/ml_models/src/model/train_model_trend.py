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

from app.ml_models.src.data_processing.data_processing_trend import DataProcessingTrend


class TrainModel:
    def __init__(self):
        self.scalers = {}

    def prepare_data(self, df: pd.DataFrame):
        df = df.copy()

        x_data = DataProcessingTrend().prepare_data(df, 14, 100)
        y_data = DataProcessingTrend().add_target(df[13:], 1)

        print(x_data.shape)
        print(y_data)

        train_size, val_size = int(0.8 * len(x_data)), int(0.1 * len(x_data))

        x_train = x_data[:train_size]
        y_train = y_data[:train_size]

        x_val = x_data[train_size: train_size + val_size]
        y_val = y_data[train_size: train_size + val_size]

        x_test = x_data[train_size + val_size:]
        y_test = y_data[train_size + val_size:]

        return (x_train, y_train), (x_val, y_val), (x_test, y_test)

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

        class_weight = self.add_class_weight(y_train)

        history = model.fit(
            x_train, y_train,
            batch_size=32,
            epochs=epoch,
            validation_data=(x_val, y_val),
            callbacks=callbacks,
            verbose=1,
            class_weight=class_weight,
            shuffle=True
        )

        return history

    def save_model(self, model, path='models/trend_train_models/ml_trend_model.keras'):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        model.save(path)
        print(f"Модель сохранена: {path}")

    def load_model(self, path='models/trend_train_models/ml_trend_model.keras'):
        model = keras.models.load_model(path)
        return model

    def add_class_weight(self, y_train):
        y_train_labels = np.argmax(y_train, axis=1)  # Конвертируем one-hot в labels
        class_weights = compute_class_weight(
            'balanced',
            classes=np.unique(y_train_labels),
            y=y_train_labels
        )

        class_weight_dict = dict(enumerate(class_weights))
        print(f"Веса классов: {class_weight_dict}")

        return class_weight_dict
