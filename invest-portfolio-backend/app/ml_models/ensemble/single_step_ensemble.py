# ml_models/ensemble/single_step_ensemble.py
import numpy as np
from typing import Dict
from sklearn.metrics import mean_squared_error
from app.ml_models.base_model import BaseModel


class SingleStepEnsemble(BaseModel):
    """Ансамбль для одношагового прогнозирования (цена через 24 часа)"""

    def __init__(self, models: Dict):
        self.models = models
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
            model.fit(X_train, y_train, **kwargs)
            predictions_val[name] = model.predict(X_val)

        # Оптимизация весов
        self.weights = self._optimize_weights(predictions_val, y_val)

        return self

    def _optimize_weights(self, predictions: Dict, y_true: np.ndarray) -> Dict:
        """Оптимизация весов моделей"""
        weights = {}
        total_inv_mse = 0

        for name, pred in predictions.items():
            mse = mean_squared_error(y_true, pred)
            weights[name] = 1 / (mse + 1e-8)
            total_inv_mse += weights[name]

        # Нормализация весов
        for name in weights.keys():
            weights[name] /= total_inv_mse

        print("Веса моделей в ансамбле:")
        for name, weight in weights.items():
            print(f"  {name}: {weight:.3f}")

        return weights

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Взвешенное предсказание"""
        predictions = {}

        for name, model in self.models.items():
            predictions[name] = model.predict(X)

        # Взвешенное среднее
        model_names = list(self.models.keys())
        final_prediction = np.zeros_like(predictions[model_names[0]])

        for name in model_names:
            final_prediction += predictions[name] * self.weights[name]

        return final_prediction