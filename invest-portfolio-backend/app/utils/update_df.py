import pandas as pd
from datetime import date, timedelta
from database.db_connection import db_connection
from app.utils.load_df import create_records


def update_df(delimiter, name):
    connection = db_connection()

    if connection:

        begin_date = get_end_date(connection, name)
        end_date = date.today()

        url = f"""https://iss.moex.com/iss/engines/stock/markets/shares/securities/{name}/candles.csv?from={begin_date}&till={end_date}&interval=60"""

        df = pd.read_csv(url,
                         delimiter=delimiter,
                         skiprows=2,  # Пропускаем первые 2 строки с заголовками
                         header=0)  # Первая строка - заголовок колонок

        # ДЛЯ ОТЛАДКИ: посмотрим структуру данных
        print("Структура данных:")
        print(f"Колонки: {df.columns.tolist()}")
        print(f"Первые 3 строки: {df.head(3)}")
        print(f"Размер: {df.shape}")

        check = del_cur_date(connection, name, begin_date)

        if check:
            check = create_records(connection, df, name)

        return check

    else:
        return False


def get_end_date(connection, name):
    cursor = connection.cursor()

    queue = f"""SELECT CAST(`date` as DATE) FROM {name} ORDER BY `date` DESC LIMIT 1"""
    cursor.execute(queue)
    date = cursor.fetchall()[0][0]

    return str(date)


def del_cur_date(connection, name, cur_date):
    try:
        cursor = connection.cursor()

        query = f"DELETE FROM {name} WHERE date BETWEEN %s AND %s"
        cursor.execute(query, (cur_date + ' 00:00:00', cur_date + ' 23:59:59'))

        connection.commit()
        return True

    except Exception as e:
        print('Ошибка удаления старых данных:', e)
        return False

