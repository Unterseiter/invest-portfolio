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

        close_, open_, high_, low_ = df['close'].shift(1), df['open'].shift(1), df['high'].shift(1), df['low'].shift(1)

        # log_return
        df['log_close'] = np.log(close / close_)
        df['log_open'] = np.log(open / open_)
        df['log_low'] = np.log(low / low_)
        df['log_high'] = np.log(high / high_)

        df['previous_log_close'] = df['log_close'].shift(-1)

        # df['previous_close'] = df['close'].shift(-1)

        df['ma_10'] = talib.MA(df['log_close'], 10)

        df['volatility_5'] = df['log_close'].rolling(window=5).std()
        df['volatility_20'] = df['log_close'].rolling(window=20).std()


        df['sma_20'] = talib.SMA(close, timeperiod=20)

        df['atr'] = talib.ATR(high, low, close, timeperiod=14)

        # Volume indicators

        df['trend'] = self.prepare_trend(df, 1)

        df['trend'] = df['trend'].shift(-1)

        # MACD
        # macd, macdsignal, macdhist = talib.MACD(close)
        # df['macd'] = macd
        # df['macd_signal'] = macdsignal
        # df['macd_hist'] = macdhist

        print(df.head(5))

        df = df.dropna()

        print(df.head(5))

        columns = ['sma_20', 'atr', 'trend', 'log_close', 'log_open', 'log_high',
                   'log_low', 'previous_log_close']

        return df[columns]

    def add_target(self, df: pd.DataFrame):
        df = df.copy()

        columns = ['log_close', 'log_open', 'log_high', 'log_low']
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
