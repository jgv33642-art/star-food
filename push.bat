@echo off
echo =======================================
echo     AUTOMAÇÃO GIT - LANCHONETE
echo =======================================

:: Verifica se o git está inicializado
if not exist .git (
    echo [!] Inicializando repositório Git...
    git init
)

:: Adiciona todos os arquivos
echo [+] Adicionando arquivos...
git add .

:: Pergunta pela mensagem do commit (opcional)
set /p msg="Digite a mensagem do commit (pressione Enter para usar 'atualização automática'): "

if "%msg%"=="" (
    set msg=atualização automática em %date% %time%
)

:: Realiza o commit
echo [!] Criando commit: "%msg%"
git commit -m "%msg%"

:: Tenta fazer o push
echo [>] Enviando para o GitHub...
git push

if %errorlevel% neq 0 (
    echo.
    echo [!] Ocorreu um erro no Push. 
    echo [!] Verifique se o repositório remoto está configurado corretamente.
    echo [!] Se for a primeira vez, use: git remote add origin SEU_URL_DO_GITHUB
) else (
    echo.
    echo [OK] Sincronização concluída com sucesso!
)

pause
