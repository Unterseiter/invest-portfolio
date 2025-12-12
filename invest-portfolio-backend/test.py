from app.services.ml_predict_service import MlPredictService


def main():
    predict_service = MlPredictService()
    predict_table, trend_table = predict_service.predict(6, 'sber')

    predict_model = predict_service.template_predict(predict_table, trend_table, 6)

    print('Часы:', predict_model.hours)
    print(predict_model.market_signal)
    print('Уверенность в тренде:', predict_model.assurance)
    print(predict_model.balance)
    print(predict_model.volatility)
    print(predict_model.recommendation_signal)
    for row in predict_model.table_predict:
        print(row)


if __name__ == '__main__':
    main()
