

def calc_market_signal(trend_prediction, stock_prediction):

    # trend
    trend_signal = 0
    for pred in trend_prediction:
        up, flat, down = pred
        mx = max(pred)

        if mx == up:
            trend_signal += up
        elif mx == down:
            trend_signal -= down

    # stock & volatility
    stock_signal = 0
    volatility_list = []
    for i in range(1, len(stock_prediction)):
        cur_close, pre_close = stock_prediction[i][4], stock_prediction[i - 1][4]
        high, low = stock_prediction[i][2], stock_prediction[i][3]

        change = (cur_close - pre_close) / cur_close * 10
        stock_signal += change

        volatility = (high - low) / pre_close * 10
        volatility_list.append(volatility)

    volatility_signal = max(0.3, 1 - sum(volatility_list) / len(volatility_list))

    # result
    score = 0.7 * trend_signal + 0.3 * stock_signal
    score *= volatility_signal

    return class_market_signal(score)


def class_market_signal(score):
    score = round(float(score), 2)
    if score > 0.6:
        return f"Сильный бычий! Высокая вероятность роста (score_signal = {score})", score
    elif score > 0.1:
        return f"Умеренный бычий! Слабая вероятность роста (score_signal = {score})", score
    elif score > -0.1:
        return f"Флэт. Нету вероятности роста и падения (score_signal = {score})", score
    elif score > -0.4:
        return f"Умеренный медвежий! Слабая вероятность падения (score_signal = {score})", score
    else:
        return f"Сильный медвежий! Высокая вероятность падения (score_signal = {score})", score


def calc_assurance_trend(score, trend_prediction):

    # trend
    assurance_sum = 0
    count = 0
    for pred in trend_prediction:
        up, flat, down = pred
        mx = max(pred)

        if mx == up and score > 0.1:
            assurance_sum += up
            count += 1
        elif mx == down and score < -0.1:
            assurance_sum += down
            count += 1
        elif mx == flat and (score < 0.1 and score > -0.1):
            assurance_sum += flat
            count += 1

    return round(float(assurance_sum / count), 2)


def calc_balance_models(trend_prediction, stock_prediction):
    trend_signal = 0
    for pred in trend_prediction:
        up, flat, down = pred
        mx = max(pred)

        if mx == up:
            trend_signal += up
        elif mx == down:
            trend_signal -= down

    balance_score = 1

    for i in range(1, len(stock_prediction)):

        # trend
        trend_signal = 0

        up, flat, down = trend_prediction[i]
        mx = max(trend_prediction[i])

        if mx == up:
            trend_signal = 1
        elif mx == down:
            trend_signal = -1

        # stock
        stock_signal = 0

        cur_close, pre_close = stock_prediction[i][4], stock_prediction[i - 1][4]
        change = (cur_close - pre_close) / cur_close * 10

        if change > 0.1:
            stock_signal = 1
        elif change < -0.1:
            stock_signal = -1

        if stock_signal == trend_signal:
            balance_score += 1

    score = balance_score / len(stock_prediction)

    return class_balance_models(score)


def class_balance_models(score):
    score = round(float(score), 2)
    print(score)

    if score > 0.7:
        return f"Две модели отлично согласованы! (score = {score})", score

    elif score > 0.5:
        return f"Две модели средне согласованы! (score = {score})", score

    elif score > 0.3:
        return f"Осторожно! Две модели слабо согласованы! (score = {score})", score

    else:
        return f"Осторожно! Две модели противоречивы! (score = {score})", score


def calc_volatility(stock_prediction):

    volatility_list = []

    for i in range(1, len(stock_prediction)):
        cur_close, pre_close = stock_prediction[i][4], stock_prediction[i - 1][4]
        high, low = stock_prediction[i][2], stock_prediction[i][3]

        volatility = (high - low) / pre_close * 100

        volatility_list.append(volatility)

    if len(volatility_list) > 0:
        volatility = sum(volatility_list) / (len(stock_prediction) - 1)
    else:
        volatility = 1

    return class_volatility(volatility)


def class_volatility(volatility):
    volatility = round(float(volatility), 2)
    print(volatility)

    if volatility > 2.0:
        return f"Осторожно! Высокая волатильность! (риск повышен) (volatility = {volatility}%)", volatility
    elif volatility > 0.8:
        return f"Средняя волатильность (volatility = {volatility}%)", volatility
    else:
        return f"Низкая волатильность (volatility = {volatility}%)", volatility


def calc_recommendation_signal(stock_prediction, volatility, balance_score, market_score):
    # Ожидаемая доходность и фактор риска
    gain_factor = 0
    risk_factor = 0

    for i in range(1, len(stock_prediction)):
        cur_close, pre_close = stock_prediction[i][4], stock_prediction[i - 1][4]
        exp_gain = cur_close - pre_close

        gain_factor += (exp_gain / pre_close) * 100
        risk_factor += abs(exp_gain) / (volatility * 0.5)

    if len(stock_prediction) > 1:
        gain_signal = gain_factor / (len(stock_prediction) - 1)
        risk_signal = risk_factor / (len(stock_prediction) - 1)
    else:
        gain_signal = 0
        risk_signal = 0

    if risk_signal > 2:
        risk_signal = 1
    elif risk_signal > 1:
        risk_signal = 0.5
    elif risk_signal < 0.5:
        risk_signal = -0.5

    volatility_signal = volatility
    if volatility > 2.0:
        volatility_signal = -1
    elif volatility > 1:
        volatility_signal = -0.5

    total_score = (
        market_score * 3 +
        balance_score * 1.5 +
        gain_signal * 1.5 +
        risk_signal * 1.5 +
        volatility_signal * 1
    )

    return class_recommendation_signal(total_score)


def class_recommendation_signal(score):
    score = round(float(score), 2)
    print(score)

    if score > 3:
        return f"АГРЕССИВНАЯ ПОКУПКА (score = {score})"

    elif score > 1.5:
        return f"ОСТОРОЖНАЯ ПОКУПКА (score = {score})"

    elif score > -0.5:
        return f"СИДЕТЬ В СТОРОНЕ (score = {score})"

    elif score > -1.5:
        return f"ОСТОРОЖНАЯ ПРОДАЖА (score = {score})"

    else:
        return f"АГРЕССИВНАЯ ПРОДАЖА (score = {score})"
