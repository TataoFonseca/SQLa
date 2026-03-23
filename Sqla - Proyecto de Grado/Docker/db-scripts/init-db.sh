#!/bin/bash
# init-db.sh

echo "Waiting for SQL Server to start..."
for i in {1..50}; do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "SQL Server is ready."
        break
    fi
    sleep 1
done

if [ ! -f /var/opt/mssql/data/initialized.txt ]; then
    echo "Running initialization scripts..."
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /scripts/01_sqla_setup.sql
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /scripts/02_Chinook_SqlServer.sql
    
    if [ $? -eq 0 ]; then
        touch /var/opt/mssql/data/initialized.txt
        echo "Initialization finished successfully."
    else
        echo "Error running initialization scripts."
    fi
else
    echo "Database already initialized."
fi
