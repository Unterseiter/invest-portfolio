import keras

from keras import Model, Input
from keras.layers import (Dense, LSTM, Dropout, MaxPooling1D, BatchNormalization, Conv1D, Flatten,
concatenate, MultiHeadAttention, LayerNormalization
)


class MlModelTrend:

    def create_model(self, l, w):
        input_layer = keras.Input(shape=(w, l, 1), name='input')

        # x = keras.layers.Rescaling(1./255)(input_layer)
        x = keras.layers.Conv2D(128, 3, activation='relu')(input_layer)
        x = keras.layers.MaxPooling2D()(x)

        x = keras.layers.Conv2D(64, 3, activation='relu')(x)
        x = keras.layers.MaxPooling2D()(x)

        # x = keras.layers.Conv2D(32, 3, activation='relu')(x)
        # x = keras.layers.MaxPooling2D()(x)

        x = keras.layers.Flatten()(x)

        x = keras.layers.Dense(128, activation='relu')(x)
        x = keras.layers.Dropout(0.4)(x)

        output = keras.layers.Dense(3, activation='softmax')(x)

        model = keras.Model(inputs=input_layer, outputs=output)

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        return model


class MlModelStock:

    def create_model(self, n_feature, length):
        # Входной слой
        input_layer = Input(shape=(length, n_feature), name='input')

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
        lstm1 = LSTM(100,
                     return_sequences=True,
                     dropout=0.3,
                     name='lstm1')(input_layer)
        lstm1 = BatchNormalization()(lstm1)

        lstm2 = LSTM(50,
                     return_sequences=True,
                     dropout=0.3,
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

        concatenated = concatenate([lstm_flatten, cnn_flatten], name='concat')

        # 5. Плотные слои
        dense1 = Dense(64,
                       activation='relu',
                       kernel_regularizer=keras.regularizers.l2(0.01),
                       name='dense1')(concatenated)
        dense1 = BatchNormalization()(dense1)
        dense1 = Dropout(0.3)(dense1)

        dense2 = Dense(32,
                       activation='relu',
                       kernel_regularizer=keras.regularizers.l2(0.01),
                       name='dense2')(dense1)
        dense2 = Dropout(0.3)(dense2)

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
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss={
                'open': 'mae',
                'high': 'mae',
                'low': 'mae',
                'close': 'mae'
            },
            loss_weights={
                'open': 0.2,
                'high': 0.2,
                'low': 0.2,
                'close': 0.4
            },
            metrics={'close': ['mae', 'mse']}  # Основная метрика по close price
        )

        return model


