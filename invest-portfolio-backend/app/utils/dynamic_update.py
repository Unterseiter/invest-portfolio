from datetime import datetime, timedelta
import time

from app.services.user_info_service import UserService
from app.services.stock_names_service import StockNamesService
from app.services.table_stock_service import TableStockService


def dynamic_update():
    names = StockNamesService.GetAllNames()
    for i in names:
        TableStockService.Update(';', i.name)

    users = UserService().GetAll()
    last_date = users[-1].date

    last_date = datetime.strptime(last_date, "%Y-%m-%dT%H:%M:%S")
    print("Последняя дата:", last_date)

    now_date = datetime.now()

    hours = int((now_date - last_date).total_seconds() // 3600)

    for _ in range(hours):
        next_date = last_date + timedelta(hours=1)

        UserService().Update(last_date, next_date)
        last_date += timedelta(hours=1)

        print(last_date)

    while True:

        time.sleep(3600)

        print(f"Запуск задачи в {datetime.now()}")

        for i in names:
            TableStockService.Update(';', i.name)

        now_date = datetime.now()
        last_date += timedelta(hours=1)

        UserService.Update(last_date, now_date)

