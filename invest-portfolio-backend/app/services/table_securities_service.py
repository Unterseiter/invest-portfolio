from database.db_connection import db_connection, close_connection
from typing import List
from app.models.user_info_model import TableSecuritiesModel


class TableSecuritiesService:

    @classmethod
    def GetAll(self, user_id) -> List[TableSecuritiesModel]:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT
                    st.name,
                    tb.quantity,
                    tb.price
                    FROM table_securities as tb
                    JOIN stock_names as st ON tb.securitie_id = st.name_id 
                    WHERE tb.user_id = %s"""
            cursor.execute(queue, [user_id])
            data = cursor.fetchall()

            close_connection(connection)
            return [TableSecuritiesModel(
                ticker=data[row][0],
                quantity=data[row][1],
                price=float(data[row][2])
            ) for row in range(len(data))]
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def GetOneById(self, id) -> TableSecuritiesModel:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT
                            st.name,
                            tb.quantity,
                            tb.price
                            FROM table_securities as tb
                            JOIN stock_names as st ON tb.securitie_id = st.name_id
                            WHERE st.id = %s"""
            cursor.execute(queue, (id,))
            data = cursor.fetchall()

            close_connection(connection)
            return TableSecuritiesModel(ticker=data[0][0], quantity=data[0][1], price=float(data[0][2]))

        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def Post(self, sequritie_id, user_id, quantity):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT name FROM stock_names WHERE name_id = %s"""
            cursor.execute(queue, (sequritie_id,))
            name = cursor.fetchall()[0][0]

            queue = f"""SELECT close FROM {name} ORDER BY date DESC LIMIT 1"""
            cursor.execute(queue)
            price = float(cursor.fetchall()[0][0])

            queue = """INSERT INTO table_securities (user_id, securitie_id, quantity, price) VALUES
                    (%s, %s, %s, %s)"""
            cursor.execute(queue, (user_id, sequritie_id, quantity, price))
            connection.commit()

            close_connection(connection)
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False

    @classmethod
    def Delete(self, id):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """DELETE FROM table_securities WHERE id = %s"""
            cursor.execute(queue, (id,))
            connection.commit()

            close_connection(connection)
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False

    @classmethod
    def Update(self, id, sequritie_id, quantity):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """UPDATE table_securities
                       SET 
                       sequritie_id = %s
                       quantity = %s
                       WHERE id = %s"""
            cursor.fetchall(queue, (sequritie_id, quantity, id))
            connection.commit()

            close_connection(connection)
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False

    @classmethod
    def UpdatePrices(cls, prev_user_id, new_user_id) -> bool:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT securitie_id, quantity FROM table_securities WHERE user_id = %s"""
            cursor.execute(queue, (prev_user_id,))
            data = cursor.fetchall()

            close_connection(connection)

            for record in data:
                cls.Post(record[0], new_user_id, record[1])

            return True

        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False
