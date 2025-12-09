from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class TablePredicts:
    date: str
    open: float
    high: float
    low: float
    close: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close
        }


@dataclass
class PredictModel:
    hours: int
    market_signal: str
    assurance: float
    balance: str
    volatility: str
    recommendation_signal: str

    table_predict: List[TablePredicts]

    def to_dict(self) -> Dict[str, Any]:
        return {
            'hours': self.hours,
            'market_signal': self.market_signal,
            'assurance': self.assurance,
            'balance': self.balance,
            'volatility': self.volatility,
            'recommendation_signal': self.recommendation_signal,
            'table_predictions': [
                {
                    'date': row.date,
                    'open': row.open,
                    'high': row.high,
                    'low': row.low,
                    'close': row.close
                }
                for row in self.table_predict]
        }
