from app.models.user_info_model import TableSecuritiesModel, UserInfoModel
from database.db_connection import db_connection, close_connection
from app.services.table_securities_service import TableSecuritiesService
from typing import List
from datetime import timedelta, datetime


def serialize_date(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


class UserService:

    @classmethod
    def GetAll(self) -> List[UserInfoModel]:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT * FROM user_info ORDER BY date"""
            cursor.execute(queue)
            data = cursor.fetchall()

            close_connection(connection)
            result_list = []

            for record in data:

                list_table_securities = TableSecuritiesService.GetAll(record[0])
                result_list.append(UserInfoModel(id=record[0], date=serialize_date(record[1]), table_securities=list_table_securities))

            return result_list

        except Exception as e:
            print(f'Ошибка в сервисе: {e}')
            return None

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

            return UserInfoModel(id=data[0][0], date=serialize_date(data[0][1]), table_securities=list_table_securities)
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
                        WHERE date <= %s
                        ORDER BY id DESC
                        LIMIT 1"""
            cursor.execute(queue, (date,))
            data = cursor.fetchall()

            print(data)

            close_connection(connection)
            list_table_securities = TableSecuritiesService.GetAll(data[0][0])

            return UserInfoModel(id=data[0][0], date=serialize_date(data[0][1]), table_securities=list_table_securities)
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
    def Update(csl, prev_date, new_data) -> bool:
        try:
            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT id FROM user_info WHERE date <= %s"""
            cursor.execute(queue, (prev_date,))
            prev_user_id = cursor.fetchall()[0][0]

            close_connection(connection)

            csl.Post(new_data)

            connection = db_connection()
            cursor = connection.cursor()

            queue = """SELECT id FROM user_info WHERE date = %s"""
            cursor.execute(queue, (new_data,))
            new_user_id = cursor.fetchall()[0][0]

            TableSecuritiesService.UpdatePrices(prev_user_id, new_user_id)

            close_connection(connection)
            return True

        except Exception as e:
            print(f'Ошибка в сервисе 1: {e}')
            return False
