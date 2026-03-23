@echo off
echo Exportando la base de datos sqla_sandbox y tus schemas...
docker exec -i sqla-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "PasswordSuperSeguro123!" -C -Q "BACKUP DATABASE [sqla_sandbox] TO DISK = '/var/opt/mssql/data/sqla_sandbox_backup.bak' WITH FORMAT, INIT;"
if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al generar el respaldo.
    echo Asegurate de que la aplicacion este corriendo en Docker (contenedor sqla-db activo).
    pause
    exit /b %errorlevel%
)

echo Copiando el respaldo a esta carpeta...
docker cp sqla-db:/var/opt/mssql/data/sqla_sandbox_backup.bak "%~dp0sqla_sandbox_backup.bak"
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo extraer el archivo del contenedor.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================================
echo [EXITO] Respaldo generado! 
echo Encuentra el archivo  "sqla_sandbox_backup.bak"  aqui mismo.
echo Por favor, enviale este archivo .bak al administrador.
echo ==========================================================
pause
