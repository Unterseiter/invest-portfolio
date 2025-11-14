import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
)
import os
import joblib
import pandas as pd
import keras

from app.ml_models.src.data_processing.feature_engineer import FeatureEngineer


class ModelTrainer:
    def __init__(self, config):
        self.config = config
        self.scalers = {}
        self.label_encoders = {}

        # Создаем необходимые директории
        self._create_directories()

    def _create_directories(self):
        """Создание необходимых директорий"""
        os.makedirs('app/ml_models/models/model_checkpoints', exist_ok=True)
        os.makedirs('app/ml_models/models/trained', exist_ok=True)
        os.makedirs('logs', exist_ok=True)

    def prepare_data(self, df: pd.DataFrame, ticker_column: str = None):
        """Подготовка данных для обучения"""

        # Feature engineering
        feature_engineer = FeatureEngineer(self.config)
        df_processed = feature_engineer.prepare_features(df)

        # Разделяем фичи и целевые переменные ДО создания последовательностей
        target_columns = self.config.data_config['target_columns']

        # Выбор фич для обучения (ИСКЛЮЧАЕМ целевые переменные из фич!)
        feature_columns = []
        # Базовые ценовые фичи (только для фичей, не цели!)
        feature_columns.extend(['open', 'high', 'low', 'close', 'volume'])

        # Добавляем технические индикаторы, если они есть
        technical_indicators = self.config.features_config['technical_indicators']
        available_technical = [f for f in technical_indicators if f in df_processed.columns]
        feature_columns.extend(available_technical)

        # Временные фичи
        time_features = self.config.features_config['time_features']
        available_time = [f for f in time_features if f in df_processed.columns]
        feature_columns.extend(available_time)

        # Дополнительные фичи
        additional_features = ['price_range', 'body_size', 'upper_shadow', 'lower_shadow']
        available_additional = [f for f in additional_features if f in df_processed.columns]
        feature_columns.extend(available_additional)

        # УБИРАЕМ целевые переменные из фичей, если они там есть
        feature_columns = [f for f in feature_columns if f not in target_columns]

        print(f"Используемые фичи ({len(feature_columns)}): {feature_columns}")
        print(f"Целевые переменные ({len(target_columns)}): {target_columns}")

        # Убедимся, что все фичи существуют
        missing_features = set(feature_columns) - set(df_processed.columns)
        if missing_features:
            print(f"Предупреждение: отсутствуют фичи: {missing_features}")
            feature_columns = [f for f in feature_columns if f in df_processed.columns]

        # Создаем отдельные массивы для фич и целей
        X_data = df_processed[feature_columns].values
        y_data = df_processed[target_columns].values

        print(f"Форма X_data: {X_data.shape}, Форма y_data: {y_data.shape}")

        # Создание последовательностей
        lookback = self.config.data_config['lookback']
        X_seq, y_seq = self._create_sequences(X_data, y_data, lookback)

        print(f"После создания последовательностей: X_seq {X_seq.shape}, y_seq {y_seq.shape}")

        # Разделение на train/val/test
        train_size = int(len(X_seq) * self.config.data_config['train_test_split'])
        val_size = int(len(X_seq) * self.config.data_config['validation_split'])

        X_train = X_seq[:train_size]
        y_train = y_seq[:train_size]

        X_val = X_seq[train_size:train_size + val_size]
        y_val = y_seq[train_size:train_size + val_size]

        X_test = X_seq[train_size + val_size:]
        y_test = y_seq[train_size + val_size:]

        print(f"Размеры данных: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

        # Масштабирование features
        self.scalers['feature'] = StandardScaler()
        X_train_reshaped = X_train.reshape(-1, X_train.shape[-1])
        X_train_scaled = self.scalers['feature'].fit_transform(X_train_reshaped)
        X_train = X_train_scaled.reshape(X_train.shape)

        X_val_reshaped = X_val.reshape(-1, X_val.shape[-1])
        X_val_scaled = self.scalers['feature'].transform(X_val_reshaped)
        X_val = X_val_scaled.reshape(X_val.shape)

        X_test_reshaped = X_test.reshape(-1, X_test.shape[-1])
        X_test_scaled = self.scalers['feature'].transform(X_test_reshaped)
        X_test = X_test_scaled.reshape(X_test.shape)

        # Масштабирование targets
        self.scalers['target'] = StandardScaler()
        y_train_scaled = self.scalers['target'].fit_transform(y_train)
        y_val_scaled = self.scalers['target'].transform(y_val)
        y_test_scaled = self.scalers['target'].transform(y_test)

        # Преобразование targets в словарь для многозадачного обучения
        y_train_dict = {
            'open': y_train_scaled[:, 0],
            'high': y_train_scaled[:, 1],
            'low': y_train_scaled[:, 2],
            'close': y_train_scaled[:, 3]
        }

        y_val_dict = {
            'open': y_val_scaled[:, 0],
            'high': y_val_scaled[:, 1],
            'low': y_val_scaled[:, 2],
            'close': y_val_scaled[:, 3]
        }

        y_test_dict = {
            'open': y_test_scaled[:, 0],
            'high': y_test_scaled[:, 1],
            'low': y_test_scaled[:, 2],
            'close': y_test_scaled[:, 3]
        }

        data_info = {
            'feature_columns': feature_columns,
            'target_columns': target_columns,
            'sequence_length': lookback,
            'n_features': len(feature_columns),  # Только фичи, без целей!
            'original_features_count': len(feature_columns),
            'target_features_count': len(target_columns)
        }

        print(f"Итоговая информация: n_features = {data_info['n_features']}")

        return (X_train, y_train_dict), (X_val, y_val_dict), (X_test, y_test_dict), data_info

    def _create_sequences(self, X_data: np.ndarray, y_data: np.ndarray, lookback: int) -> tuple:
        """Создание последовательностей для обучения"""
        X_seq, y_seq = [], []

        for i in range(lookback, len(X_data)):
            # Входные фичи (только фичи, без целей)
            X_seq.append(X_data[i - lookback:i, :])
            # Целевые переменные (текущий временной шаг)
            y_seq.append(y_data[i, :])

        return np.array(X_seq), np.array(y_seq)

    def train(self, train_data, val_data, model):
        """Обучение модели"""

        X_train, y_train = train_data
        X_val, y_val = val_data

        print(f"Финальная форма X_train: {X_train.shape}")
        print(f"Финальные формы y_train:")
        for key, value in y_train.items():
            print(f"  {key}: {value.shape}")

        # Упрощенные callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=self.config.model_config['patience'],
                restore_best_weights=True,
                verbose=1
            ),
            ModelCheckpoint(
                filepath='app/ml_models/models/model_checkpoints/best_model.keras',
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=10,
                min_lr=1e-7,
                verbose=1
            )
        ]

        # Обучение с уменьшенным количеством эпох для тестирования
        epochs = self.config.model_config['epochs']

        print("Начало обучения...")
        history = model.fit(
            X_train, y_train,
            batch_size=self.config.model_config['batch_size'],
            epochs=epochs,
            validation_data=(X_val, y_val),
            callbacks=callbacks,
            verbose=1,
            shuffle=False
        )

        return history

    def save_model(self, model, path: str):
        """Сохранение модели и скейлеров"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        model.save(path)
        scaler_path = path.replace('.keras', '_scalers.pkl')
        joblib.dump(self.scalers, scaler_path)
        print(f"Модель сохранена: {path}")
        print(f"Скейлеры сохранены: {scaler_path}")

    def load_model(self, path: str):
        """Загрузка модели и скейлеров"""
        model = keras.models.load_model(path)
        scaler_path = path.replace('.keras', '_scalers.pkl')
        if os.path.exists(scaler_path):
            self.scalers = joblib.load(scaler_path)
        return model