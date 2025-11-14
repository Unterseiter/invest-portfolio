from dataclasses import dataclass
from typing import List, Dict, Any
from datetime import date


@dataclass
class TableSecuritiesModel:
    ticker: str
    quantity: int
    price: float

    @property
    def sum_price(self) -> float:
        return round(self.quantity * self.price, 2)

    def to_dict(self):
        return {
            'ticker': self.ticker,
            'quantity': self.quantity,
            'price': self.price,
            'sum_price': self.sum_price
        }


@dataclass
class UserInfoModel:
    id: id
    date: str
    table_securities: List[TableSecuritiesModel]

    @property
    def total_value(self) -> float:
        return sum(row.sum_price for row in self.table_securities)

    @property
    def total_stocks(self) -> float:
        return len(self.table_securities)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'date': self.date,
            'table': [
                {
                    'ticker': row.ticker,
                    'quantity': row.quantity,
                    'price': row.price,
                    'sum_price': row.sum_price
                }
                for row in self.table_securities
            ],
            'total_value': self.total_value,
            'total_stocks': self.total_stocks
        }
