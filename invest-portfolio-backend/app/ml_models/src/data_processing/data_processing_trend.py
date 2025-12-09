import pandas as pd
import numpy as np


class DataProcessingTrend:

    def create_matrice(self, open, close, length, width):

        mx = max(close + open)
        mm = min(close + open)

        step = (mx - mm) / width

        matrice = [[0 for i in range(length)] for i in range(width)]

        for i in range(length):

            if close[i] > open[i]:
                up_value = close[i]
                low_value = open[i]
            else:
                up_value = open[i]
                low_value = close[i]

            a = mm
            for j in range(width):
                if a >= low_value and a <= up_value:
                    matrice[j][i] = 1

                a += step

        return matrice

    def prepare_data(self, df: pd.DataFrame, length, width):

        close = df['close'].tolist()
        open = df['open'].tolist()

        list_matrice = []
        # формируем матрицы
        for i in range(len(close) - length + 1):

            matrice = self.create_matrice(open[i:i + length], close[i:i + length], length, width)
            list_matrice.append(matrice)

        return np.array(list_matrice)

    def add_target(self, df, period: int):
        df = df.copy()

        future_price = df['close'].shift(-period)

        price_change = (future_price / df['close'] - 1) * 100

        # Строгость отбора позитивного и негативного тренда
        up = 0.1
        down = -0.1

        target = []
        for change in price_change:
            if change > up:
                target.append([1, 0, 0])
            elif change < down:
                target.append([0, 0, 1])
            else:
                target.append([0, 1, 0])

        return np.array(target)
