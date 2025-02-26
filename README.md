# ⚽️ ADRENALUX ⚽️ - Backend 


Adrenalux es un juego de cartas coleccionables basado en la liga española, donde los jugadores pueden coleccionar, intercambiar y competir con cartas de futbolistas. Este repositorio contiene el backend de la aplicación, desarrollado con **Node.js**, **Express**, **PostgreSQL** y el ORM **Drizzle**.

## 🚀 Tecnologías utilizadas

- **Node.js** y **Express** para el backend.
- **PostgreSQL** como base de datos.
- **Drizzle ORM** para la gestión de la base de datos.
- **Zod** para validación de datos.
- **JWT** para autenticación de usuarios.

## 📂 Estructura del Proyecto

```
📁 backend-adrenalux
├── 📁 src
│   ├── 📁 config      # Configuración de la base de datos
│   ├── 📁 controllers # Controladores de las rutas
│   ├── 📁 db/schemas  # Modelos de la base de datos con Drizzle
│   ├── 📁 routes      # Definición de las rutas
│   ├── 📁 middleware  # Middlewares de autenticación y validación
│   ├── 📁 services    # Lógica de negocio
│   ├── app.js      # Punto de entrada de la aplicación
│
├── 📄 .env            # Variables de entorno
├── 📄 package.json    # Dependencias y scripts
├── 📄 README.md       # Documentación
├── server.js # Documentación
```

## ⚙️ Instalación y configuración

1. Clonar el repositorio:
   ```sh
   git clone https://github.com/tuusuario/adrenalux-backend.git
   cd adrenalux-backend
   ```

2. Instalar dependencias:
   ```sh
   npm install
   ```

3. Configurar el archivo `.env` con los datos de conexión a PostgreSQL:
   ```sh
   DATABASE_URL=postgresql://usuario:password@localhost:5432/adrenalux
   JWT_SECRET=tu_clave_secreta
   ```

4. Ejecutar las migraciones de Drizzle:
   ```sh
   npm run migrate
   ```

5. Iniciar el servidor:
   ```sh
   npm start
   ```

## 📌 Funcionalidades principales

### 🔐 Autenticación y Usuarios
- Registro y autenticación de usuarios.
- Gestión de perfil (nombre, avatar, monedas, nivel de experiencia).
- Lista de amigos con código único.

### 🎴 Cartas y Sobres
- Apertura de sobres para obtener nuevas cartas.
- Visualización y filtrado de la colección de cartas.
- Mercado de compra y venta de cartas entre usuarios.
- Intercambio de cartas con amigos.

### 🏆 Partidas y Torneos
- Partidas 1vs1 contra usuarios aleatorios o amigos.
- Torneos de 8 jugadores con avance de rondas.
- Pausa de partidas con consentimiento del rival.

### 📊 Conexión con API externa
- Actualización de estadísticas de jugadores basada en su rendimiento real.
- Repositorio de la Api: https://github.com/sdelquin/laliga-data

## 🛠️ Rutas principales


---


