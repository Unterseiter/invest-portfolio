import requests
import base64

# Ваши учетные данные
login = 'evgeniy.bulatov777@gmail.com'
password = 'Rinor111rinor'
url = 'https://passport.moex.com/authenticate'

# Создаем сессию (она поможет автоматически работать с куками)
session = requests.Session()

# Формируем заголовок Authorization
credentials = f"{login}:{password}"
encoded_credentials = base64.b64encode(credentials.encode()).decode()
headers = {
    'Authorization': f'Basic {encoded_credentials}'
}

# Выполняем запрос
response = session.get(url, headers=headers)

# Проверяем успешность запроса (код 200)
if response.status_code == 200:
    # Токен автоматически сохраняется в сессии в куке 'MicexPassportCert'
    # Можно посмотреть, что вернулось
    moex_token_cookie = session.cookies.get('MicexPassportCert')

    if moex_token_cookie:
        print("Токен успешно получен!")
        print(f"Значение куки MicexPassportCert: {moex_token_cookie}")

        # Теперь вы можете использовать эту сессию (session) для
        # последующих запросов к MOEX API, токен будет подставляться автоматически.
        # Например:
        # iss_data = session.get('https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json').json()

    else:
        print("Токен не найден в ответе. Проверьте логин и пароль.")
else:
    print(f"Ошибка: {response.status_code}")
    print(response.text)