@echo off
chcp 65001 >nul 2>&1

echo.
echo ==============================================
echo    Telegram Mini App — Установка с нуля
echo    Регистрация + интеграция с Leadteh CRM
echo ==============================================
echo.

set "REPO_URL=https://github.com/Roman72-186/telegram-webapp.git"
set "FOLDER_NAME=telegram-webapp"

:: ============================================
:: Шаг 1: Проверка Git
:: ============================================
echo [1/4] Проверка Git...

where git >nul 2>&1
if %errorlevel%==0 (
    echo Git найден — OK
    goto :check_node
)

echo Git не найден. Пробую установить...

where winget >nul 2>&1
if %errorlevel%==0 (
    echo Устанавливаю Git через winget...
    winget install Git.Git --accept-source-agreements --accept-package-agreements
    if %errorlevel%==0 (
        echo Git установлен. Обновляю PATH...
        call :refresh_path
        where git >nul 2>&1
        if %errorlevel%==0 (
            echo Git доступен — OK
            goto :check_node
        )
        echo Git установлен, но не найден в PATH.
        echo Попробуйте закрыть и открыть скрипт заново.
        pause
        exit /b 1
    ) else (
        echo Ошибка при установке Git через winget.
    )
)

echo.
echo Не удалось установить Git автоматически.
echo Пожалуйста, установите Git вручную:
echo   https://git-scm.com/download/win
echo.
echo После установки перезапустите этот скрипт.
echo.
start https://git-scm.com/download/win
pause
exit /b 1

:: ============================================
:: Шаг 2: Проверка Node.js
:: ============================================
:check_node
echo.
echo [2/4] Проверка Node.js...

where node >nul 2>&1
if %errorlevel% neq 0 goto :install_node

:: Проверяем версию Node.js (>= 18)
for /f "tokens=1 delims=." %%a in ('node -v 2^>nul') do set "NODE_VER=%%a"
set "NODE_VER=%NODE_VER:v=%"

if "%NODE_VER%"=="" goto :install_node

if %NODE_VER% geq 18 (
    echo Node.js v%NODE_VER% найден — OK
    goto :clone_repo
)

echo Node.js найден, но версия %NODE_VER% слишком старая (нужна 18+).

:install_node
echo Node.js не найден или версия устарела. Пробую установить...

where winget >nul 2>&1
if %errorlevel%==0 (
    echo Устанавливаю Node.js LTS через winget...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    if %errorlevel%==0 (
        echo Node.js установлен. Обновляю PATH...
        call :refresh_path
        where node >nul 2>&1
        if %errorlevel%==0 (
            echo Node.js доступен — OK
            goto :clone_repo
        )
        echo Node.js установлен, но не найден в PATH.
        echo Попробуйте закрыть и открыть скрипт заново.
        pause
        exit /b 1
    ) else (
        echo Ошибка при установке Node.js через winget.
    )
)

echo.
echo Не удалось установить Node.js автоматически.
echo Пожалуйста, установите Node.js LTS вручную:
echo   https://nodejs.org/
echo.
echo После установки перезапустите этот скрипт.
echo.
start https://nodejs.org/
pause
exit /b 1

:: ============================================
:: Шаг 3: Клонирование репозитория
:: ============================================
:clone_repo
echo.
echo [3/4] Клонирование репозитория...

if exist "%FOLDER_NAME%" (
    echo Папка %FOLDER_NAME% уже существует.
    echo Удалите её или переименуйте, затем запустите скрипт снова.
    echo.
    pause
    exit /b 1
)

git clone %REPO_URL% %FOLDER_NAME%
if %errorlevel% neq 0 (
    echo.
    echo Ошибка при клонировании репозитория.
    echo Проверьте подключение к интернету и попробуйте снова.
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Шаг 4: Запуск setup.js
:: ============================================
echo.
echo [4/4] Запуск мастера установки...
echo.

cd %FOLDER_NAME%
node setup.js

if %errorlevel% neq 0 (
    echo.
    echo Ошибка при выполнении setup.js.
    echo.
    pause
    exit /b 1
)

echo.
pause
exit /b 0

:: ============================================
:: Обновление PATH из реестра (без перезапуска)
:: ============================================
:refresh_path
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USR_PATH=%%b"
set "PATH=%SYS_PATH%;%USR_PATH%"
exit /b 0
