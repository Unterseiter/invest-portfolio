from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class TableStockModel:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            'date': self.date,
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close,
            'volume': self.volume
        }


@dataclass
class StockNameModel:
    id: int
    name: str
    full_name: str
    table: List[TableStockModel]

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'full_name': self.full_name,
            'table': [
                {
                    'date': row.date,
                    'open': row.open,
                    'high': row.high,
                    'low': row.low,
                    'close': row.close,
                    'volume': row.volume
                }
                for row in self.table
            ]
        }


@dataclass
class StockNamesModel:
    id: int
    name: str
    full_name: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'full_name': self.full_name
        }
