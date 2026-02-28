#!/usr/bin/env node

// setup.js — Скрипт быстрой установки Telegram Mini App
// Запуск: node setup.js

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUBMIT_FILE = path.join(__dirname, 'api', 'submit.js');
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

async function main() {
  printBanner();

  // Шаг 1: Проверка окружения
  console.log('[1/5] Проверка окружения...');
  checkNodeVersion();
  checkGit();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Шаг 2: Запрос Webhook URL
    console.log('');
    console.log('[2/5] Настройка Webhook URL...');
    const webhookUrl = await askWebhookUrl(rl);

    // Шаг 3: Подстановка в код
    console.log('[3/5] Обновление конфигурации...');
    replaceWebhookUrl(webhookUrl);

    // Шаг 4: Проверка Vercel CLI
    console.log('');
    console.log('[4/5] Проверка Vercel CLI...');
    await ensureVercel(rl);

    // Шаг 5: Деплой
    console.log('[5/5] Деплой на Vercel...');
    const deployUrl = await deployToVercel(rl);

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
