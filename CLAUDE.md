# Telegram Web App — Обратная связь

## Описание проекта

Telegram Mini App для регистрации пользователей и отправки данных в CRM-систему Leadteh.
Пользователь открывает Web App из Telegram-бота, заполняет форму (имя, фамилия, телефон),
соглашается с офертой/политикой, и данные уходят через serverless API в Leadteh webhook.

## Стек технологий

- **Frontend:** HTML5, Tailwind CSS (CDN), vanilla JavaScript, IMask.js (v7.1.3)
- **Backend:** Vercel Serverless Functions (Node.js) — `api/submit.js`, `api/contact.js`
- **Деплой:** Vercel (автодеплой при push в main)
- **Интеграции:** Telegram Web App API, Leadteh CRM (Inner Webhook)
- **Репозиторий:** https://github.com/Roman72-186/telegram-webapp.git
- **Продакшн URL:** https://tg-registration.vercel.app

## Структура проекта

```
├── index.html              — Основная страница с формой регистрации
├── api/
│   ├── submit.js           — Serverless API (валидация + отправка в Leadteh)
│   └── contact.js          — Serverless API (предзаполнение формы по telegram_id из Leadteh)
├── setup.js                — Мастер установки (webhook, ссылки на документы, токены, деплой) — 8 шагов
├── install.bat             — Bootstrap-скрипт для Windows (установка Git/Node + клон + setup)
├── install.sh              — Bootstrap-скрипт для macOS/Linux (установка Git/Node + клон + setup)
├── vercel.json             — Конфигурация Vercel (пустой — дефолтные настройки)
├── CLAUDE.md               — Инструкции для AI-ассистента
├── README.md               — Описание проекта
├── PROJECT_GUIDE.md        — Полное руководство
├── LEADTEX_INTEGRATION.md  — Документация интеграции с Leadteh
├── TESTING_INSTRUCTIONS.md — Инструкция по тестированию
└── ИНСТРУКЦИЯ.txt          — Краткая инструкция для покупателей
```

## Архитектура и поток данных

```
Telegram Bot → Кнопка "Web App" → index.html (форма)
    ← GET /api/contact (предзаполнение из Leadteh API по telegram_id)
    → POST /api/submit (Vercel Function)
    → Leadteh webhook (CRM)
    → Ответ пользователю
```

Telegram передаёт `telegram_id` через `Telegram.WebApp.initDataUnsafe.user.id`.
API ищет контакт в Leadteh по `telegram_id` и обновляет его данные.

**Важно:** Пользователь должен сначала написать `/start` боту — это создаёт контакт в Leadteh.

## Ключевые моменты при разработке

- Язык интерфейса и комментариев — **русский**
- Телефон — только российский формат: `+7 (XXX) XXX-XX-XX`, отправляется как `+7XXXXXXXXXX`
- Форма требует заполнения всех полей + 3 чекбокса согласий
- Webhook URL захардкожен в `api/submit.js` (строка 10): `4889c51b-0bd8-42bd-979e-3bf67dbcece5`
- Tailwind подключён через CDN, без сборки
- Нет package.json — проект не требует `npm install`
- Тема адаптируется к Telegram (тёмная/светлая через CSS-переменные)
- Ссылки на документы (оферта, политика, обработка данных) — внешние, открываются в браузере (`target="_blank"`)
- `api/contact.js` — предзаполнение формы по `telegram_id` через Leadteh REST API (`GET /api/v1/getContacts`). Токен `LEADTEH_API_TOKEN` хранится в env-переменной Vercel (не в коде)
- `api/submit.js` — верификация `initData` через HMAC-SHA256 (опционально). Если env-переменная `TELEGRAM_BOT_TOKEN` задана — сервер проверяет подпись Telegram, невалидные запросы отклоняются (403). Если не задана — верификация пропускается (обратная совместимость). `telegram_id` валидируется как положительное целое число
- В `index.html` используются плейсхолдеры `__OFFER_URL__`, `__PRIVACY_URL__`, `__DATA_PROCESSING_URL__` — заменяются на реальные URL при установке через `setup.js`
- При установке (`setup.js`) любой документ можно пропустить (Enter) — его чекбокс будет удалён из формы. Блоки обёрнуты в HTML-маркеры `<!-- BLOCK:OFFER -->`, `<!-- BLOCK:PRIVACY -->`, `<!-- BLOCK:DATA_PROCESSING -->`. JS-валидация null-safe — не падает если чекбокс отсутствует

## Валидация формы

| Поле      | Правило                        |
|-----------|-------------------------------|
| Имя       | Минимум 2 символа              |
| Фамилия   | Минимум 2 символа              |
| Телефон   | Регулярка `/^\+7\d{10}$/`     |
| telegram_id | Положительное целое число или null (серверная валидация) |
| initData  | HMAC-SHA256 подпись Telegram (серверная проверка, если задан `TELEGRAM_BOT_TOKEN`) |
| Чекбоксы  | Обязательны только присутствующие в форме (можно пропустить при установке) |

## Установка с нуля (для покупателей)

Bootstrap-скрипты для пользователей, у которых может не быть Git и Node.js.

### Windows
Покупатель скачивает `install.bat` и запускает двойным кликом. Скрипт:
1. Проверяет Git — если нет, устанавливает через `winget` или открывает git-scm.com
2. Проверяет Node.js >= 18 — если нет, устанавливает через `winget` или открывает nodejs.org
3. Клонирует репозиторий (`git clone`)
4. Запускает `node setup.js`

После установки через winget требуется перезапуск скрипта (обновление PATH).

### macOS / Linux
```bash
curl -fsSL https://raw.githubusercontent.com/Roman72-186/telegram-webapp/main/install.sh | bash
```
Или скачать и запустить:
```bash
chmod +x install.sh && ./install.sh
```
Скрипт:
1. Проверяет Git — macOS: `xcode-select --install`, Linux: apt-get/dnf/brew
2. Проверяет Node.js >= 18 — устанавливает через brew или NodeSource (apt/dnf)
3. Клонирует репозиторий
4. Запускает `node setup.js`

### Важно
- После `git clone` у покупателя создаётся **независимая копия** — обновления из оригинального репозитория автоматически не приходят
- Для получения обновлений покупателю нужно выполнить `git pull origin main`

## Команды деплоя

### Git — коммит и пуш

```bash
# Проверить статус
git status

# Добавить все изменения
git add -A

# Коммит
git commit -m "Описание изменений"

# Пуш в main (запускает автодеплой на Vercel)
git push origin main
```

### Vercel CLI (альтернативный способ)

```bash
# Установка Vercel CLI (однократно)
npm i -g vercel

# Деплой в preview
vercel

# Деплой в продакшн
vercel --prod
```

### Проверка деплоя

После пуша в main Vercel автоматически собирает и деплоит проект.
Проверить статус: https://vercel.com/dashboard → выбрать проект → Deployments.

Продакшн: https://tg-registration.vercel.app

## Тестирование

- Открыть Web App через Telegram-бота (проверить получение telegram_id)
- Проверить валидацию: пустые поля, короткие имена, невалидный телефон
- Проверить отправку формы и ответ от Leadteh
- Проверить отображение в тёмной теме Telegram
- Проверить что ссылки на документы открываются в браузере (target="_blank")
- Если задан `TELEGRAM_BOT_TOKEN` — убедиться что запросы без валидного initData отклоняются (403)
- Если НЕ задан `TELEGRAM_BOT_TOKEN` — форма работает как раньше (без верификации)
- Отправить запрос с `telegram_id: "abc"` или `null` — убедиться что невалидные значения отклоняются (400)
- После отправки формы — сообщение "Спасибо!" видно ~1.5 сек перед закрытием Web App

## Переменные окружения (Vercel)

| Переменная | Обязательная | Описание |
|------------|-------------|----------|
| `LEADTEH_API_TOKEN` | Нет | Токен API Leadteh для предзаполнения формы (`api/contact.js`) |
| `TELEGRAM_BOT_TOKEN` | Нет | Токен Telegram-бота для HMAC-SHA256 верификации initData (`api/submit.js`). Если не задан — верификация отключена |

Обе переменные можно задать через `setup.js` (шаги 5 и 6) или вручную в Vercel Dashboard → Settings → Environment Variables.

## Интеграция с Leadteh

- **Аккаунт:** rb257034.leadteh.ru
- **Webhook URL:** `https://rb257034.leadteh.ru/inner_webhook/4889c51b-0bd8-42bd-979e-3bf67dbcece5`
- **Поиск контакта:** по полю `telegram_id` (параметры `contact_by` + `search`)
- **Передаваемые переменные:**

| Переменная | Описание | Пример |
|------------|----------|--------|
| `customer_name` | Полное имя | `Иван Петров` |
| `customer_phone` | Телефон в E.164 | `+79991234567` |
| `telegram_user_name` | Имя из формы | `Иван Петров` |
| `telegram_id` | ID пользователя Telegram | `123456789` |
| `first_name` | Имя | `Иван` |
| `last_name` | Фамилия | `Петров` |
| `source` | Источник | `telegram-webapp-registration` |
| `registration_date` | Дата регистрации | `2026-02-28` |
| `registration_source` | Источник регистрации | `telegram_mini_app` |
| `ts` | Временная метка ISO | `2026-02-28T12:00:00.000Z` |
