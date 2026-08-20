# Inventario de Piezas de Carro

Web para agregar, buscar y eliminar piezas de carro (marca, modelo, año), con historial
permanente: al "eliminar" una pieza, no se borra — se mueve a una tabla de historial.

## Estructura del proyecto

```
inventario-piezas/
├── backend/          # API en Node.js + Express
│   ├── server.js
│   ├── supabaseClient.js
│   ├── package.json
│   └── .env.example
├── frontend/         # Página web (HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── config.js
└── database/
    └── schema.sql    # Script para crear las tablas en Supabase
```

## Paso 1 — Crear las tablas en Supabase

1. Entra a tu proyecto en supabase.com
2. Ve a **SQL Editor** > **New query**
3. Copia y pega todo el contenido de `database/schema.sql`
4. Dale **Run**

## Paso 2 — Configurar el backend localmente (para probar)

```bash
cd backend
npm install
cp .env.example .env
```

Abre `.env` y pon tus credenciales reales de Supabase
(las encuentras en **Project Settings > API** dentro de Supabase):

```
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_KEY=tu-anon-public-key
```

Luego corre:

```bash
npm start
```

Debería decir "Servidor corriendo en el puerto 3000".

## Paso 3 — Probar el frontend localmente

Abre `frontend/index.html` directamente en tu navegador (doble clic).
Debería conectarse a `http://localhost:3000` automáticamente.

## Paso 4 — Subir a GitHub

```bash
git init
git add .
git commit -m "Primera versión del inventario de piezas"
git remote add origin https://github.com/tu-usuario/inventario-piezas.git
git push -u origin main
```

## Paso 5 — Desplegar el backend en Render

1. En render.com, dale **New > Web Service**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. En **Environment Variables**, agrega `SUPABASE_URL` y `SUPABASE_KEY`
5. Dale **Create Web Service** — Render te dará una URL pública como
   `https://inventario-piezas-backend.onrender.com`

## Paso 6 — Conectar el frontend al backend público

Edita `frontend/config.js` y cambia la URL:

```js
const API_URL = "https://inventario-piezas-backend.onrender.com";
```

## Paso 7 — Publicar el frontend (para que todos entren)

La forma más simple: usar **GitHub Pages** solo para la carpeta `frontend/`.
En la configuración del repositorio > Pages, selecciona la rama y la carpeta `/frontend`.

> Nota: el plan gratis de Render "duerme" el backend tras varios minutos sin uso — la
> primera petición después de estar dormido puede tardar unos 30-50 segundos en responder.
