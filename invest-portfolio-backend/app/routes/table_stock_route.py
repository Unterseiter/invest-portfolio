from flask import request
from flask_restx import Namespace, Resource, fields
from app.services.table_stock_service import TableStockService

api = Namespace('dti', description='Операции с портфелем')

table_stock_model = api.model('TableStock', {
    'date': fields.String(required=True, description='Название актива'),
    'open': fields.Float(required=True, description='Цена открытия'),
    'high': fields.Float(required=True, description='Самая высокая цена'),
    'low': fields.Float(required=True, description='Самая низкая цена'),
    'close': fields.Float(required=True, description='Цена закрытия'),
    'volume': fields.Integer(required=True, description='Что-то')   #Поменять потом!
})

table_stock_create_model = api.model('TableStockCreate', {
    'filename': fields.String(required=True, description='Файл csv для заполнения биржы'),
    'delimiter': fields.String(required=True, description='Разделитель csv файла'),
    'name': fields.String(required=True, description='Название компании')
})


@api.route('/table_stock/<int:name_id>/<int:record_id>')
@api.param('name_id', 'Айди названия компании')
@api.param('record_id', 'Айди строчки биржы')
class TableStockById(Resource):

    @api.doc('get_one_stock_table')
    @api.response(200, 'Строка биржы успешно получена')
    @api.response(404, 'Строка биржы не найдена')
    def get(self, name_id, record_id):
        try:
            data = TableStockService.GetOneById(record_id, name_id)

            if data:
                return {
                    'success': True,
                    'data': data.to_dict()
                }, 200

            return {
                'success': False,
                'message': 'Строка не найдена'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении строки биржы: {str(e)}'
            }, 500


@api.route('/table_stock/<int:name_id>')
@api.route('name_id', 'Айди названия компании')
class TableStock(Resource):

    @api.doc('delete_table_stock')
    @api.response(200, 'Биржа успешно удален')
    @api.response(404, 'Биржа не найдена')
    def delete(self, name_id):
        try:
            check = TableStockService.Delete(name_id)

            if check:
                return {
                    'success': True,
                    'message': 'Биржа успешно удалено'
                }, 200

            return {
                'success': False,
                'message': 'Биржа не найдена'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при удалении биржы: {str(e)}'
            }, 500

    @api.doc('get_all_table_stock')
    @api.response(200, 'Биржа успешно получена')
    @api.response(404, 'Биржа не найдена')
    def get(self, name_id):
        try:
            data = TableStockService.GetAll(name_id)

            if data:
                return {
                    'success': True,
                    'data': [record.to_dict() for record in data]
                }, 200

            return {
                'success': False,
                'message': 'Биржа не найдена'
            }, 404

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении биржы: {str(e)}'
            }, 500


@api.route('/table_stock')
class CreateTableStock(Resource):

    @api.doc('create_table_stock')
    @api.expect(table_stock_create_model)
    @api.response(201, 'Портфель успешно создан')
    def post(self):
        try:
            data = request.get_json()
            filename, delimiter, name = data['filename'], data['delimiter'], data['name']

            check = TableStockService.Post(filename, delimiter, name)

            name, begin_date, end_date = data['name'], data['begin_date'], data['end_date']

            check = TableStockService.Post(';', name, begin_date, end_date)

            if check:
                return {
                    'success': True,
                    'message': 'Биржа успешно записана'
                }, 201

            raise Exception

        except Exception as e:
            return {
                'success': False,
                'message': f'Ошибка при получении биржы: {str(e)}'
            }, 500
