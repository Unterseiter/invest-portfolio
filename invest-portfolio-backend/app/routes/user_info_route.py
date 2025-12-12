from flask import request
from flask_restx import Namespace, Resource, fields
from app.services.user_info_service import UserService

api = Namespace('dti', description='Операции с портфелем')

# Модели данных для Swagger
user_info_model = api.model('UserInformation', {
    'date': fields.String(required=True, description='Дата последнего обновления портфеля'),
    'new_date': fields.String(required=True, description='Новая дата'),
})

table_securities_model = api.model('TableSecurities', {
    'tinker': fields.String(required=True, description='Название актива'),
    'quantity': fields.Integer(required=True, description='Количество активов'),
    'price': fields.Float(required=True, description='Цена актива')
})


@api.route('/portfolio/<int:user_id>')
@api.param('user_id', 'Айди портфеля')
class UserInfoById(Resource):

    @api.doc('get_user_info')
    @api.response(200, 'Данные портфеля успешно получены')
    @api.response(404, 'Портфель не найден')
    def get(self, user_id):
        try:
            data = UserService.GetOneById(user_id)

            tickers = UserService.getTickerbest()

            if data:
                return {
                    'success': True,
                    'data': data.to_dict(),
                    'best_ticker': tickers['best_ticker'],
                    'worst_ticker': tickers['worst_ticker']
                }, 200

            return {
                'success': False,
                'message': 'Портфель не найден'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении портфеля: {str(e)}'
            }, 500

    @api.doc('delete_user_info')
    @api.response(200, 'Портфель успешно удален')
    @api.response(404, 'Портфель не найден')
    def delete(self, user_id):
        try:
            success = UserService.Delete(user_id)

            if success:
                return {
                    'success': True,
                    'message': 'Портфель успешно удален'
                }, 200

            return {
                'success': False,
                'message': 'Портфель не найден'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при удалении портфеля: {str(e)}'
            }, 500


@api.route('/portfolio/<string:date>')
@api.param('date', 'Дата портфеля')
class UserInfoByDate(Resource):

    @api.doc('get_user_info')
    @api.response(200, 'Данные портфеля успешно получены')
    @api.response(404, 'Портфель не найден')
    def get(self, date):
        try:
            data = UserService.GetOneByDate(date)

            if data:
                return {
                    'success': True,
                    'data': data.to_dict()
                }, 200

            return {
                'success': False,
                'message': 'Портфель не найден'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении портфеля: {str(e)}'
            }, 500


@api.route('/portfolio')
class UserInfo(Resource):
    @api.doc('post_user_info')
    @api.expect(user_info_model)
    @api.response(201, 'Портфель успешно создан')
    def post(self):
        try:
            data = request.get_json()

            check = UserService.Post(data['date'])
            if check:
                return {
                    'success': True,
                    'message': 'Портфель успешно создан'
                }, 201

            raise Exception

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при создании портфеля: {str(e)}'
            }, 500

    @api.doc('get_all_user_info')
    @api.response(200, 'Данные портфелей успешно получены')
    def get(self):
        try:
            data = UserService.GetAll()

            if data:
                return {
                    'success': True,
                    'data': [record.to_dict() for record in data]
                }, 200

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении портфелей: {str(e)}'
            }, 500

    @api.doc('update_user_info')
    @api.expect(user_info_model)
    @api.response(200, 'Портфель успешно изменен')
    @api.response(404, 'Портфель не найден')
    def put(self):
        try:
            data = request.get_json()
            success = UserService.Update(data['date'], data['new_date'])

            if success:
                return {
                    'success': True,
                    'message': 'Портфель успешно изменен'
                }, 200

            return {
                'success': False,
                'message': 'Портфель не найден'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при изменении портфеля: {str(e)}'
            }, 500
