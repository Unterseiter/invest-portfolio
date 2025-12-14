from mysql import connector

import json


def db_connection():
    try:
        with open('database\connection.json', 'r', encoding='utf-8') as file:
            data_connection = json.load(file)

        connection = connector.connect(
            database=data_connection['database'],
            user=data_connection['user'],
            password=data_connection['password'],
            host=data_connection['host']
        )

        # # Данил Иванов
        # connection = connector.connect(
        #     database='dti_schema',
        #     user='root',
        #     password='qwerty',
        #     host='localhost'
        # )
    except Exception as e:
        print(f'Ошибка! Не удалось подключиться к БД: {e}')
        return None
    else:
        # print('Успешное подключение к БД')
        return connection


def close_connection(connection):
    try:
        connection.close()
    except Exception as e:
        print(f'Ошибка! Подключение к БД не закрылось: {e}')
        return False
    else:
        # print('Подключение к БД успешно закрылось.')
        return True
