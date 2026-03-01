#!/bin/bash
set -e

REPO_URL="https://github.com/Roman72-186/telegram-webapp.git"
FOLDER_NAME="telegram-webapp"

echo ""
echo "=============================================="
echo "   Telegram Mini App — Установка с нуля"
echo "   Регистрация + интеграция с Leadteh CRM"
echo "=============================================="
echo ""

# ============================================
# Шаг 1: Проверка Git
# ============================================
echo "[1/4] Проверка Git..."

# На macOS /usr/bin/git — shim, который без Xcode CLI tools
# показывает GUI-диалог при любом вызове (включая git --version).
# Поэтому на macOS сначала проверяем xcode-select -p (тихо, без диалога).
GIT_OK=false

if [ "$(uname -s)" = "Darwin" ]; then
    if xcode-select -p &>/dev/null; then
        GIT_OK=true
    fi
else
    if command -v git &>/dev/null; then
        GIT_OK=true
    fi
fi

if [ "$GIT_OK" = true ]; then
    echo "Git найден — OK"
else
    echo "Git не найден. Пробую установить..."

    OS="$(uname -s)"
    INSTALLED=false

    case "$OS" in
        Darwin)
            echo "macOS: для работы с Git нужны Command Line Tools."
            echo "Запускаю установку..."
            echo ""
            xcode-select --install 2>/dev/null || true
            echo ""
            echo "Дождитесь завершения установки в открывшемся окне,"
            echo "затем перезапустите этот скрипт."
            echo ""
            exit 0
            ;;
        Linux)
            if command -v apt-get &>/dev/null; then
                echo "Устанавливаю git через apt-get..."
                sudo apt-get update && sudo apt-get install -y git && INSTALLED=true
            elif command -v dnf &>/dev/null; then
                echo "Устанавливаю git через dnf..."
                sudo dnf install -y git && INSTALLED=true
            elif command -v brew &>/dev/null; then
                echo "Устанавливаю git через brew..."
                brew install git && INSTALLED=true
            fi
            ;;
    esac

    if [ "$INSTALLED" = false ]; then
        echo ""
        echo "Не удалось установить Git автоматически."
        echo "Пожалуйста, установите Git вручную:"
        echo "  https://git-scm.com/"
        echo ""
        echo "После установки перезапустите этот скрипт."
        exit 1
    fi

    echo "Git установлен — OK"
fi

# ============================================
# Шаг 2: Проверка Node.js
# ============================================
echo ""
echo "[2/4] Проверка Node.js..."

NEED_NODE=false

if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge 18 ] 2>/dev/null; then
        echo "Node.js v$NODE_VER найден — OK"
    else
        echo "Node.js найден, но версия $NODE_VER слишком старая (нужна 18+)."
        NEED_NODE=true
    fi
else
    NEED_NODE=true
fi

if [ "$NEED_NODE" = true ]; then
    echo "Node.js не найден или версия устарела. Пробую установить..."

    OS="$(uname -s)"
    INSTALLED=false

    case "$OS" in
        Darwin)
            if command -v brew &>/dev/null; then
                echo "Устанавливаю Node.js через brew..."
                brew install node && INSTALLED=true
            fi
            ;;
        Linux)
            if command -v apt-get &>/dev/null; then
                echo "Устанавливаю Node.js через apt-get..."
                # NodeSource LTS
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && \
                sudo apt-get install -y nodejs && INSTALLED=true
            elif command -v dnf &>/dev/null; then
                echo "Устанавливаю Node.js через dnf..."
                curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - && \
                sudo dnf install -y nodejs && INSTALLED=true
            elif command -v brew &>/dev/null; then
                echo "Устанавливаю Node.js через brew..."
                brew install node && INSTALLED=true
            fi
            ;;
    esac

    if [ "$INSTALLED" = false ]; then
        echo ""
        echo "Не удалось установить Node.js автоматически."
        echo "Пожалуйста, установите Node.js LTS вручную:"
        echo "  https://nodejs.org/"
        echo ""
        echo "После установки перезапустите этот скрипт."
        exit 1
    fi

    echo "Node.js установлен — OK"
fi

# ============================================
# Шаг 3: Клонирование репозитория
# ============================================
echo ""
echo "[3/4] Клонирование репозитория..."

if [ -d "$FOLDER_NAME" ]; then
    echo "Папка $FOLDER_NAME уже существует."
    if [ -d "$FOLDER_NAME/.git" ]; then
        echo "Обновляю из репозитория (git pull)..."
        git -C "$FOLDER_NAME" pull origin main
    else
        echo "Папка не является git-репозиторием."
        echo "Удалите её или переименуйте, затем запустите скрипт снова."
        exit 1
    fi
else
    git clone "$REPO_URL" "$FOLDER_NAME"
fi

# ============================================
# Шаг 4: Запуск setup.js
# ============================================
echo ""
echo "[4/4] Запуск мастера установки..."
echo ""

cd "$FOLDER_NAME"
# При запуске через curl | bash stdin — это пайп, а не терминал.
# Перенаправляем stdin на /dev/tty, чтобы setup.js мог читать ввод пользователя.
node setup.js < /dev/tty

# ============================================
# Подсказка после завершения
# ============================================
echo ""
echo "----------------------------------------------"
echo "  Проект находится в папке: ~/$FOLDER_NAME"
echo "----------------------------------------------"
echo ""
echo "Если деплой не был выполнен, выполните вручную:"
echo "  cd ~/$FOLDER_NAME"
echo "  sudo npm i -g vercel"
echo "  vercel --prod"
echo ""
