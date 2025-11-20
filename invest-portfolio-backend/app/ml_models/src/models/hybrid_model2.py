import tensorflow as tf
from keras.models import Model
from keras.layers import (
    Input, LSTM, Dense, Dropout, Conv1D, MaxPooling1D,
    Flatten, concatenate, BatchNormalization, Attention,
    MultiHeadAttention, LayerNormalization, GlobalAveragePooling1D
)
from keras.optimizers import Adam
from keras.regularizers import l2


class HybridCandleModel:
    def __init__(self, config):
        self.config = config
        self.model = None

    def build_model(self, sequence_length: int, n_features: int) -> Model:
        """Построение гибридной модели с фокусом на определение тренда"""

        # Входной слой
        input_layer = Input(shape=(sequence_length, n_features), name='input')

        # 1. Улучшенная CNN ветка для паттернов разного масштаба
        conv_blocks = []
        for kernel_size in [2, 3, 5]:  # Разные размеры ядер для разных паттернов
            conv = Conv1D(filters=64, kernel_size=kernel_size, activation='relu',
                          padding='same')(input_layer)
            conv = BatchNormalization()(conv)
            conv = MaxPooling1D(pool_size=2)(conv)

            conv = Conv1D(filters=128, kernel_size=kernel_size, activation='relu',
                          padding='same')(conv)
            conv = BatchNormalization()(conv)
            conv = GlobalAveragePooling1D()(conv)
            conv_blocks.append(conv)

        cnn_merged = concatenate(conv_blocks, name='cnn_merge')

        # 2. Улучшенная LSTM ветка с Bidirectional слоями
        lstm1 = LSTM(units=self.config.model_config['lstm_units'][0],
                     return_sequences=True,
                     dropout=0.2,
                     name='lstm1')(input_layer)
        lstm1 = BatchNormalization()(lstm1)

        lstm2 = LSTM(units=self.config.model_config['lstm_units'][1],
                     return_sequences=True,
                     dropout=0.2,
                     name='lstm2')(lstm1)

        # 3. Улучшенный Attention механизм
        attention = MultiHeadAttention(
            num_heads=8,  # Увеличил количество голов
            key_dim=32,
            dropout=0.1,
            name='attention'
        )(lstm2, lstm2)
        attention = LayerNormalization()(attention + lstm2)

        # 4. Слой для извлечения признаков тренда
        trend_features = LSTM(units=32, return_sequences=False,
                              name='trend_lstm')(attention)
        trend_features = BatchNormalization()(trend_features)

        # 5. Объединение всех ветвей
        lstm_pooled = GlobalAveragePooling1D()(attention)

        concatenated = concatenate([
            cnn_merged,
            lstm_pooled,
            trend_features
        ], name='feature_concat')

        # 6. Плотные слои с акцентом на тренд
        # Общие признаки
        shared_dense = Dense(256, activation='relu',
                             kernel_regularizer=l2(0.001))(concatenated)
        shared_dense = BatchNormalization()(shared_dense)
        shared_dense = Dropout(0.3)(shared_dense)

        shared_dense = Dense(128, activation='relu',
                             kernel_regularizer=l2(0.001))(shared_dense)
        shared_dense = Dropout(0.3)(shared_dense)

        # 7. Специализированные ветки для каждой цены
        outputs = {}
        for price_type in ['open', 'high', 'low', 'close']:
            # Индивидуальные слои для каждого типа цены
            price_specific = Dense(64, activation='relu',
                                   name=f'{price_type}_specific')(shared_dense)
            price_specific = Dropout(0.2)(price_specific)

            outputs[price_type] = Dense(1, name=price_type)(price_specific)

        # 8. ДОПОЛНИТЕЛЬНЫЙ ВЫХОД ДЛЯ ТРЕНДА (главный приоритет)
        trend_output = Dense(64, activation='relu')(shared_dense)
        trend_output = Dropout(0.2)(trend_output)
        trend_output = Dense(3, activation='softmax', name='trend')(
            trend_output)  # 3 класса: вниз, боковик, вверх

        # Добавляем тренд к выходам
        outputs['trend'] = trend_output

        # Создание модели
        model = Model(inputs=input_layer, outputs=outputs)

        # Компиляция с приоритетом на тренд
        model.compile(
            optimizer=Adam(learning_rate=self.config.model_config['learning_rate']),
            loss={
                'open': 'mse',
                'high': 'mse',
                'low': 'mse',
                'close': 'mse',
                'trend': 'categorical_crossentropy'  # Классификация тренда
            },
            loss_weights={
                'open': 0.1,  # Уменьшил веса цен
                'high': 0.1,
                'low': 0.1,
                'close': 0.2,  # Close важнее других цен
                'trend': 0.5  # Главный приоритет - тренд
            },
            metrics={
                'close': ['mae', 'mse'],
                'trend': ['accuracy']  # Основная метрика - точность тренда
            }
        )

        self.model = model
        return model

    def summary(self):
        """Вывод структуры модели"""
        if self.model:
            return self.model.summary()

