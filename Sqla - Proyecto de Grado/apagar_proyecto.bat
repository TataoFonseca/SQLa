@echo off
echo ========================================================
echo   Apagando Entorno SQLa...
echo ========================================================
echo.

cd Docker
docker compose down

echo.
echo ========================================================
echo   El entorno se apago de forma segura.
echo   Tus bases de datos se han conservado.
echo ========================================================
pause
