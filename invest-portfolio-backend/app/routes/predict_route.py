from flask import request
from flask_restx import Namespace, Resource, fields

from app.services.ml_predict_service import MlPredictService
from app.services.stock_names_service import StockNamesService


api = Namespace('dti', description='Операции с портфелем')

predict_input_model = api.model('PredictInput', {
    'ticker_id': fields.Integer(required=True, description='Айди актива'),
    'hours': fields.Integer(required=True, description='Количество часов прогноза')
})


@api.route('/ml_predict')
class PredictRoute(Resource):

    @api.doc('get_prediction')
    @api.expect(predict_input_model)
    @api.response(200, 'Успешное получение прогноза')
    def post(self):
        try:
            data = request.get_json()

            ticker_id, hours = data['ticker_id'], data['hours']
            ticker = StockNamesService.GetOneById(ticker_id).name.lower()

            table_predict, trend_predict = MlPredictService().predict(hours, ticker)
            print(1)
            predict_model = MlPredictService().template_predict(table_predict, trend_predict, hours)

            if predict_model:
                return {
                    'success': True,
                    'data': predict_model.to_dict()
                }, 200

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка в прогнозирование: {str(e)}'
            }, 500
