import tensorflow as tf
from keras.models import Model
from keras.layers import (
    Input, LSTM, Dense, Dropout, Conv1D, MaxPooling1D,
    Flatten, concatenate, BatchNormalization, Attention,
    MultiHeadAttention, LayerNormalization
)
from keras.optimizers import Adam
from keras.regularizers import l2


class HybridCandleModel:
    def __init__(self, config):
        self.config = config
        self.model = None

    def build_model(self, sequence_length: int, n_features: int) -> Model:
        """Построение гибридной модели"""

        # Входной слой
        input_layer = Input(shape=(sequence_length, n_features), name='input')

        # 1. CNN ветка для локальных паттернов
        conv1 = Conv1D(filters=64, kernel_size=3, activation='relu',
                       padding='same', name='conv1')(input_layer)
        conv1 = BatchNormalization()(conv1)
        conv1 = MaxPooling1D(pool_size=2, name='pool1')(conv1)

        conv2 = Conv1D(filters=128, kernel_size=3, activation='relu',
                       padding='same', name='conv2')(conv1)
        conv2 = BatchNormalization()(conv2)
        conv2 = MaxPooling1D(pool_size=2, name='pool2')(conv2)

        # 2. LSTM ветка для временных зависимостей
        lstm1 = LSTM(units=self.config.model_config['lstm_units'][0],
                     return_sequences=True,
                     dropout=0.2,
                     name='lstm1')(input_layer)
        lstm1 = BatchNormalization()(lstm1)

        lstm2 = LSTM(units=self.config.model_config['lstm_units'][1],
                     return_sequences=True,
                     dropout=0.2,
                     name='lstm2')(lstm1)

        # 3. Attention механизм
        attention = MultiHeadAttention(
            num_heads=4,
            key_dim=32,
            dropout=0.1,
            name='attention'
        )(lstm2, lstm2)

        attention = LayerNormalization()(attention + lstm2)

        # 4. Объединение CNN и LSTM ветвей
        cnn_flatten = Flatten()(conv2)
        lstm_flatten = Flatten()(attention)

        concatenated = concatenate([cnn_flatten, lstm_flatten], name='concat')

        # 5. Плотные слои
        dense1 = Dense(self.config.model_config['dense_units'][0],
                       activation='relu',
                       kernel_regularizer=l2(0.001),
                       name='dense1')(concatenated)
        dense1 = BatchNormalization()(dense1)
        dense1 = Dropout(self.config.model_config['dropout_rate'])(dense1)

        dense2 = Dense(self.config.model_config['dense_units'][1],
                       activation='relu',
                       kernel_regularizer=l2(0.001),
                       name='dense2')(dense1)
        dense2 = Dropout(self.config.model_config['dropout_rate'])(dense2)

        # 6. Многозадачный выход
        outputs = {
            'open': Dense(1, name='open')(dense2),
            'high': Dense(1, name='high')(dense2),
            'low': Dense(1, name='low')(dense2),
            'close': Dense(1, name='close')(dense2)
        }

        # Создание модели
        model = Model(inputs=input_layer, outputs=outputs)

        # Компиляция с разными весами для каждой задачи
        model.compile(
            optimizer=Adam(learning_rate=self.config.model_config['learning_rate']),
            loss={
                'open': 'mse',
                'high': 'mse',
                'low': 'mse',
                'close': 'mse'
            },
            loss_weights={
                'open': 0.25,
                'high': 0.25,
                'low': 0.25,
                'close': 0.25
            },
            metrics={'close': ['mae', 'mse']}  # Основная метрика по close price
        )

        self.model = model
        return model

    def summary(self):
        """Вывод структуры модели"""
        if self.model:
            return self.model.summary()