from flask import request
from flask_restx import Namespace, Resource, fields
from app.services.table_securities_service import TableSecuritiesService

api = Namespace('dti', description='Операции с портфелем')

table_securities_model = api.model('TableSecurities', {
    'tinker_id': fields.Integer(required=True, description='Айди актива'),
    'quantity': fields.Integer(required=True, description='Количество активов')
})


@api.route('/table_securities/all/<int:user_id>')
@api.param('user_id', 'Айди портфеля')
class TableSecuritiesAll(Resource):

    @api.doc('get_all_table_securities')
    @api.response(200, 'Активы успешно получены')
    @api.response(404, 'Активы не найдены')
    def get(self, user_id):
        try:
            data = TableSecuritiesService.GetAll(user_id)

            if data:
                return {
                    'success': True,
                    'data': [record.to_dict() for record in data]
                }, 200

            return {
                'success': False,
                'message': 'Активы не найдены'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении активов: {str(e)}'
            },

    @api.doc('create_table_securities')
    @api.expect(table_securities_model)
    @api.response(201, 'Активы успешно создан')
    def post(self, user_id):
        try:
            data = request.get_json()
            securitie_id, quantity = data['securitie_id'], data['quantity']

            check = TableSecuritiesService.Post(securitie_id, user_id, quantity)

            if check:
                return {
                    'success': True,
                    'message': 'Актив успешно создан'
                }, 201

            raise Exception

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при создании активов: {str(e)}'
            }, 500


@api.route('/table_securities/<int:id>')
@api.param('id', 'Айди актива')
class TableSecurities(Resource):

    @api.doc('get_one_table_securities')
    @api.response(200, 'Актив успешно получен')
    @api.response(404, 'Актив не найден')
    def get(self, id):
        try:
            data = TableSecuritiesService.GetOneById(id)

            if data:
                return {
                    'success': True,
                    'data': data.to_dict()
                }, 200

            return {
                'success': False,
                'message': 'Актив не найден'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении актива: {str(e)}'
            }, 500

    @api.doc('delete_one_table_securities')
    @api.response(200, 'Актив успешно удален')
    @api.response(404, 'Актив не найден')
    def get(self, id):
        try:
            check = TableSecuritiesService.Delete(id)

            if check:
                return {
                    'success': True,
                    'message': 'Актив успешно удален'
                }, 200

            return {
                'success': False,
                'message': 'Актив не найден'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при удалении актива: {str(e)}'
            }, 500

    @api.doc('update_table_securities')
    @api.expect(table_securities_model)
    @api.response(201, 'Актив успешно изменен')
    def put(self, id):
        try:
            data = request.get_json()
            securitie_id, quantity = data['securitie_id'], data['quantity']

            check = TableSecuritiesService.Update(id, securitie_id, quantity)

            if check:
                return {
                    'success': True,
                    'message': 'Актив успешно изменен'
                }, 201

            raise Exception

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при изменении актива: {str(e)}'
            }, 500
