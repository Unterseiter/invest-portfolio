from mysql import connector


def db_connection():
    try:
        # Евгений Булатов
        # connection = connector.connect(
        #     database='DTI_project',
        #     user='root',
        #     password='admin1234',
        #     host='localhost'
        # )

        # Данил Иванов
        connection = connector.connect(
            database='dti_schema',
            user='root',
            password='qwerty',
            host='localhost'
        )
    except Exception as e:
        print(f'Ошибка! Не удалось подключиться к БД: {e}')
        return None
    else:
        print('Успешное подключение к БД')
        return connection


def close_connection(connection):
    try:
        connection.close()
    except Exception as e:
        print(f'Ошибка! Подключение к БД не закрылось: {e}')
        return False
    else:
        print('Подключение к БД успешно закрылось.')
        return True
