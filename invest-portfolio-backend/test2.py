import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib
import keras

from app.ml_models.src.utils.config import Config
from database.db_connection import db_connection, close_connection
from app.ml_models.src.data_processing.feature_engineer import FeatureEngineer
from app.ml_models.src.models.model_trainer2 import ModelTrainer


def add_missing_features(df: pd.DataFrame, required_feature_columns: list) -> pd.DataFrame:
    """
    Добавляет все недостающие фичи, которые использовались при обучении модели
    """
    print(f"🔧 Добавление недостающих фичей. Требуется: {len(required_feature_columns)} фич")
    print(f"Исходные колонки: {list(df.columns)}")

    # Создаем копию датафрейма
    df_processed = df.copy()

    # Конвертируем числовые колонки
    numeric_columns = ['open', 'high', 'low', 'close', 'volume']
    for col in numeric_columns:
        if col in df_processed.columns:
            df_processed[col] = pd.to_numeric(df_processed[col], errors='coerce')

    # Заполняем пропуски
    df_processed[numeric_columns] = df_processed[numeric_columns].fillna(method='ffill').fillna(method='bfill')

    # Словарь для хранения созданных фич
    created_features = []

    # 1. Базовые ценовые фичи (должны уже быть)
    basic_features = ['open', 'high', 'low', 'close', 'volume']

    # 2. Технические индикаторы
    technical_indicators = []

    # Скользящие средние
    for window in [5, 10, 20, 50]:
        ma_col = f'ma_{window}'
        if ma_col in required_feature_columns and ma_col not in df_processed.columns:
            df_processed[ma_col] = df_processed['close'].rolling(window=window, min_periods=1).mean()
            technical_indicators.append(ma_col)
            created_features.append(ma_col)

        ema_col = f'ema_{window}'
        if ema_col in required_feature_columns and ema_col not in df_processed.columns:
            df_processed[ema_col] = df_processed['close'].ewm(span=window, min_periods=1).mean()
            technical_indicators.append(ema_col)
            created_features.append(ema_col)

        # Отношения цен
        price_ma_col = f'price_ma_ratio_{window}'
        if price_ma_col in required_feature_columns and price_ma_col not in df_processed.columns:
            if ma_col in df_processed.columns:
                df_processed[price_ma_col] = df_processed['close'] / df_processed[ma_col].replace(0, 1e-10)
                technical_indicators.append(price_ma_col)
                created_features.append(price_ma_col)

        price_ema_col = f'price_ema_ratio_{window}'
        if price_ema_col in required_feature_columns and price_ema_col not in df_processed.columns:
            if ema_col in df_processed.columns:
                df_processed[price_ema_col] = df_processed['close'] / df_processed[ema_col].replace(0, 1e-10)
                technical_indicators.append(price_ema_col)
                created_features.append(price_ema_col)

    # Направление тренда
    for window in [5, 10, 20]:
        trend_dir_col = f'trend_direction_{window}'
        if trend_dir_col in required_feature_columns and trend_dir_col not in df_processed.columns:
            price_diff = df_processed['close'].diff(window)
            df_processed[trend_dir_col] = np.where(
                price_diff > 0, 1, np.where(price_diff < 0, -1, 0)
            )
            technical_indicators.append(trend_dir_col)
            created_features.append(trend_dir_col)

    # Волатильность
    for window in [10, 20]:
        vol_col = f'trend_volatility_{window}'
        if vol_col in required_feature_columns and vol_col not in df_processed.columns:
            df_processed[vol_col] = df_processed['close'].rolling(window, min_periods=1).std()
            technical_indicators.append(vol_col)
            created_features.append(vol_col)

        range_col = f'trend_range_{window}'
        if range_col in required_feature_columns and range_col not in df_processed.columns:
            high_max = df_processed['high'].rolling(window, min_periods=1).max()
            low_min = df_processed['low'].rolling(window, min_periods=1).min()
            df_processed[range_col] = (high_max - low_min) / df_processed['close'].replace(0, 1e-10)
            technical_indicators.append(range_col)
            created_features.append(range_col)

    # Моментум индикаторы
    for window in [5, 10, 14]:
        rsi_col = f'momentum_rsi_{window}'
        if rsi_col in required_feature_columns and rsi_col not in df_processed.columns:
            delta = df_processed['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=window, min_periods=1).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=window, min_periods=1).mean()
            rs = gain / loss.replace(0, 1e-10)
            df_processed[rsi_col] = 100 - (100 / (1 + rs))
            technical_indicators.append(rsi_col)
            created_features.append(rsi_col)

    # MACD
    macd_features = ['macd', 'macd_signal', 'macd_histogram']
    for macd_col in macd_features:
        if macd_col in required_feature_columns and macd_col not in df_processed.columns:
            exp1 = df_processed['close'].ewm(span=12, min_periods=1).mean()
            exp2 = df_processed['close'].ewm(span=26, min_periods=1).mean()
            df_processed['macd'] = exp1 - exp2
            df_processed['macd_signal'] = df_processed['macd'].ewm(span=9, min_periods=1).mean()
            df_processed['macd_histogram'] = df_processed['macd'] - df_processed['macd_signal']
            technical_indicators.extend(macd_features)
            created_features.extend(macd_features)
            break

    # Поддержка и сопротивление
    for window in [20, 50]:
        support_col = f'support_{window}'
        if support_col in required_feature_columns and support_col not in df_processed.columns:
            df_processed[support_col] = df_processed['low'].rolling(window, min_periods=1).min()
            technical_indicators.append(support_col)
            created_features.append(support_col)

        resistance_col = f'resistance_{window}'
        if resistance_col in required_feature_columns and resistance_col not in df_processed.columns:
            df_processed[resistance_col] = df_processed['high'].rolling(window, min_periods=1).max()
            technical_indicators.append(resistance_col)
            created_features.append(resistance_col)

        price_support_col = f'price_to_support_{window}'
        if price_support_col in required_feature_columns and price_support_col not in df_processed.columns:
            if support_col in df_processed.columns:
                df_processed[price_support_col] = (df_processed['close'] - df_processed[support_col]) / df_processed[
                    'close'].replace(0, 1e-10)
                technical_indicators.append(price_support_col)
                created_features.append(price_support_col)

        price_resistance_col = f'price_to_resistance_{window}'
        if price_resistance_col in required_feature_columns and price_resistance_col not in df_processed.columns:
            if resistance_col in df_processed.columns:
                df_processed[price_resistance_col] = (df_processed[resistance_col] - df_processed['close']) / \
                                                     df_processed['close'].replace(0, 1e-10)
                technical_indicators.append(price_resistance_col)
                created_features.append(price_resistance_col)

    # Объемные индикаторы
    volume_features = ['volume_ma_ratio', 'price_volume_trend']
    for vol_feat in volume_features:
        if vol_feat in required_feature_columns and vol_feat not in df_processed.columns:
            if vol_feat == 'volume_ma_ratio':
                volume_ma = df_processed['volume'].rolling(20, min_periods=1).mean()
                df_processed['volume_ma_ratio'] = df_processed['volume'] / volume_ma.replace(0, 1e-10)
                technical_indicators.append('volume_ma_ratio')
                created_features.append('volume_ma_ratio')
            elif vol_feat == 'price_volume_trend':
                df_processed['price_volume_trend'] = np.where(
                    (df_processed['close'].diff() > 0) & (df_processed['volume'].diff() > 0), 1,
                    np.where((df_processed['close'].diff() < 0) & (df_processed['volume'].diff() > 0), -1, 0)
                )
                technical_indicators.append('price_volume_trend')
                created_features.append('price_volume_trend')

    # Простые фичи тренда
    for period in [1, 3, 5]:
        momentum_col = f'price_momentum_{period}'
        if momentum_col in required_feature_columns and momentum_col not in df_processed.columns:
            df_processed[momentum_col] = (df_processed['close'] - df_processed['close'].shift(period)) / df_processed[
                'close'].shift(period).replace(0, 1e-10)
            technical_indicators.append(momentum_col)
            created_features.append(momentum_col)

    if 'trend_acceleration' in required_feature_columns and 'trend_acceleration' not in df_processed.columns:
        df_processed['trend_acceleration'] = df_processed['close'].diff().diff()
        technical_indicators.append('trend_acceleration')
        created_features.append('trend_acceleration')

    # 3. Временные фичи
    time_features = []
    if 'day_of_week' in required_feature_columns and 'day_of_week' not in df_processed.columns:
        if 'datetime' in df_processed.columns:
            df_processed['day_of_week'] = pd.to_datetime(df_processed['datetime']).dt.dayofweek
            time_features.append('day_of_week')
            created_features.append('day_of_week')
        elif df_processed.index.dtype == 'datetime64[ns]':
            df_processed['day_of_week'] = df_processed.index.dayofweek
            time_features.append('day_of_week')
            created_features.append('day_of_week')

    if 'hour' in required_feature_columns and 'hour' not in df_processed.columns:
        if 'datetime' in df_processed.columns:
            df_processed['hour'] = pd.to_datetime(df_processed['datetime']).dt.hour
            time_features.append('hour')
            created_features.append('hour')
        elif df_processed.index.dtype == 'datetime64[ns]':
            df_processed['hour'] = df_processed.index.hour
            time_features.append('hour')
            created_features.append('hour')

    # 4. Дополнительные свечные фичи
    additional_features = []
    candle_features = ['price_range', 'body_size', 'upper_shadow', 'lower_shadow']
    for candle_feat in candle_features:
        if candle_feat in required_feature_columns and candle_feat not in df_processed.columns:
            if candle_feat == 'price_range':
                df_processed['price_range'] = df_processed['high'] - df_processed['low']
            elif candle_feat == 'body_size':
                df_processed['body_size'] = abs(df_processed['close'] - df_processed['open'])
            elif candle_feat == 'upper_shadow':
                df_processed['upper_shadow'] = df_processed['high'] - np.maximum(df_processed['open'],
                                                                                 df_processed['close'])
            elif candle_feat == 'lower_shadow':
                df_processed['lower_shadow'] = np.minimum(df_processed['open'], df_processed['close']) - df_processed[
                    'low']

            additional_features.append(candle_feat)
            created_features.append(candle_feat)

    # Заполняем все NaN значения
    all_features = basic_features + technical_indicators + time_features + additional_features
    df_processed[all_features] = df_processed[all_features].fillna(method='ffill').fillna(method='bfill').fillna(0)

    print(f"✅ Создано {len(created_features)} фич: {created_features}")

    # Проверяем, что все требуемые фичи присутствуют
    missing_features = set(required_feature_columns) - set(df_processed.columns)
    if missing_features:
        print(f"⚠️ Предупреждение: не удалось создать фичи: {missing_features}")
        # Добавляем фичи по умолчанию (нули)
        for feature in missing_features:
            df_processed[feature] = 0.0
            print(f"   Добавлена фича по умолчанию: {feature}")

    # Убедимся, что порядок фичей соответствует ожидаемому
    final_features = [col for col in required_feature_columns if col in df_processed.columns]
    print(f"📊 Итоговое количество фич: {len(final_features)}")

    return df_processed[final_features]  # Возвращаем только нужные колонки в правильном порядке


def predict_next_candle(df, scalers, model):
    config = Config()
    feature_engineer = FeatureEngineer(config)

    # Подготавливаем данные для предсказания
    feature_columns = [
        # Базовые ценовые фичи (5)
        'open', 'high', 'low', 'close', 'volume',

        # Скользящие средние и EMA (8)
        'ma_5', 'ema_5', 'ma_10', 'ema_10', 'ma_20', 'ema_20', 'ma_50', 'ema_50',

        # Отношения цен к скользящим средним (8)
        'price_ma_ratio_5', 'price_ema_ratio_5',
        'price_ma_ratio_10', 'price_ema_ratio_10',
        'price_ma_ratio_20', 'price_ema_ratio_20',
        'price_ma_ratio_50', 'price_ema_ratio_50',

        # Направление тренда (3)
        'trend_direction_5', 'trend_direction_10', 'trend_direction_20',

        # Волатильность тренда (4)
        'trend_volatility_10', 'trend_range_10',
        'trend_volatility_20', 'trend_range_20',

        # Моментум индикаторы (3)
        'momentum_rsi_5', 'momentum_rsi_10', 'momentum_rsi_14',

        # MACD компоненты (3)
        'macd', 'macd_signal', 'macd_histogram',

        # Поддержка и сопротивление (8)
        'support_20', 'resistance_20', 'price_to_support_20', 'price_to_resistance_20',
        'support_50', 'resistance_50', 'price_to_support_50', 'price_to_resistance_50',

        # Объемные индикаторы (2)
        'volume_ma_ratio', 'price_volume_trend',

        # Простые фичи тренда (4)
        'price_momentum_1', 'price_momentum_3', 'price_momentum_5', 'trend_acceleration',

        # Временные фичи (2)
        'day_of_week', 'hour',

        # Дополнительные свечные фичи (4)
        'price_range', 'body_size', 'upper_shadow', 'lower_shadow'
    ]

    recent_data = add_missing_features(df, feature_columns).tail(60).values

    scaled_data = scalers['feature'].transform(recent_data)
    input_sequence = scaled_data.reshape(1, 60, len(feature_columns))

    # Предсказание
    prediction = model.predict(input_sequence)

    # Обратное масштабирование
    temp_array = np.zeros((1, 4))
    result = {}
    for i, key in enumerate(['open', 'high', 'low', 'close']):
        temp_array[0, i] = prediction[key][0][0]
        unscaled = scalers['target'].inverse_transform(temp_array)
        result[key] = unscaled[0, i]
        temp_array[0, i] = 0  # сброс

    return result


def predict_multiple_candles(df, scalers, model, steps=5):
    predictions = []
    current_data = df.copy()

    for _ in range(steps):
        # Предсказываем следующую свечу
        pred = predict_next_candle(current_data, scalers, model)

        # Создаем новую строку с предсказанием
        new_row = current_data.iloc[-1:].copy()
        new_row['datetime'] += pd.Timedelta(hours=1)
        for key, value in pred.items():
            new_row[key] = value

        predictions.append((pred['open'], pred['high'], pred['low'], pred['close']))
        # Добавляем к данным для следующего предсказания
        current_data = pd.concat([current_data, new_row])

    return predictions


# Простой пример использования
def simple_example():
    # Загрузка модели
    model = keras.models.load_model('app/ml_models/models/trained/hybrid_candle_model.keras')
    scalers = joblib.load('app/ml_models/models/trained/hybrid_candle_model_scalers.pkl')

    # Создаем тестовые данные
    ticker = 'sber'

    connection = db_connection()
    cursor = connection.cursor()

    queue = f"""SELECT date, open, high, low, close, volume
                   FROM {ticker}
                   WHERE date < '2025-10-21'
                   ORDER BY date DESC
                   LIMIT 84"""
    cursor.execute(queue)
    data = cursor.fetchall()[::-1]

    close_connection(connection)

    df = pd.DataFrame(data=data[0:60], columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
    print(df)

    prediction_result = predict_multiple_candles(df, scalers, model, steps=24)

    # Для тестирования
    test_df = pd.DataFrame(data=data[60:], columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
    res_df = pd.DataFrame(data=prediction_result, columns=['open', 'high', 'low', 'close'])

    metric = 'close'

    a = []
    for i in range(5):
        test_value = round(float(test_df.loc[i, metric]), 2)
        res_value = round(float(res_df.loc[i, metric]), 2)

        print(f'Дата время: {test_df.loc[i, "datetime"]}')
        print(f'Историческая цена: {test_value}')
        print(f'Предсказание: {res_value}')
        print(f'Разница: {test_value - res_value:.2f}')
        a.append(abs(round(test_value - res_value, 2)))
        print()
        print('-' * 50)
        print()

    print(f'Средняя разность: {sum(a) / len(a):.2f}')

    # Простой график
    plt.figure(figsize=(10, 6))
    plt.plot(test_df['datetime'], test_df[metric], label='Исторические данные', color='blue')
    plt.plot(test_df['datetime'], res_df[metric], label='Предсказанные данные', color='red')
    plt.title('Исторические данные цены')
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    simple_example()
