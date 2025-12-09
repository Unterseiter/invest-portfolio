from flask import Flask
from flask_cors import CORS
from flask_restx import Api
from app.config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS для фронтенда
    CORS(app)

    # Инициализация API с Swagger
    api = Api(
        app,
        version='1.0',
        title='DTI Portfolio API',
        description='API для цифрового двойника инвестиционного портфеля',
        doc='/swagger/'
    )

    # Регистрация namespaces (модулей API)
    from app.routes.stock_name_route import api as stockNameApi
    from app.routes.table_securities_route import api as tableSecuritiesApi
    from app.routes.table_stock_route import api as tableStockApi
    from app.routes.user_info_route import api as UserInfoApi
    from app.routes.predict_route import api as PredictApi

    api.add_namespace(stockNameApi, path='/api')
    api.add_namespace(tableSecuritiesApi, path='/api')
    api.add_namespace(tableStockApi, path='/api')
    api.add_namespace(UserInfoApi, path='/api')
    api.add_namespace(PredictApi, path='/api')

    return app
