from app.models.stock_names_model import StockNamesModel, TableStockModel
from database.db_connection import db_connection, close_connection
from typing import List
from app.utils.load_df import load_df
from app.utils.update_df import update_df


class TableStockService:

    @classmethod
    def GetOneById(self, id, name_id) -> TableStockModel:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (name_id,))
            stock_name = cursor.fetchall()[0][0]

            queue = f"""SELECT 
                        date,
                        open,
                        high,
                        low,
                        close,
                        volume
                        FROM {stock_name} WHERE id = %s"""
            cursor.execute(queue, (id,))
            data = cursor.fetchall()

            close_connection(connection)
            return TableStockModel(
                date=str(data[0][0]),
                open=float(data[0][1]),
                high=float(data[0][2]),
                low=float(data[0][3]),
                close=float(data[0][4]),
                volume=int(data[0][5])
            )
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def GetAll(self, name_id) -> List[TableStockModel]:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (name_id,))
            stock_name = cursor.fetchall()[0][0].lower()

            queue = f"""SELECT 
                        date,
                        open,
                        high,
                        low,
                        close,
                        volume
                        FROM {stock_name}"""
            cursor.execute(queue)
            data = cursor.fetchall()

            close_connection(connection)
            return [TableStockModel(
                date=str(data[row][0]),
                open=float(data[row][1]),
                high=float(data[row][2]),
                low=float(data[row][3]),
                close=float(data[row][4]),
                volume=int(data[row][5])
            ) for row in range(len(data))]
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def Post(cls, delimiter, name, full_name, begin_date, end_date) -> bool:
        return load_df(delimiter=delimiter, name=name, full_name=full_name,
                       begin_date=begin_date, end_date=end_date)

    @classmethod
    def Update(cls, delimiter, name) -> bool:
        return update_df(delimiter, name)

    @classmethod
    def Delete(cls, name_id):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (name_id,))
            stock_name = cursor.fetchall()[0][0]

            queue = f"""DELETE FROM {stock_name}"""
            cursor.execute(queue)
            connection.commit()

            connection.close()
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False
