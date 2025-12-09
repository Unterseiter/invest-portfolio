import threading

from app.utils.dynamic_update import dynamic_update

from app import create_app


app = create_app()

thread = threading.Thread(target=dynamic_update, daemon=True)
thread.start()


if __name__ == '__main__':

    app.run(debug=True, host='0.0.0.0', port=5000)
