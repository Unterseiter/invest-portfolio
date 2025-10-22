from app.models.user_info_model import TableSecuritiesModel, UserInfoModel
from database.db_connection import db_connection, close_connection
from app.services.table_securities_service import TableSecuritiesService


class UserService:

    @classmethod
    def GetOneById(self, user_id) -> UserInfoModel:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT
                        id, 
                        date
                        FROM user_info
                        WHERE id = %s"""
            cursor.execute(queue, (user_id,))
            data = cursor.fetchall()

            close_connection(connection)
            list_table_securities = TableSecuritiesService.GetAll(user_id)

            return UserInfoModel(id=data[0][0], date=data[0][1], table_securities=list_table_securities)
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def GetOneByDate(self, date) -> UserInfoModel:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT
                        id, 
                        date
                        FROM user_info
                        WHERE date < %s
                        ORDER BY id DESC
                        LIMIT 1"""
            cursor.execute(queue, (date,))
            data = cursor.fetchall()

            close_connection(connection)
            list_table_securities = TableSecuritiesService.GetAll(data[0][0])

            return UserInfoModel(id=data[0][0], date=data[0][1], table_securities=list_table_securities)
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

    @classmethod
    def Post(self, date) -> bool:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """INSERT INTO user_info (date) VALUES 
                        (%s)"""
            cursor.execute(queue, (date,))
            connection.commit()

            close_connection(connection)
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False

    @classmethod
    def Delete(self, user_id) -> bool:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """DELETE FROM user_info WHERE id = %s"""
            cursor.execute(queue, (user_id,))
            connection.commit()

            connection.close()
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False

    @classmethod
    def Update(self, user_id, date) -> bool:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """UPDATE user_info SET date = %s WHERE id = %s"""
            cursor.execute(queue, (user_id, date))
            connection.commit()

            close_connection(connection)
            return True
        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return False
