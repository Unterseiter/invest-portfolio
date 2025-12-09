import pandas as pd
import numpy as np
import talib


class DataProcessing:

    def prepare_data(self, df: pd.DataFrame):
        df = df.copy()

        df['close'] = pd.to_numeric(df['close'], errors='coerce')
        df['open'] = pd.to_numeric(df['open'], errors='coerce')
        df['high'] = pd.to_numeric(df['high'], errors='coerce')
        df['low'] = pd.to_numeric(df['low'], errors='coerce')

        close, open, high, low = df['close'], df['open'], df['high'], df['low']

        # close_, open_, high_, low_ = df['close'].shift(-1), df['open'].shift(-1), df['high'].shift(-1), df['low'].shift(-1)
        #
        # # log_return
        # df['log_close'] = close / close_
        # df['log_open'] = open / open_
        # df['log_low'] = low / low_
        # df['log_high'] = high / high_

        df['previous_close'] = df['close'].shift(1)

        df['sma_20'] = talib.SMA(close, timeperiod=20)

        df['atr'] = talib.ATR(high, low, close, timeperiod=14)

        # Volume indicators
        # df['volume_sma'] = talib.SMA(volume, timeperiod=20)

        # # MACD
        # macd, macdsignal, macdhist = talib.MACD(close)
        # df['macd'] = macd
        # df['macd_signal'] = macdsignal
        # df['macd_hist'] = macdhist

        print(df.head(5))

        df = df.dropna()

        print(df.head(5))

        return df

    def add_target(self, df: pd.DataFrame):
        df = df.copy()

        columns = ['close', 'open', 'high', 'low']
        return df[columns].shift(1)

    def prepare_trend(self, df, period: int):
        df = df.copy()

        future_price = df['close'].shift(-period)

        price_change = (future_price / df['close'] - 1) * 100

        up = 0.1
        down = -0.1

        target = []
        for change in price_change:
            if change > up:
                target.append(1)
            elif change < down:
                target.append(-1)
            else:
                target.append(0)

        return np.array(target)

    def add_trend(self, df: pd.DataFrame):
        df = df.copy()

        df['trend'] = self.prepare_trend(df, 1)
        df['trend'] = df['trend'].shift(-1)
        return df
