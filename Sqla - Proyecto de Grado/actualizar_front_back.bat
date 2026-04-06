@echo off
echo ========================================================
echo   Actualizando Front-End y Back-End de SQLa...
echo   (El servidor SQL Server no sera afectado)
echo ========================================================
echo.

cd Docker

echo Deteniendo contenedores de front y back...
docker compose stop frontend backend

echo.
echo Reconstruyendo e iniciando front y back...
docker compose up -d --build --force-recreate frontend backend

echo.
echo ========================================================
echo   Listo! Front y Back actualizados.
echo   La aplicacion sigue corriendo en:
echo   http://localhost:8080
echo   Tus datos en SQL Server se conservaron.
echo ========================================================
pause
