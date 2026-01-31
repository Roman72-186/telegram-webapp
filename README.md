# Telegram Web App (интеграция с Leadteh)

Данное веб-приложение представляет собой Telegram Web App, которое интегрировано с системой Leadteh для обработки регистраций пользователей.

## Описание

Проект позволяет пользователям регистрироваться через Telegram Web App, заполняя форму с именем, фамилией и номером телефона. После отправки данные направляются в систему Leadteh через специальный вебхук.

## Особенности

- Интеграция с Telegram Web App API
- Валидация данных формы
- Маска для ввода номера телефона
- Отправка данных в Leadteh с идентификацией по telegram_id
- Адаптивный дизайн

## Структура проекта

- `index.html` - основная страница с формой регистрации
- `api/submit.js` - серверная функция для обработки отправки формы и интеграции с Leadteh
- `vercel.json` - конфигурационный файл для Vercel
- `LEADTEX_INTEGRATION.md` - инструкция по интеграции с Leadteh
- `TESTING_INSTRUCTIONS.md` - инструкция по тестированию интеграции

## Интеграция с Leadteh

Проект настроен на отправку данных в Leadteh по следующему вебхуку:
`https://rb786743.leadteh.ru/inner_webhook/485f8213-edeb-43db-8fc2-febd8715f7a7`

Данные отправляются в формате:
```json
{
  "contact_by": "telegram_id",
  "search": "telegram_id_пользователя",
  "variables": {
    "customer_name": "Имя Фамилия",
    "customer_phone": "+7XXXXXXXXXX",
    "telegram_user_name": "Имя Фамилия",
    "telegram_id": "telegram_id_пользователя",
    "source": "telegram-webapp-registration",
    "ts": "timestamp",
    "first_name": "Имя",
    "last_name": "Фамилия",
    "registration_date": "YYYY-MM-DD",
    "registration_source": "telegram_mini_app"
  }
}
```

## Требования

- Пользователь должен сначала написать команду `/start` боту, чтобы его контакт был создан в Leadteh с соответствующим telegram_id
- После этого при регистрации через Web App система сможет сопоставить данные с существующим контактом

## Тестирование

Для тестирования интеграции см. файл `TESTING_INSTRUCTIONS.md`.

## Деплой

Проект готов для деплоя на Vercel. Для корректной работы необходимо убедиться, что вебхук в Leadteh настроен правильно.

## Ссылки

- [GitHub](https://github.com/Roman72-186/telegram-webapp)
- [Vercel](https://telegram-webapp.vercel.app)