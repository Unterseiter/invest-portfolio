import joblib
import numpy as np


def diagnose_scalers():
    """Диагностика скейлеров и фичей"""
    try:
        scalers_path = 'app/ml_models/models/trained/hybrid_candle_model_scalers.pkl'
        scalers = joblib.load(scalers_path)

        print("=== ДИАГНОСТИКА СКЕЙЛЕРОВ ===")
        print(f"Доступные скейлеры: {list(scalers.keys())}")

        if 'feature' in scalers:
            feature_scaler = scalers['feature']
            print(f"\nFeature Scaler info:")
            print(f"  Ожидает фич: {feature_scaler.n_features_in_}")
            print(f"  Средние: {feature_scaler.mean_}")
            print(f"  Стандартные отклонения: {feature_scaler.scale_}")

        if 'target' in scalers:
            target_scaler = scalers['target']
            print(f"\nTarget Scaler info:")
            print(f"  Ожидает фич: {target_scaler.n_features_in_}")

    except Exception as e:
        print(f"Ошибка диагностики: {e}")


if __name__ == "__main__":
    diagnose_scalers()