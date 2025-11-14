import yaml
import os
from typing import Dict, Any


class Config:
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = 'app/ml_models/configs/model_config.yaml'

        with open(config_path, 'r') as file:
            self.config = yaml.safe_load(file)

    def get(self, key: str, default=None) -> Any:
        keys = key.split('.')
        value = self.config
        for k in keys:
            value = value.get(k, {})
        return value if value != {} else default

    @property
    def data_config(self) -> Dict:
        return self.get('data')

    @property
    def model_config(self) -> Dict:
        return self.get('model')

    @property
    def features_config(self) -> Dict:
        return self.get('features')
