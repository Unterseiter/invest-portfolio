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
                    tb.quantity
                    FROM table_securities as tb
                    JOIN stock_names as st ON tb.securitie_id = st.name_id 
                    WHERE tb.user_id = %s"""
            cursor.execute(queue, [user_id])
            data = cursor.fetchall()

            price_list = []
            queue = """SELECT
                       close
                       FROM {}
                       ORDER BY id DESC
                       LIMIT 1"""
            for row in range(len(data)):
                cursor.execute(queue.format(data[row][0]))
                price = cursor.fetchall()[0][0]
                price_list.append(price)

            close_connection(connection)
            return [TableSecuritiesModel(
                ticker=data[row][0],
                quantity=data[row][1],
                price=price_list[row]
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
                            tb.quantity
                            FROM table_securities as tb
                            JOIN stock_names as st ON tb.securitie_id = st.name_id
                            WHERE st.id = %s"""
            cursor.execute(queue, (id,))
            data = cursor.fetchall()

            queue = """SELECT
                               close
                               FROM {}
                               ORDER BY id DESC
                               LIMIT 1"""
            cursor.execute(queue.format(data[0][0]))
            price = cursor.fetchall()[0][0]

            close_connection(connection)
            return TableSecuritiesModel(ticker=data[0][0], quantity=data[0][1], price=price)
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def Post(self, sequritie_id, user_id, quantity):
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """INSERT INTO table_securities (user_id, securitie_id, quantity) VALUES
                    (%s, %s, %s)"""
            cursor.execute(queue, (user_id, sequritie_id, quantity))
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
