import threading
import os

from app.utils.dynamic_update import dynamic_update

from app import create_app


app = create_app()


# Запускаем поток при старте
_thread = None


def start_background_thread():
    global _thread
    if _thread is None or not _thread.is_alive():
        _thread = threading.Thread(target=dynamic_update, daemon=True)
        _thread.start()
        print("Поток dynamic_update запущен")


if __name__ == '__main__':
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        start_background_thread()
    app.run(debug=True, host='0.0.0.0', port=5000)
