from app.models.stock_names_model import StockNamesModel, StockNameModel, TableStockModel
from typing import List
from app.services.table_stock_service import TableStockService
from database.db_connection import db_connection, close_connection


class StockNamesService:

    @classmethod
    def GetOneById(cls, name_id) -> StockNameModel:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name_id, name, full_name FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (name_id,))
            data = cursor.fetchall()

            close_connection(connection)

            list_table_stock = TableStockService.GetAll(name_id)

            return StockNameModel(
                id=data[0][0],
                name=data[0][1],
                full_name=data[0][2],
                table=list_table_stock
            )

        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def GetAllNames(cls) -> List[StockNamesModel]:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name_id, name, full_name FROM stock_names"""
            cursor.execute(queue)
            data = cursor.fetchall()

            close_connection(connection)

            return [StockNamesModel(
                id=data[row][0],
                name=data[row][1],
                full_name=data[row][2]
            )
                for row in range(len(data))]
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def Delete(cls, name_id):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (name_id,))
            name = cursor.fetchall()[0][0]

            queue = """DELETE FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (name_id,))
            connection.commit()

            close_connection(connection)

            TableStockService.Delete(name_id)

            return True

        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False
