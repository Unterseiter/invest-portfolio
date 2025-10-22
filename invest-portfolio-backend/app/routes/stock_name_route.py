from flask_restx import Namespace, Resource, fields
from app.services.stock_names_service import StockNamesService

api = Namespace('dti', description='Операции с портфелем')

# Модели данных для Swagger
stock_names_model = api.model('StockNames', {
    'name': fields.String(required=True, description='Название компании'),
})


@api.route('/stock_name/<int:name_id>')
@api.param('name_id', 'Айди_названия')
class StockNameById(Resource):

    @api.doc('get_stock_name')
    @api.response(200, 'Название компании успешно получены')
    @api.response(404, 'Название компании не найдено')
    def get(self, name_id):
        try:
            data = StockNamesService.GetOneById(name_id)

            if data:
                return {
                    'success': True,
                    'data': data.to_dict()
                }, 200

            return {
                'success': False,
                'message': 'Название не найдено'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении названия компании: {str(e)}'
            }, 500

    @api.doc('delete_stock_name')
    @api.response(200, 'Название компании успешно удалено')
    @api.response(404, 'Название компании не найдено')
    def delete(self, name_id):
        try:
            check = StockNamesService.Delete(name_id)

            if check:
                return {
                    'success': True,
                    'message': 'Название компании успешно удалена'
                }, 200

            return {
                'success': False,
                'message': 'Название не найдено'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при удалении названия компании: {str(e)}'
            }, 500


@api.route('/stock_name')
class StockName(Resource):

    @api.doc('get_all_stock_name')
    @api.response(200, 'Названия компании успешно получены')
    def get(self):
        try:
            data = StockNamesService.GetAllNames()

            if data:
                return {
                    'success': True,
                    'data': [record.to_dict() for record in data]
                }, 200

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении названия компании: {str(e)}'
            }, 500
