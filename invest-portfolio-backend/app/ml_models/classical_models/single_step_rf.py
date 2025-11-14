# ml_models/classical_models/single_step_rf.py
from sklearn.ensemble import RandomForestRegressor
import numpy as np
from app.ml_models.base_model import BaseModel


class SingleStepRandomForest(BaseModel):
    """Random Forest для одношагового прогнозирования (цена через 24 часа)"""

    def __init__(self):
        self.model = None
        self.feature_importance = None

    def fit(self, X_train: np.ndarray, y_train: np.ndarray, **kwargs):
        """Обучение модели для одношагового прогноза"""
        print("Обучение Random Forest для одношагового прогноза...")

        # Преобразуем 3D в 2D для Random Forest
        X_train_flat = X_train.reshape(X_train.shape[0], -1)

        # y_train уже 1D - цена через 24 часа
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train_flat, y_train)

        # Важность признаков
        self.feature_importance = self.model.feature_importances_

        print(f"Random Forest обучен на {X_train_flat.shape[0]} samples")
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Предсказание цены через 24 часа"""
        if self.model is None:
            raise ValueError("Модель не обучена. Сначала вызовите fit()")

        X_flat = X.reshape(X.shape[0], -1)
        return self.model.predict(X_flat)