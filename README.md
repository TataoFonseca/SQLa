# SQLa - Aplicativo para el aprendizaje de SQL mediante programación por bloques.

**SQLa** es una herramienta educativa para el aprendizaje de SQL mediante programación visual por bloques. Los usuarios construyen consultas SQL arrastrando y conectando bloques gráficos —sin escribir código directamente— y las ejecutan en tiempo real contra una base de datos sandbox de Microsoft SQL Server.

Desarrollado como Proyecto de Grado por **Jonathan David Fonseca Rubio** y **Jose David Gomez Galvis**.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación y Uso](#instalación-y-uso)
- [Scripts Disponibles](#scripts-disponibles)
- [Autores](#autores)
- [Licencia](#licencia)

---

## Características Principales

- **Editor visual de bloques SQL** — basado en Blockly v12; los bloques se conectan con lógica de tipos para evitar construcciones inválidas.
- **Soporte DDL**: `CREATE TABLE` con definición de columnas y constraints (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`, `REFERENCES`).
- **Soporte DML**: `SELECT`, `FROM`, `INNER JOIN`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY` y funciones de agregación (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`).
- **Ejecución en tiempo real** — el SQL generado se envía al backend, se analiza y se ejecuta contra un sandbox de SQL Server; los resultados se muestran en tabla directamente en la interfaz.
- **Diagrama ERD interactivo** — panel lateral con el esquema de la base de datos Chinook renderizado con Cytoscape.js, con zoom, pan y resaltado dinámico de las tablas usadas en la consulta activa.
- **Gestión de sesiones** — cada usuario recibe un UUID de sesión al iniciar; las consultas ejecutadas quedan registradas en la BD.
- **Exportación** — descarga el historial de la sesión como `.SQL` o el estado del workspace como `.JSON`.
- **Diagrama DDL en vivo** — al construir un `CREATE TABLE`, el panel ERD muestra una tarjeta con el esquema de la tabla en tiempo real.

---

## Arquitectura

```
┌──────────────────────────────┐        ┌────────────────────────────┐
│         Frontend             │  HTTP  │         Backend            │
│  Vite + Blockly + Cytoscape  │◄──────►│  Node.js + Express 5       │
│       localhost:5173         │        │       localhost:3000        │
└──────────────────────────────┘        └────────────┬───────────────┘
                                                     │ mssql
                                         ┌───────────▼───────────┐
                                         │   Microsoft SQL Server │
                                         │   sqla_sandbox DB      │
                                         │       port 1433        │
                                         └───────────────────────┘
```

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | Vite + JavaScript ES Modules | 5173 |
| Backend | Node.js + Express | 3000 |
| Base de datos | Microsoft SQL Server | 1433 |

---

## Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| [Blockly](https://developers.google.com/blockly) | 12.x | Editor de bloques visuales |
| [Cytoscape.js](https://js.cytoscape.org/) | 3.30 | Diagrama ERD interactivo |
| [Vite](https://vite.dev/) | 7.x | Bundler y servidor de desarrollo |
| [Bootstrap](https://getbootstrap.com/) | 5.3 | Componentes UI y sistema de grilla |
| JavaScript | ES2022 (ESM) | Lógica del cliente |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| [Node.js](https://nodejs.org/) | ≥18 | Runtime del servidor |
| [Express](https://expressjs.com/) | 5.x | Framework HTTP |
| [mssql](https://www.npmjs.com/package/mssql) | 12.x | Driver de conexión a SQL Server |
| [node-sql-parser](https://www.npmjs.com/package/node-sql-parser) | 5.x | Análisis y transformación de SQL |
| [uuid](https://www.npmjs.com/package/uuid) | 13.x | Generación de UUIDs de sesión |
| [dotenv](https://www.npmjs.com/package/dotenv) | 17.x | Variables de entorno |
| [cors](https://www.npmjs.com/package/cors) | 2.x | Manejo de CORS |

### Base de Datos
- **Microsoft SQL Server** (cualquier edición: Express, Developer, Standard)
- Base de datos de práctica: **Chinook** (esquema de tienda de música digital)

---

## Instalación y Uso

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Microsoft SQL Server (Express Edition es suficiente)
- SQL Server Configuration Manager — TCP/IP habilitado en el puerto **1433**
- Autenticación mixta habilitada en SQL Server (SQL Server + Windows Authentication)

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/TuUsuario/SQLa.git
cd SQLa
```

---

### 2. Configurar la base de datos

En **SQL Server Management Studio (SSMS)** o mediante `sqlcmd`, ejecuta los scripts en orden:

```bash
# Crear la BD sandbox, el usuario y las tablas de sesiones
sqlcmd -S localhost -E -i "Sqla - Proyecto de Grado/db-scripts/01_sqla_setup.sql"

# Cargar el esquema y datos de Chinook (base de datos de práctica)
sqlcmd -S localhost -E -i "Sqla - Proyecto de Grado/db-scripts/02_Chinook_SqlServer.sql"
```

> El script `01_sqla_setup.sql` crea la base de datos `sqla_sandbox`, el login `sandbox_user` y las tablas `dbo.sessions` y `dbo.queries`.

---

### 3. Configurar el backend

Crea el archivo de variables de entorno en `Sqla - Proyecto de Grado/sqla-backend/src/.env`:

```env
DB_USER=sandbox_user
DB_PASSWORD=TuContraseñaAqui
DB_SERVER=localhost
DB_DATABASE=sqla_sandbox
DB_PORT=1433
```

> La contraseña debe coincidir con la definida en el script `01_sqla_setup.sql`.

---

### 4. Instalar dependencias

**Backend:**
```bash
cd "Sqla - Proyecto de Grado/sqla-backend"
npm install
```

**Frontend:**
```bash
cd "Sqla - Proyecto de Grado/sqla-app"
npm install
```

---

### 5. Ejecutar el proyecto

Abre **dos terminales** en paralelo:

**Terminal 1 — Backend:**
```bash
cd "Sqla - Proyecto de Grado/sqla-backend"
npm start
# ✅ Backend corriendo en http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd "Sqla - Proyecto de Grado/sqla-app"
npm run dev
# ✅ Frontend corriendo en http://localhost:5173
```

Abre el navegador en `http://localhost:5173`.

---

## Scripts Disponibles

### Frontend (`sqla-app`)

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Inicia el servidor de desarrollo Vite con HMR |
| `npm run build` | Genera el bundle de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción localmente |

### Backend (`sqla-backend`)

| Comando | Descripción |
|---------|------------|
| `npm start` | Inicia el servidor Express (`node src/server.js`) |

---

## Autores

| Nombre | Rol |
|--------|-----|
| **Jonathan David Fonseca Rubio** | Desarrollo y diseño |
| **Jose David Gomez Galvis** | Desarrollo y diseño |

Proyecto de Grado — 2026.

---

## Licencia

Este proyecto se distribuye bajo la licencia **ISC**.
