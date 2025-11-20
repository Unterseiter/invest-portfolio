import pandas as pd
import numpy as np
import os
from app.ml_models.src.utils.config import Config
from app.ml_models.src.data_processing.feature_engineer import FeatureEngineer
from app.ml_models.src.models.hybrid_model2 import HybridCandleModel
from app.ml_models.src.models.model_trainer2 import ModelTrainer
from database.db_connection import db_connection, close_connection


def main():
    # Загрузка конфигурации
    config = Config()
    ticker = 'sber'

    connection = db_connection()
    cursor = connection.cursor()

    queue = f"""SELECT date, open, high, low, close, volume
               FROM {ticker}
               ORDER BY date DESC"""
    cursor.execute(queue)
    data = cursor.fetchall()

    df = pd.DataFrame(data=data, columns=['datetime', 'open', 'high', 'low', 'close', 'volume'])
    close_connection(connection)

    # Подготовка данных
    trainer = ModelTrainer(config)
    train_data, val_data, test_data, data_info = trainer.prepare_data(df)

    # Построение модели
    hybrid_model = HybridCandleModel(config)
    model = hybrid_model.build_model(
        sequence_length=config.data_config['lookback'],
        n_features=data_info['n_features']
    )

    # Обучение
    history = trainer.train(train_data, val_data, model)

    # Сохранение модели
    trainer.save_model(model, 'app/ml_models/models/trained/hybrid_candle_model.keras')

    print("Обучение завершено!")


if __name__ == "__main__":
    main()