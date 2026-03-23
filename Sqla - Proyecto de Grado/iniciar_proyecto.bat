@echo off
echo ========================================================
echo   Iniciando Entorno SQLa con Docker
echo ========================================================
echo.

cd Docker
docker compose up -d --build

echo.
echo ========================================================
echo   Listo! La aplicacion deberia estar corriendo en:
echo   http://localhost
echo ========================================================
pause
