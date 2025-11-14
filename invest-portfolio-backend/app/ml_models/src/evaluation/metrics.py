import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
from typing import Dict


def calculate_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """Расчет метрик регрессии"""
    metrics = {
        'MAE': mean_absolute_error(y_true, y_pred),
        'MSE': mean_squared_error(y_true, y_pred),
        'RMSE': np.sqrt(mean_squared_error(y_true, y_pred)),
        'MAPE': mean_absolute_percentage_error(y_true, y_pred),
        'R2': r2_score(y_true, y_pred)
    }

    # Direction Accuracy (точность направления)
    direction_true = np.diff(y_true) > 0
    direction_pred = np.diff(y_pred) > 0
    metrics['Direction_Accuracy'] = np.mean(direction_true == direction_pred)

    return metrics


def mean_absolute_percentage_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """MAPE метрика"""
    return np.mean(np.abs((y_true - y_pred) / (y_true + 1e-8))) * 100


def r2_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """R² score"""
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    return 1 - (ss_res / (ss_tot + 1e-8))