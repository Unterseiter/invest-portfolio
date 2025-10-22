import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Базовые настройки
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # База данных
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'admin1234')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'dti_project')

    # Настройки API
    API_TITLE = 'DTI Portfolio API'
    API_VERSION = '1.0'

    # Настройки загрузки данных
    DATA_UPLOAD_FOLDER = os.environ.get('DATA_UPLOAD_FOLDER', 'data/')
    MAX_CONTENT_LENGTH = 64 * 1024 * 1024  # 64MB max file upload