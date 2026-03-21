#!/bin/bash
# entrypoint.sh

# Ejecuta el script de inicialización en segundo plano
/bin/bash /scripts/init-db.sh &

# Inicia el proceso principal de SQL Server
exec /opt/mssql/bin/sqlservr
