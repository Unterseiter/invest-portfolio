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
        """Подготовка данных для обучения с фичами тренда"""

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

        # 🔥 ДОБАВЛЯЕМ ФИЧИ ТРЕНДА
        trend_features = self._add_trend_features(df_processed)
        feature_columns.extend(trend_features)

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

        # 🔥 СОЗДАЕМ МЕТКИ ТРЕНДА для многозадачного обучения
        y_trend = self._create_trend_labels(df_processed, lookback)

        # Разделение на train/val/test
        train_size = int(len(X_seq) * self.config.data_config['train_test_split'])
        val_size = int(len(X_seq) * self.config.data_config['validation_split'])

        X_train = X_seq[:train_size]
        y_train = y_seq[:train_size]
        y_train_trend = y_trend[:train_size]

        X_val = X_seq[train_size:train_size + val_size]
        y_val = y_seq[train_size:train_size + val_size]
        y_val_trend = y_trend[train_size:train_size + val_size]

        X_test = X_seq[train_size + val_size:]
        y_test = y_seq[train_size + val_size:]
        y_test_trend = y_trend[train_size + val_size:]

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

        # 🔥 Преобразование targets в словарь для многозадачного обучения С ТРЕНДОМ
        y_train_dict = {
            'open': y_train_scaled[:, 0],
            'high': y_train_scaled[:, 1],
            'low': y_train_scaled[:, 2],
            'close': y_train_scaled[:, 3],
            'trend': y_train_trend  # Добавляем метки тренда
        }

        y_val_dict = {
            'open': y_val_scaled[:, 0],
            'high': y_val_scaled[:, 1],
            'low': y_val_scaled[:, 2],
            'close': y_val_scaled[:, 3],
            'trend': y_val_trend
        }

        y_test_dict = {
            'open': y_test_scaled[:, 0],
            'high': y_test_scaled[:, 1],
            'low': y_test_scaled[:, 2],
            'close': y_test_scaled[:, 3],
            'trend': y_test_trend
        }

        data_info = {
            'feature_columns': feature_columns,
            'target_columns': target_columns,
            'sequence_length': lookback,
            'n_features': len(feature_columns),
            'original_features_count': len(feature_columns),
            'target_features_count': len(target_columns),
            'trend_classes': y_train_trend.shape[1] if len(y_train_trend.shape) > 1 else 1
        }

        print(f"Итоговая информация: n_features = {data_info['n_features']}")
        print(f"Классы тренда: {data_info['trend_classes']}")

        return (X_train, y_train_dict), (X_val, y_val_dict), (X_test, y_test_dict), data_info

    def _add_trend_features(self, df: pd.DataFrame) -> list:
        """Добавление фич для определения тренда"""
        trend_features = []

        # Конвертируем числовые колонки в float для избежания проблем с типами
        numeric_columns = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Заполняем пропуски
        df[numeric_columns] = df[numeric_columns].fillna(method='ffill')

        # 1. Скользящие средние разных периодов
        for window in [5, 10, 20, 50]:
            df[f'ma_{window}'] = df['close'].rolling(window=window, min_periods=1).mean()
            df[f'ema_{window}'] = df['close'].ewm(span=window, min_periods=1).mean()
            trend_features.extend([f'ma_{window}', f'ema_{window}'])

            # Отношение цены к скользящим средним (с защитой от деления на 0)
            df[f'price_ma_ratio_{window}'] = df['close'] / df[f'ma_{window}'].replace(0, 1e-10)
            df[f'price_ema_ratio_{window}'] = df['close'] / df[f'ema_{window}'].replace(0, 1e-10)
            trend_features.extend([f'price_ma_ratio_{window}', f'price_ema_ratio_{window}'])

        # 2. Направление тренда (производные)
        for window in [5, 10, 20]:
            # Используем diff с последующей обработкой
            price_diff = df['close'].diff(window)
            df[f'trend_direction_{window}'] = np.where(
                price_diff > 0, 1, np.where(price_diff < 0, -1, 0)
            )
            trend_features.append(f'trend_direction_{window}')

        # 3. Волатильность тренда
        for window in [10, 20]:
            df[f'trend_volatility_{window}'] = df['close'].rolling(window, min_periods=1).std()
            high_max = df['high'].rolling(window, min_periods=1).max()
            low_min = df['low'].rolling(window, min_periods=1).min()
            df[f'trend_range_{window}'] = (high_max - low_min) / df['close'].replace(0, 1e-10)

            # Заполняем NaN значения
            df[f'trend_volatility_{window}'] = df[f'trend_volatility_{window}'].fillna(0)
            df[f'trend_range_{window}'] = df[f'trend_range_{window}'].fillna(0)

            trend_features.extend([f'trend_volatility_{window}', f'trend_range_{window}'])

        # 4. Моментум индикаторы
        for window in [5, 10, 14]:
            # RSI-like feature
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=window, min_periods=1).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=window, min_periods=1).mean()

            # Защита от деления на 0
            rs = gain / loss.replace(0, 1e-10)
            df[f'momentum_rsi_{window}'] = 100 - (100 / (1 + rs))

            # Заполняем NaN
            df[f'momentum_rsi_{window}'] = df[f'momentum_rsi_{window}'].fillna(50)
            trend_features.append(f'momentum_rsi_{window}')

        # 5. MACD компоненты
        exp1 = df['close'].ewm(span=12, min_periods=1).mean()
        exp2 = df['close'].ewm(span=26, min_periods=1).mean()
        df['macd'] = exp1 - exp2
        df['macd_signal'] = df['macd'].ewm(span=9, min_periods=1).mean()
        df['macd_histogram'] = df['macd'] - df['macd_signal']

        # Заполняем NaN
        df['macd'] = df['macd'].fillna(0)
        df['macd_signal'] = df['macd_signal'].fillna(0)
        df['macd_histogram'] = df['macd_histogram'].fillna(0)

        trend_features.extend(['macd', 'macd_signal', 'macd_histogram'])

        # 6. Поддержка и сопротивление
        for window in [20, 50]:
            df[f'support_{window}'] = df['low'].rolling(window, min_periods=1).min()
            df[f'resistance_{window}'] = df['high'].rolling(window, min_periods=1).max()

            # Отношения цены к поддержке/сопротивлению
            df[f'price_to_support_{window}'] = (df['close'] - df[f'support_{window}']) / df['close'].replace(0, 1e-10)
            df[f'price_to_resistance_{window}'] = (df[f'resistance_{window}'] - df['close']) / df['close'].replace(0,
                                                                                                                   1e-10)

            # Заполняем NaN
            df[f'support_{window}'] = df[f'support_{window}'].fillna(df['close'])
            df[f'resistance_{window}'] = df[f'resistance_{window}'].fillna(df['close'])
            df[f'price_to_support_{window}'] = df[f'price_to_support_{window}'].fillna(0)
            df[f'price_to_resistance_{window}'] = df[f'price_to_resistance_{window}'].fillna(0)

            trend_features.extend([
                f'support_{window}', f'resistance_{window}',
                f'price_to_support_{window}', f'price_to_resistance_{window}'
            ])

        # 7. Объемные индикаторы тренда
        volume_ma = df['volume'].rolling(20, min_periods=1).mean()
        df['volume_ma_ratio'] = df['volume'] / volume_ma.replace(0, 1e-10)
        df['volume_ma_ratio'] = df['volume_ma_ratio'].fillna(1)

        # Корреляция цена-объем (упрощенная версия)
        df['price_volume_trend'] = np.where(
            (df['close'].diff() > 0) & (df['volume'].diff() > 0), 1,
            np.where((df['close'].diff() < 0) & (df['volume'].diff() > 0), -1, 0)
        )

        trend_features.extend(['volume_ma_ratio', 'price_volume_trend'])

        # 8. Простые, но эффективные фичи тренда
        # Ценовой моментум
        for period in [1, 3, 5]:
            df[f'price_momentum_{period}'] = (df['close'] - df['close'].shift(period)) / df['close'].shift(
                period).replace(0, 1e-10)
            df[f'price_momentum_{period}'] = df[f'price_momentum_{period}'].fillna(0)
            trend_features.append(f'price_momentum_{period}')

        # Ускорение тренда
        df['trend_acceleration'] = df['close'].diff().diff()
        df['trend_acceleration'] = df['trend_acceleration'].fillna(0)
        trend_features.append('trend_acceleration')

        # Удаляем временные NaN значения в начале датафрейма
        df[trend_features] = df[trend_features].fillna(method='bfill').fillna(method='ffill')

        print(f"✅ Добавлено {len(trend_features)} фич тренда")
        print(f"📊 Пример фич тренда: {trend_features[:10]}...")

        return trend_features

    def _create_trend_labels(self, df: pd.DataFrame, lookback: int, lookforward: int = 5) -> np.ndarray:
        """Создание меток тренда для многозадачного обучения"""

        # Убедимся, что close в числовом формате
        close_prices = pd.to_numeric(df['close'], errors='coerce').values
        close_prices = np.nan_to_num(close_prices, nan=0.0)

        trend_labels = []

        for i in range(lookback, len(close_prices)):
            if i + lookforward >= len(close_prices):
                # Для последних элементов используем боковой тренд
                trend_labels.append([0, 1, 0])
                continue

            current_price = close_prices[i]
            future_price = close_prices[i + lookforward]

            if current_price == 0:  # Защита от деления на 0
                trend_labels.append([0, 1, 0])
                continue

            # Процент изменения
            change_percent = (future_price - current_price) / current_price * 100

            # 🔥 УМНАЯ КЛАССИФИКАЦИЯ ТРЕНДА
            # Используем историческую волатильность для динамического порога
            history_window = close_prices[max(0, i - lookback):i]
            if len(history_window) > 1:
                volatility = np.std(history_window)
                threshold = volatility / current_price * 100 * 2  # Порог в %
            else:
                threshold = 2.0  # Порог по умолчанию

            if change_percent > threshold:  # Восходящий тренд
                trend_label = [0, 0, 1]
            elif change_percent < -threshold:  # Нисходящий тренд
                trend_label = [1, 0, 0]
            else:  # Боковой тренд
                trend_label = [0, 1, 0]

            trend_labels.append(trend_label)

        # Добавляем метки для первых lookback элементов
        for _ in range(lookback):
            trend_labels.insert(0, [0, 1, 0])  # Боковой тренд по умолчанию

        trend_array = np.array(trend_labels[:len(close_prices)])

        # Анализ распределения классов
        class_distribution = np.sum(trend_array, axis=0)
        print(f"📊 Распределение классов тренда: DOWN={class_distribution[0]}, "
              f"SIDEWAYS={class_distribution[1]}, UP={class_distribution[2]}")

        return trend_array

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
        """Обучение модели с фокусом на определение тренда"""

        X_train, y_train = train_data
        X_val, y_val = val_data

        print(f"Финальная форма X_train: {X_train.shape}")
        print(f"Финальные формы y_train:")
        for key, value in y_train.items():
            print(f"  {key}: {value.shape}")

        # Убедимся, что есть данные о тренде
        if 'trend' not in y_train:
            print("⚠️ Внимание: метки тренда не найдены! Добавьте 'trend' в y_train")
            print("Доступные ключи:", list(y_train.keys()))
            return None

        # Улучшенные callbacks с фокусом на тренд
        callbacks = [
            EarlyStopping(
                monitor='val_trend_accuracy',  # Основная метрика - точность тренда
                patience=self.config.model_config['patience'],
                restore_best_weights=True,
                mode='max',  # Максимизируем точность
                verbose=1
            ),
            ModelCheckpoint(
                filepath='app/ml_models/models/model_checkpoints/best_model.keras',
                monitor='val_trend_accuracy',  # Сохраняем по точности тренда
                save_best_only=True,
                mode='max',
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_trend_loss',  # Следим за loss тренда
                factor=0.5,
                patience=8,  # Уменьшил patience для более быстрой адаптации
                min_lr=1e-7,
                mode='min',
                verbose=1
            ),
            # Добавляем callback для логирования метрик тренда
            keras.callbacks.CSVLogger(
                'app/ml_models/models/training_log.csv',
                separator=',',
                append=False
            )
        ]

        # Настройка весов для сбалансированного обучения тренда
        class_weights = self.calculate_trend_class_weights(y_train['trend'])

        # Обучение с мониторингом тренда
        epochs = self.config.model_config['epochs']

        print("Начало обучения с фокусом на определение тренда...")
        print(f"Размер батча: {self.config.model_config['batch_size']}")
        print(f"Максимальное количество эпох: {epochs}")

        try:
            history = model.fit(
                X_train, y_train,
                batch_size=self.config.model_config['batch_size'],
                epochs=epochs,
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                verbose=1,
                shuffle=False,  # Важно для временных рядов
                class_weight={'trend': class_weights}  # Веса для балансировки классов тренда
            )


            return history

        except Exception as e:
            print(f"❌ Ошибка при обучении: {e}")
            # Fallback: обучение с стандартными настройками
            print("Попытка обучения с стандартными настройками...")
            callbacks_simple = [
                EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True),
                ModelCheckpoint('app/ml_models/models/model_checkpoints/best_model_fallback.keras',
                                monitor='val_loss', save_best_only=True)
            ]

            history = model.fit(
                X_train, y_train,
                batch_size=self.config.model_config['batch_size'],
                epochs=min(epochs, 50),  # Уменьшаем эпохи для fallback
                validation_data=(X_val, y_val),
                callbacks=callbacks_simple,
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
        return

    def calculate_trend_class_weights(self, trend_labels):
        """Расчет весов классов для сбалансированного обучения тренда"""
        import numpy as np

        # Преобразуем one-hot в числовые метки
        class_labels = np.argmax(trend_labels, axis=1)

        # Считаем количество примеров каждого класса
        class_counts = np.bincount(class_labels)

        # Расчет весов (обратно пропорционально количеству)
        total_samples = len(class_labels)
        num_classes = len(class_counts)

        class_weights = {}
        for i in range(num_classes):
            if class_counts[i] > 0:
                class_weights[i] = total_samples / (num_classes * class_counts[i])
            else:
                class_weights[i] = 1.0  # Если класса нет, вес = 1

        print(f"Веса классов тренда: {class_weights}")
        print(f"Распределение классов: {dict(zip(range(num_classes), class_counts))}")

        return class_weights