#!/usr/bin/env node

// setup.js — Скрипт быстрой установки Telegram Mini App
// Запуск: node setup.js

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUBMIT_FILE = path.join(__dirname, 'api', 'submit.js');
const INDEX_FILE = path.join(__dirname, 'index.html');
const WEBHOOK_PATTERN = /https:\/\/[a-zA-Z0-9.-]+\.leadteh\.ru\/inner_webhook\/[a-zA-Z0-9-]+/;

function printBanner() {
  console.log('');
  console.log('==============================================');
  console.log('   Telegram Mini App — Быстрая установка');
  console.log('   Регистрация + интеграция с Leadteh CRM');
  console.log('==============================================');
  console.log('');
}

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major < 18) {
    console.error(`Ошибка: требуется Node.js >= 18, установлена версия ${process.versions.node}`);
    console.error('Скачайте актуальную версию: https://nodejs.org/');
    process.exit(1);
  }
  console.log(`Node.js ${process.versions.node} — OK`);
}

function checkGit() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    console.log('Git — OK');
  } catch {
    console.error('Ошибка: git не найден. Установите git: https://git-scm.com/');
    process.exit(1);
  }
}

function isValidWebhookUrl(url) {
  return WEBHOOK_PATTERN.test(url.trim());
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

function confirm(rl, question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

async function askWebhookUrl(rl) {
  console.log('');
  console.log('Webhook URL можно найти в настройках Leadteh:');
  console.log('  Настройки → Интеграции → Inner Webhook');
  console.log('Формат: https://ВАША_УЧЁТКА.leadteh.ru/inner_webhook/ВАШ_UUID');
  console.log('');

  while (true) {
    const url = await ask(rl, 'Введите Webhook URL из Leadteh: ');

    if (isValidWebhookUrl(url)) {
      return url.trim();
    }

    console.log('');
    console.log('Неверный формат URL.');
    console.log('URL должен выглядеть так: https://xxx.leadteh.ru/inner_webhook/xxx-xxx-xxx');
    console.log('');
  }
}

function replaceWebhookUrl(newUrl) {
  if (!fs.existsSync(SUBMIT_FILE)) {
    console.error(`Ошибка: файл ${SUBMIT_FILE} не найден.`);
    console.error('Убедитесь, что вы запускаете скрипт из корня проекта.');
    process.exit(1);
  }

  let content = fs.readFileSync(SUBMIT_FILE, 'utf-8');

  if (!WEBHOOK_PATTERN.test(content)) {
    console.error('Ошибка: не удалось найти Webhook URL в api/submit.js.');
    console.error('Возможно, файл был изменён вручную.');
    process.exit(1);
  }

  content = content.replace(WEBHOOK_PATTERN, newUrl);
  fs.writeFileSync(SUBMIT_FILE, content, 'utf-8');

  console.log('');
  console.log('Webhook URL обновлён в api/submit.js — OK');
}

function isValidUrl(url) {
  return /^https?:\/\/.+/.test(url.trim());
}

async function askDocumentUrls(rl) {
  console.log('');
  console.log('Укажите ссылки на ваши документы (оферта, политика, обработка данных).');
  console.log('Ссылки будут открываться в браузере пользователя.');
  console.log('Формат: https://example.com/document или ссылка на Google Docs и т.д.');
  console.log('');
  console.log('Если документ не нужен — нажмите Enter, чтобы пропустить.');
  console.log('Соответствующий чекбокс не будет показан в форме.');
  console.log('');

  const docs = [
    { placeholder: '__OFFER_URL__', label: 'URL оферты', block: 'OFFER' },
    { placeholder: '__PRIVACY_URL__', label: 'URL политики конфиденциальности', block: 'PRIVACY' },
    { placeholder: '__DATA_PROCESSING_URL__', label: 'URL согласия на обработку данных', block: 'DATA_PROCESSING' },
  ];

  const urls = {};

  for (const doc of docs) {
    while (true) {
      const url = await ask(rl, `${doc.label} (Enter — пропустить): `);
      if (!url.trim()) {
        urls[doc.placeholder] = null;
        console.log(`  → ${doc.label} пропущен, чекбокс будет скрыт`);
        break;
      }
      if (isValidUrl(url)) {
        urls[doc.placeholder] = url.trim();
        break;
      }
      console.log('Неверный формат. URL должен начинаться с http:// или https://');
    }
  }

  return urls;
}

// Маппинг плейсхолдеров на имена блоков
const PLACEHOLDER_TO_BLOCK = {
  '__OFFER_URL__': 'OFFER',
  '__PRIVACY_URL__': 'PRIVACY',
  '__DATA_PROCESSING_URL__': 'DATA_PROCESSING',
};

function replaceDocumentUrls(urls) {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Ошибка: файл ${INDEX_FILE} не найден.`);
    console.error('Убедитесь, что вы запускаете скрипт из корня проекта.');
    process.exit(1);
  }

  let content = fs.readFileSync(INDEX_FILE, 'utf-8');

  for (const [placeholder, url] of Object.entries(urls)) {
    const blockName = PLACEHOLDER_TO_BLOCK[placeholder];
    if (url === null && blockName) {
      // Удаляем весь блок <!-- BLOCK:XXX -->...<!-- /BLOCK:XXX -->
      const blockRegex = new RegExp(
        `\\s*<!-- BLOCK:${blockName} -->[\\s\\S]*?<!-- /BLOCK:${blockName} -->`,
        'g'
      );
      content = content.replace(blockRegex, '');
    } else if (url && blockName) {
      // Подставляем URL и убираем маркеры
      content = content.replace(placeholder, url);
      content = content.replace(new RegExp(`\\s*<!-- BLOCK:${blockName} -->`, 'g'), '');
      content = content.replace(new RegExp(`\\s*<!-- /BLOCK:${blockName} -->`, 'g'), '');
    }
  }

  fs.writeFileSync(INDEX_FILE, content, 'utf-8');

  const skipped = Object.values(urls).filter((u) => u === null).length;
  console.log('');
  if (skipped > 0) {
    console.log(`Ссылки на документы обновлены в index.html — OK (пропущено: ${skipped})`);
  } else {
    console.log('Ссылки на документы обновлены в index.html — OK');
  }
}

function isVercelInstalled() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function ensureVercel(rl) {
  if (isVercelInstalled()) {
    console.log('Vercel CLI — OK');
    return;
  }

  console.log('');
  console.log('Vercel CLI не найден. Он нужен для деплоя проекта.');
  const yes = await confirm(rl, 'Установить Vercel CLI глобально (npm i -g vercel)?');

  if (!yes) {
    console.log('');
    console.log('Деплой пропущен. Вы можете установить Vercel CLI позже:');
    console.log('  npm i -g vercel');
    console.log('  vercel --prod');
    return;
  }

  console.log('');
  console.log('Устанавливаю Vercel CLI...');
  try {
    execSync('npm i -g vercel', { stdio: 'inherit' });
    console.log('Vercel CLI установлен — OK');
  } catch {
    console.error('Ошибка при установке Vercel CLI.');
    console.error('Попробуйте установить вручную: npm i -g vercel');
    return;
  }
}

async function deployToVercel(rl) {
  if (!isVercelInstalled()) {
    return null;
  }

  console.log('');
  const yes = await confirm(rl, 'Задеплоить проект на Vercel?');

  if (!yes) {
    console.log('');
    console.log('Деплой пропущен. Для ручного деплоя выполните:');
    console.log('  vercel --prod');
    return null;
  }

  console.log('');
  console.log('Запускаю деплой на Vercel...');
  console.log('(Если вы ещё не авторизованы, Vercel попросит войти в аккаунт)');
  console.log('');

  try {
    const output = execSync('vercel --prod --yes', {
      stdio: ['inherit', 'pipe', 'inherit'],
      encoding: 'utf-8',
    });

    // Извлекаем URL из вывода vercel
    const lines = output.trim().split('\n');
    const url = lines.find((line) => line.startsWith('https://'));
    return url ? url.trim() : null;
  } catch {
    console.error('');
    console.error('Ошибка при деплое. Попробуйте выполнить вручную:');
    console.error('  vercel --prod');
    return null;
  }
}

function printFinish(deployUrl) {
  console.log('');
  console.log('==============================================');
  console.log('   Установка завершена!');
  console.log('==============================================');
  console.log('');

  if (deployUrl) {
    console.log(`Ваше приложение: ${deployUrl}`);
    console.log('');
    console.log('Следующий шаг:');
    console.log(`  Укажите этот URL в настройках кнопки Web App вашего Telegram бота.`);
    console.log('');
    console.log('Подробнее о настройке бота:');
    console.log('  1. Откройте @BotFather в Telegram');
    console.log('  2. /mybots → выберите бота → Bot Settings → Menu Button');
    console.log(`  3. Укажите URL: ${deployUrl}`);
  } else {
    console.log('Webhook URL настроен. Для деплоя выполните:');
    console.log('  vercel --prod');
    console.log('');
    console.log('После деплоя укажите полученный URL в настройках');
    console.log('кнопки Web App вашего Telegram бота.');
  }

  console.log('');
}

async function askApiToken(rl) {
  console.log('');
  console.log('API-токен нужен для предзаполнения формы данными из Leadteh.');
  console.log('Где найти: Leadteh → Настройки → API → Скопировать токен');
  console.log('');

  const token = await ask(rl, 'Введите API-токен Leadteh (Enter — пропустить): ');
  const trimmed = (token || '').trim();

  if (!trimmed) {
    console.log('  → Пропущено. Предзаполнение формы работать не будет.');
    console.log('  → Вы можете добавить переменную LEADTEH_API_TOKEN позже');
    console.log('    в Vercel Dashboard → Project → Settings → Environment Variables');
    return null;
  }

  return trimmed;
}

function setVercelEnvVar(name, value) {
  // Удаляем если уже есть (игнорируем ошибку если не было)
  try {
    execSync(`vercel env rm ${name} production --yes`, { stdio: 'pipe' });
  } catch {}

  // Добавляем переменную, значение передаём через stdin
  execSync(`vercel env add ${name} production`, {
    input: value,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
}

async function askBotToken(rl) {
  console.log('');
  console.log('Токен бота нужен для верификации запросов из Telegram (HMAC-SHA256).');
  console.log('Это повышает безопасность — сервер будет проверять подпись initData.');
  console.log('Где найти: @BotFather → /mybots → выберите бота → API Token');
  console.log('');
  console.log('Если пропустить — форма будет работать без верификации.');
  console.log('');

  const token = await ask(rl, 'Введите токен Telegram-бота (Enter — пропустить): ');
  const trimmed = (token || '').trim();

  if (!trimmed) {
    console.log('  → Пропущено. Верификация initData будет отключена.');
    console.log('  → Вы можете добавить переменную TELEGRAM_BOT_TOKEN позже');
    console.log('    в Vercel Dashboard → Project → Settings → Environment Variables');
    return null;
  }

  return trimmed;
}

async function main() {
  printBanner();

  // Шаг 1: Проверка окружения
  console.log('[1/8] Проверка окружения...');
  checkNodeVersion();
  checkGit();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Шаг 2: Запрос Webhook URL
    console.log('');
    console.log('[2/8] Настройка Webhook URL...');
    const webhookUrl = await askWebhookUrl(rl);

    // Шаг 3: Подстановка webhook в код
    console.log('[3/8] Обновление конфигурации...');
    replaceWebhookUrl(webhookUrl);

    // Шаг 4: Ссылки на документы
    console.log('');
    console.log('[4/8] Настройка ссылок на документы...');
    const docUrls = await askDocumentUrls(rl);
    replaceDocumentUrls(docUrls);

    // Шаг 5: API-токен Leadteh
    console.log('');
    console.log('[5/8] API-токен Leadteh (для предзаполнения формы)...');
    const apiToken = await askApiToken(rl);

    // Шаг 6: Токен Telegram-бота (для верификации initData)
    console.log('');
    console.log('[6/8] Токен Telegram-бота (для верификации запросов)...');
    const botToken = await askBotToken(rl);

    // Шаг 7: Проверка Vercel CLI
    console.log('');
    console.log('[7/8] Проверка Vercel CLI...');
    await ensureVercel(rl);

    // Шаг 8: Деплой
    console.log('[8/8] Деплой на Vercel...');
    const deployUrl = await deployToVercel(rl);

    // Установка env-переменных после деплоя (проект уже привязан к Vercel)
    const envVars = [];
    if (apiToken) envVars.push({ name: 'LEADTEH_API_TOKEN', value: apiToken });
    if (botToken) envVars.push({ name: 'TELEGRAM_BOT_TOKEN', value: botToken });

    if (envVars.length > 0 && deployUrl && isVercelInstalled()) {
      console.log('');
      console.log('Устанавливаю переменные окружения на Vercel...');
      try {
        for (const { name, value } of envVars) {
          setVercelEnvVar(name, value);
          console.log(`${name} установлен — OK`);
        }
        console.log('');
        console.log('Повторный деплой для применения переменных...');
        try {
          execSync('vercel --prod --yes', {
            stdio: ['inherit', 'pipe', 'inherit'],
            encoding: 'utf-8',
          });
          console.log('Переменные применены — OK');
        } catch {
          console.log('Не удалось повторно задеплоить. Выполните вручную: vercel --prod');
        }
      } catch {
        console.log('Не удалось установить переменные автоматически.');
        console.log('Добавьте вручную в Vercel Dashboard → Settings → Environment Variables:');
        for (const { name, value } of envVars) {
          console.log(`  Имя: ${name}`);
          console.log(`  Значение: ${value}`);
          console.log('');
        }
      }
    } else if (envVars.length > 0 && !deployUrl) {
      console.log('');
      console.log('После деплоя добавьте переменные в Vercel:');
      console.log('  Vercel Dashboard → Project → Settings → Environment Variables');
      for (const { name, value } of envVars) {
        console.log(`  Имя: ${name}`);
        console.log(`  Значение: ${value}`);
        console.log('');
      }
    }

    // Финал
    printFinish(deployUrl);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('Непредвиденная ошибка:', err.message);
  process.exit(1);
});
