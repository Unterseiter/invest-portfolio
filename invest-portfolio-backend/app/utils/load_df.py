import pandas as pd
from database.db_connection import db_connection


def load_df(file, delimiter, name):
    df = pd.read_csv(file, delimiter=delimiter)

    connection = db_connection()
    if connection:
        check = create_table(connection, name)

        if check:
            check = create_records(connection, df, name)

            if check:
                add_stock_names(connection, name)

        connection.close()
        return check
    else:
        return False



def add_stock_names(connection, name):
    cursor = connection.cursor()

    cursor.execute("""INSERT INTO stock_names (name) VALUES (%s)""", [name])
    connection.commit()


def create_table(connection, name):
    table_queue = f"""CREATE TABLE IF NOT EXISTS {name} ( 
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    date DATE,
                    open DECIMAL(10, 2),
                    high DECIMAL(10, 2),
                    low DECIMAL(10, 2),
                    close DECIMAL(10, 2),
                    volume INT
                    );"""
    try:
        cursor = connection.cursor()
        cursor.execute(table_queue)
        connection.commit()
        print("Таблица успешно создана")
        return True

    except Exception as e:
        print(f"Ошибка создания таблицы: {e}")
        return False


def create_records(connection, df, name):
    df.columns = [col.lower().strip() for col in df.columns]

    # Возможные названия колонок
    column_mapping = {
        'date': ['date', 'datetime', 'time'],
        'open': ['open', 'open_price'],
        'high': ['high', 'high_price', 'max'],
        'low': ['low', 'low_price', 'min'],
        'close': ['close', 'close_price', 'price'],
        'volume': ['volume', 'vol', 'quantity']
    }

    # Переименовываем колонки в стандартный формат
    standard_columns = {}
    for standard_col, possible_names in column_mapping.items():
        for possible_name in possible_names:
            if possible_name in df.columns:
                standard_columns[possible_name] = standard_col
                break

    df = df.rename(columns=standard_columns)

    # Преобразуем дату в правильный формат
    df['date'] = pd.to_datetime(df['date']).dt.date

    # Агрегация данных. Заполнение пустых значений
    df = agr_missing_values(df)

    records = []
    for _, row in df.iterrows():
        record = (
            row['date'] if pd.notna(row.get('date')) else None,
            round(float(row.get('open', 0)), 2) if pd.notna(row.get('open')) else None,
            round(float(row.get('high', 0)), 2) if pd.notna(row.get('high')) else None,
            round(float(row.get('low', 0)), 2) if pd.notna(row.get('low')) else None,
            round(float(row.get('close', 0)), 2) if pd.notna(row.get('close')) else None,
            int(row.get('volume', 0)) if pd.notna(row.get('volume')) else None
        )
        records.append(record)

    insert_query = f"""
            INSERT INTO {name} 
            (date, open, high, low, close, volume) 
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                open = VALUES(open),
                high = VALUES(high),
                low = VALUES(low),
                close = VALUES(close),
                volume = VALUES(volume)
            """
    try:
        cursor = connection.cursor()
        cursor.executemany(insert_query, records)
        connection.commit()

        print(f'Данные успешно загружены в таблицу {name}')
        return True

    except Exception as e:
        print('Ошибка загрузки данных:', e)
        return False


def agr_missing_values(df):
    columns = ['open', 'high', 'low', 'close']

    df_processed = df.copy()

    for column in columns:

        missing_indices = df_processed[df_processed[column].isna()].index

        for idx in missing_indices:
            idx_up = 0
            idx_down = 0
            upper_value = None
            lower_value = None

            # Поиск вниз (более поздние даты)
            for low_idx in range(idx + 1, len(df_processed)):
                if pd.notna(df_processed.loc[low_idx, column]):
                    lower_value = df_processed.loc[low_idx, column]
                    idx_down = low_idx
                    break

            # Поиск вверх (более ранние даты)
            for up_idx in range(idx - 1, -1, -1):
                if pd.notna(df_processed.loc[up_idx, column]):
                    upper_value = df_processed.loc[up_idx, column]
                    idx_up = up_idx
                    break

            if upper_value is not None and lower_value is not None:
                df_processed.loc[idx, column] = upper_value + ((lower_value - upper_value) / (idx_down - idx_up) * (idx - idx_up))

            elif upper_value is not None:
                df_processed.loc[idx, column] = upper_value

            elif lower_value is not None:
                df_processed.loc[idx, column] = lower_value
    return df_processed
