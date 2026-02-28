# Интеграция с Leadteh (LEADTEX)

Документация по интеграции Telegram Mini App с CRM-системой Leadteh.

---

## 1. Общая схема работы

```
Пользователь
    │
    ▼
Telegram бот (команда /start)
    │
    ▼
Leadteh создаёт контакт с telegram_id
    │
    ▼
Пользователь открывает Mini App (кнопка в боте)
    │
    ▼
index.html — форма регистрации (имя, фамилия, телефон)
    │
    ▼
POST /api/submit (Vercel Serverless Function)
    │
    ▼
Leadteh Inner Webhook — обновление данных контакта
```

---

## 2. Как Mini App получает Telegram ID

При открытии Mini App из Telegram бота, Telegram автоматически передаёт данные пользователя через `Telegram.WebApp.initDataUnsafe`:

```javascript
// index.html — получение telegram_id
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const initDataUnsafe = tg ? (tg.initDataUnsafe || {}) : {};

const telegram_id =
  tg && initDataUnsafe.user && typeof initDataUnsafe.user.id === 'number'
    ? initDataUnsafe.user.id
    : (window.DEV_TELEGRAM_ID || null);
```

Telegram передаёт объект `user`:
```javascript
{
    id: 123456789,           // Telegram ID пользователя
    first_name: "Иван",
    last_name: "Петров",
    username: "ivanpetrov",
    language_code: "ru"
}
```

---

## 3. Как данные отправляются на сервер

При отправке формы фронтенд делает POST-запрос на `/api/submit`:

```javascript
const payload = {
  firstName: "Иван",
  lastName: "Петров",
  phone: "+79991234567",
  telegram_id: 123456789,
  telegram: {
    initData: "...",           // Подписанные данные от Telegram
    user: { id: 123456789 }   // Объект пользователя
  }
};

fetch('/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

---

## 4. Серверная обработка (api/submit.js)

Serverless-функция на Vercel выполняет:

1. **Валидация** — проверяет наличие `firstName`, `lastName` и формат телефона (`/^\+7\d{10}$/`)
2. **Формирование payload** — собирает данные в формат Leadteh
3. **Отправка в Leadteh** — POST-запрос на Inner Webhook

### Webhook URL

```
https://rb786743.leadteh.ru/inner_webhook/485f8213-edeb-43db-8fc2-febd8715f7a7
```

URL захардкожен в `api/submit.js`, строка 10.

### Формат запроса к Leadteh

```json
{
  "contact_by": "telegram_id",
  "search": "123456789",
  "variables": {
    "customer_name": "Иван Петров",
    "customer_phone": "+79991234567",
    "telegram_user_name": "Иван Петров",
    "telegram_id": 123456789,
    "first_name": "Иван",
    "last_name": "Петров",
    "source": "telegram-webapp-registration",
    "ts": "2026-02-28T12:00:00.000Z",
    "registration_date": "2026-02-28",
    "registration_source": "telegram_mini_app"
  }
}
```

**Ключевые поля:**
- `contact_by: "telegram_id"` — указывает Leadteh искать контакт по полю telegram_id
- `search` — значение telegram_id для поиска
- `variables` — данные, которые будут записаны в карточку контакта

---

## 5. Настройка Leadteh

### Шаг 1: Подключение Telegram бота

1. В Leadteh перейдите в **Настройки → Каналы**
2. Подключите Telegram бота
3. Бот будет автоматически создавать контакты при получении `/start`

### Шаг 2: Создание Inner Webhook

1. Перейдите в **Настройки → Webhooks**
2. Создайте **Inner Webhook**
3. Скопируйте полученный URL
4. Вставьте его в `api/submit.js` (строка 10)

### Шаг 3: Создание сценария

В Leadteh создайте сценарий для обработки данных из webhook:

```
Триггер: Inner Webhook (ваш webhook)
    ↓
Действие: Обновить переменные контакта
    - customer_name, customer_phone, first_name, last_name
    ↓
Действие: Отправить сообщение в Telegram
    Текст: "Спасибо за регистрацию, {{first_name}}!"
    ↓
Действие: Установить тег "Зарегистрирован"
```

---

## 6. Доступные переменные в Leadteh

После получения webhook, в карточке контакта будут доступны:

| Переменная | Описание | Пример значения |
|------------|----------|-----------------|
| `{{customer_name}}` | Полное имя (Имя + Фамилия) | Иван Петров |
| `{{customer_phone}}` | Телефон в формате E.164 | +79991234567 |
| `{{telegram_user_name}}` | Имя из формы (Имя + Фамилия) | Иван Петров |
| `{{telegram_id}}` | Telegram ID пользователя | 123456789 |
| `{{first_name}}` | Имя | Иван |
| `{{last_name}}` | Фамилия | Петров |
| `{{source}}` | Источник данных | telegram-webapp-registration |
| `{{ts}}` | Временная метка (ISO 8601) | 2026-02-28T12:00:00.000Z |
| `{{registration_date}}` | Дата регистрации (YYYY-MM-DD) | 2026-02-28 |
| `{{registration_source}}` | Источник регистрации | telegram_mini_app |

---

## 7. Важные условия

### Контакт должен существовать до регистрации

Пользователь обязан сначала написать `/start` вашему Telegram боту. Это создаст контакт в Leadteh с его `telegram_id`. Только после этого Mini App сможет найти и обновить контакт.

```
1. Пользователь → /start боту → Leadteh создаёт контакт с telegram_id
2. Пользователь → открывает Mini App → заполняет форму
3. api/submit.js → ищет контакт по telegram_id → обновляет данные
```

### Формат телефона

Телефон принимается только в российском формате:
- Ввод: `+7 (999) 123-45-67` (маска IMask)
- Отправка: `+79991234567` (E.164)
- Валидация: `/^\+7\d{10}$/`

---

## 8. Коды ответов API

| Код | Описание |
|-----|----------|
| `200` | Данные успешно отправлены в Leadteh |
| `400` | Невалидные данные (пустые поля, неверный формат телефона) |
| `405` | Метод не POST |
| `502` | Ошибка при обращении к Leadteh webhook |
| `500` | Внутренняя ошибка сервера |

### Примеры ответов

**Успех (200):**
```json
{ "ok": true, "leadteh": { ... } }
```

**Ошибка валидации (400):**
```json
{ "error": "firstName and lastName are required" }
```
```json
{ "error": "Invalid phone format. Expected +7XXXXXXXXXX" }
```

**Ошибка Leadteh (502):**
```json
{ "error": "Leadteh webhook error", "status": 500, "body": null }
```

---

## 9. Файлы проекта, связанные с интеграцией

| Файл | Роль в интеграции |
|------|-------------------|
| `index.html` | Форма регистрации, получение telegram_id, отправка данных на /api/submit |
| `api/submit.js` | Валидация, формирование payload, отправка в Leadteh webhook |
| `vercel.json` | Конфигурация Vercel (дефолтная, пустой объект) |

---

## 10. Отладка

### Проверка Telegram ID

Откройте Mini App и в консоли браузера выполните:

```javascript
console.log(Telegram.WebApp.initDataUnsafe.user);
```

### Тестирование без Telegram

Для тестирования в обычном браузере установите переменную до загрузки скрипта:

```javascript
window.DEV_TELEGRAM_ID = 123456789;
```

Это позволит отправить форму с тестовым telegram_id.

### Проверка отправки в Leadteh

1. Откройте DevTools → Network
2. Отправьте форму
3. Найдите запрос на `/api/submit`
4. Проверьте тело запроса (Request Payload) и ответ (Response)

### Проверка в Leadteh

1. Откройте аккаунт: `rb786743.leadteh.ru`
2. Перейдите в **Контакты**
3. Найдите контакт по telegram_id
4. Проверьте, что переменные (customer_name, customer_phone и др.) обновились

---

## 11. Клонирование для другого аккаунта Leadteh

Чтобы использовать проект с другим аккаунтом Leadteh:

1. Создайте Inner Webhook в новом аккаунте Leadteh
2. Замените URL в `api/submit.js` (строка 10):
   ```javascript
   const WEBHOOK_URL = 'https://YOUR_ACCOUNT.leadteh.ru/inner_webhook/YOUR_WEBHOOK_ID';
   ```
3. Подключите Telegram бота к новому аккаунту Leadteh
4. Убедитесь, что в Leadteh настроен сценарий для обработки данных из webhook
5. Задеплойте проект на Vercel
