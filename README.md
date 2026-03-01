# Telegram Web App (интеграция с Leadteh)

Данное веб-приложение представляет собой Telegram Web App, которое интегрировано с системой Leadteh для обработки регистраций пользователей.

## Описание

Проект позволяет пользователям регистрироваться через Telegram Web App, заполняя форму с именем, фамилией и номером телефона. После отправки данные направляются в систему Leadteh через специальный вебхук.

## Особенности

- Интеграция с Telegram Web App API
- Валидация данных формы (клиент + сервер)
- Маска для ввода номера телефона (+7 формат)
- Отправка данных в Leadteh с идентификацией по telegram_id
- Предзаполнение формы из Leadteh API (по telegram_id)
- Верификация запросов через HMAC-SHA256 подпись Telegram initData (опционально)
- Адаптивный дизайн с поддержкой тёмной темы Telegram
- Мастер установки `setup.js` (8 шагов — webhook, документы, токены, деплой)
- Bootstrap-скрипты `install.bat` / `install.sh` для установки с нуля

## Структура проекта

- `index.html` — основная страница с формой регистрации
- `api/submit.js` — серверная функция (валидация, верификация initData, отправка в Leadteh)
- `api/contact.js` — серверная функция (предзаполнение формы по telegram_id из Leadteh)
- `setup.js` — мастер установки (webhook, ссылки на документы, токены, деплой) — 8 шагов
- `install.bat` — bootstrap-скрипт для Windows
- `install.sh` — bootstrap-скрипт для macOS/Linux
- `vercel.json` — конфигурация Vercel

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

## Документация

Для подробного ознакомления с проектом и инструкций по клонированию для других аккаунтов Leadteh, смотрите:
- [Полное руководство по проекту](PROJECT_GUIDE.md)

## Переменные окружения (Vercel)

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `LEADTEH_API_TOKEN` | Нет | Токен API Leadteh для предзаполнения формы |
| `TELEGRAM_BOT_TOKEN` | Нет | Токен Telegram-бота для HMAC-SHA256 верификации initData. Если не задан — верификация отключена |

Переменные задаются через `setup.js` (шаги 5 и 6) или вручную в Vercel Dashboard → Settings → Environment Variables.

## Деплой

Проект готов для деплоя на Vercel. Для корректной работы необходимо убедиться, что вебхук в Leadteh настроен правильно.

## Ссылки

- [GitHub](https://github.com/Roman72-186/telegram-webapp)
- [Vercel](https://tg-registration.vercel.app)