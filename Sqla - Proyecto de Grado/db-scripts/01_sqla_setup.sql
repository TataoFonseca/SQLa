-- ======================================================
--   SQLa - Script de configuración de SQL Server
--   Ejecutar como administrador (sa o usuario con permisos)
-- ======================================================

-- =============================================
-- 1. CREAR LA BASE DE DATOS
-- =============================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'sqla_sandbox')
BEGIN
    CREATE DATABASE sqla_sandbox;
    PRINT '✅ Base de datos sqla_sandbox creada.';
END
ELSE
    PRINT '⚠️  La base de datos sqla_sandbox ya existe.';
GO

USE sqla_sandbox;
GO

-- =============================================
-- 2. CREAR EL USUARIO DE APLICACIÓN
-- =============================================
-- Crear login a nivel servidor
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'sandbox_user')
BEGIN
    CREATE LOGIN sandbox_user
        WITH PASSWORD = 'PasswordSuperSeguro123!';
    PRINT '✅ Login sandbox_user creado.';
END
ELSE
    PRINT '⚠️  El login sandbox_user ya existe.';
GO

USE sqla_sandbox;
GO

-- Crear usuario en la base de datos
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'sandbox_user')
BEGIN
    CREATE USER sandbox_user FOR LOGIN sandbox_user;
    PRINT '✅ Usuario sandbox_user creado en sqla_sandbox.';
END
ELSE
    PRINT '⚠️  El usuario sandbox_user ya existe en sqla_sandbox.';
GO

-- =============================================
-- 3. ASIGNAR PERMISOS AL USUARIO
-- =============================================
-- El usuario necesita poder crear y administrar schemas por sesión,
-- crear tablas dentro de esos schemas y ejecutar DML.

-- Rol db_ddladmin: CREATE TABLE, CREATE SCHEMA, ALTER, DROP
ALTER ROLE db_ddladmin ADD MEMBER sandbox_user;

-- Rol db_datawriter: INSERT, UPDATE, DELETE en cualquier tabla
ALTER ROLE db_datawriter ADD MEMBER sandbox_user;

-- Rol db_datareader: SELECT en cualquier tabla
ALTER ROLE db_datareader ADD MEMBER sandbox_user;

-- Permiso extra para ejecutar CREATE SCHEMA dinámicamente
GRANT CREATE SCHEMA TO sandbox_user;
GRANT CREATE TABLE TO sandbox_user;

PRINT '✅ Permisos asignados a sandbox_user.';
GO

-- =============================================
-- 4. CREAR TABLAS DE INFRAESTRUCTURA
--    (las que usa el backend directamente en dbo)
-- =============================================

-- Tabla de sesiones (usada por session.service.js)
IF NOT EXISTS (
    SELECT * FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = 'dbo' AND t.name = 'sessions'
)
BEGIN
    CREATE TABLE dbo.sessions (
        id            NVARCHAR(36)   NOT NULL PRIMARY KEY,   -- UUID de la sesión
        schema_name   NVARCHAR(200)  NOT NULL,               -- p.ej. session_<uuid_sin_guiones>
        created_at    DATETIME2      NOT NULL DEFAULT GETDATE(),
        last_used_at  DATETIME2      NOT NULL DEFAULT GETDATE()
    );
    PRINT '✅ Tabla dbo.sessions creada.';
END
ELSE
    PRINT '⚠️  La tabla dbo.sessions ya existe.';
GO

-- Tabla de consultas (usada por project.service.js)
IF NOT EXISTS (
    SELECT * FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = 'dbo' AND t.name = 'queries'
)
BEGIN
    CREATE TABLE dbo.queries (
        id              NVARCHAR(36)    NOT NULL PRIMARY KEY,   -- UUID de la consulta
        session_id      NVARCHAR(36)    NOT NULL,
        sql_text        NVARCHAR(MAX)   NOT NULL,               -- SQL original del usuario
        transformed_sql NVARCHAR(MAX)   NULL,                   -- SQL con schema inyectado
        ast             NVARCHAR(MAX)   NULL,                   -- AST serializado como JSON
        tables          NVARCHAR(MAX)   NULL,                   -- Tablas detectadas (JSON)
        columns         NVARCHAR(MAX)   NULL,                   -- Columnas detectadas (JSON)
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_queries_sessions FOREIGN KEY (session_id)
            REFERENCES dbo.sessions(id)
            ON DELETE CASCADE
    );
    PRINT '✅ Tabla dbo.queries creada.';
END
ELSE
    PRINT '⚠️  La tabla dbo.queries ya existe.';
GO

-- =============================================
-- 5. VERIFICACIÓN FINAL
-- =============================================
PRINT '';
PRINT '=== VERIFICACIÓN DE CONFIGURACIÓN ===';

SELECT
    'BASE DE DATOS'  AS Objeto,
    name             AS Nombre,
    'OK'             AS Estado
FROM sys.databases
WHERE name = 'sqla_sandbox'

UNION ALL

SELECT
    'TABLA SESSIONS',
    SCHEMA_NAME(schema_id) + '.' + name,
    'OK'
FROM sys.tables
WHERE name = 'sessions'

UNION ALL

SELECT
    'TABLA QUERIES',
    SCHEMA_NAME(schema_id) + '.' + name,
    'OK'
FROM sys.tables
WHERE name = 'queries';
GO

PRINT '';
PRINT '✅ Configuración completada. Ejecuta el backend con: npm run dev';
GO
