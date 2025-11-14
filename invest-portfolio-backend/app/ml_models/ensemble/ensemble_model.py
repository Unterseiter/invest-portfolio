# ml_models/ensemble/multi_step_ensemble.py
import numpy as np
from typing import Dict
from sklearn.metrics import mean_squared_error
from app.ml_models.base_model import BaseModel


class MultiStepEnsemble(BaseModel):
    def __init__(self, models: Dict, prediction_horizon: int = 24):
        self.models = models
        self.prediction_horizon = prediction_horizon
        self.weights = None

    def fit(self, X_train: np.ndarray, y_train: np.ndarray,
            X_val: np.ndarray = None, y_val: np.ndarray = None, **kwargs):
        """Обучение ансамбля"""

        # Если validation data не предоставлена, разделяем train
        if X_val is None or y_val is None:
            split_idx = int(len(X_train) * 0.8)
            X_train, X_val = X_train[:split_idx], X_train[split_idx:]
            y_train, y_val = y_train[:split_idx], y_train[split_idx:]

        # Обучаем все модели
        predictions_val = {}

        for name, model in self.models.items():
            print(f"Обучение {name}...")

            # Все модели теперь имеют метод fit
            model.fit(X_train, y_train, **kwargs)

            predictions_val[name] = model.predict(X_val)

        # Оптимизация весов
        self.weights = self._optimize_hourly_weights(predictions_val, y_val)

        return self

    def _optimize_hourly_weights(self, predictions: Dict, y_true: np.ndarray) -> np.ndarray:
        """Оптимизация весов для каждого часа прогноза отдельно"""
        model_names = list(predictions.keys())
        n_models = len(model_names)

        weights = np.zeros((self.prediction_horizon, n_models))

        for hour in range(self.prediction_horizon):
            total_inv_mse = 0
            hour_weights = []

            for i, name in enumerate(model_names):
                # MSE для конкретного часа
                mse = mean_squared_error(y_true[:, hour], predictions[name][:, hour])
                weight = 1 / (mse + 1e-8)
                hour_weights.append(weight)
                total_inv_mse += weight

            # Нормализация весов для этого часа
            weights[hour] = [w / total_inv_mse for w in hour_weights]

            print(f"Час {hour + 1}: " +
                  " ".join([f"{name}: {weights[hour][i]:.3f}"
                            for i, name in enumerate(model_names)]))

        return weights

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Взвешенное предсказание для каждого часа"""
        predictions = {}

        for name, model in self.models.items():
            predictions[name] = model.predict(X)

        # Взвешенное среднее для каждого часа
        model_names = list(self.models.keys())
        final_prediction = np.zeros((X.shape[0], self.prediction_horizon))

        for hour in range(self.prediction_horizon):
            for i, name in enumerate(model_names):
                final_prediction[:, hour] += predictions[name][:, hour] * self.weights[hour, i]

        return final_prediction

    # Для обратной совместимости
    def train_ensemble(self, X_train: np.ndarray, y_train: np.ndarray,
                       X_val: np.ndarray = None, y_val: np.ndarray = None):
        """Алиас для fit"""
        return self.fit(X_train, y_train, X_val, y_val)