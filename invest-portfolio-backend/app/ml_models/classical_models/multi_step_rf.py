# ml_models/classical_models/multi_step_rf.py
from sklearn.ensemble import RandomForestRegressor
import numpy as np
from app.ml_models.base_model import BaseModel


class MultiStepRandomForest(BaseModel):
    def __init__(self, prediction_horizon: int = 24):
        self.prediction_horizon = prediction_horizon
        self.models = []  # Отдельная модель для каждого часа прогноза

    def fit(self, X_train: np.ndarray, y_train: np.ndarray, **kwargs):
        """Обучение модели (реализация абстрактного метода)"""
        # Преобразуем 3D в 2D для Random Forest
        X_train_flat = X_train.reshape(X_train.shape[0], -1)

        self.models = []
        for hour in range(self.prediction_horizon):
            print(f"Обучение Random Forest для часа {hour + 1}/{self.prediction_horizon}")

            # Целевая переменная для конкретного часа
            y_hour = y_train[:, hour]

            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_train_flat, y_hour)
            self.models.append(model)

        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Предсказание для всех 24 часов"""
        X_flat = X.reshape(X.shape[0], -1)
        predictions = []

        for model in self.models:
            pred = model.predict(X_flat)
            predictions.append(pred)

        # Транспонируем чтобы получить (samples, 24_hours)
        return np.array(predictions).T

    # Для обратной совместимости
    def train(self, X_train: np.ndarray, y_train: np.ndarray):
        """Алиас для fit"""
        return self.fit(X_train, y_train)