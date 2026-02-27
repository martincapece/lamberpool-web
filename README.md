# Lamberpool FC - Team Statistics Web App

Una aplicación web moderna para gestionar estadísticas, resultados, valoraciones de jugadores y fotos de partidos del equipo de fútbol 8 **Lamberpool FC**.

## 🎯 Características

- 📊 **Gestión de Partidos**: Admin puede crear/editar partidos, resultados 
- ⭐ **Valoración Inteligente**: Sistema de 5 jueces (Pato, Chicho, Cape, Stefa, Roña) con promedios automáticos
- 📸 **Galería de Fotos**: Carga múltiple de fotos por partido organizadas en galería
- 🏆 **Múltiples Torneos**: Soporte para diferentes torneos (uno activo a la vez)
- 📈 **Estadísticas Completas**: Goles, tarjetas, posición de juego, valoración promedio
- 🔐 **Acceso Público**: Visualización de resultados y valoraciones para todos (lectura)
- 👨‍💼 **Panel Admin**: Solo administrador puede crear/editar datos

## 🏗️ Estructura del Proyecto

```
lamberpool-web/
├── backend/              # Node.js + Express API (TypeScript)
│   ├── src/
│   │   ├── index.ts     # Punto de entrada
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   └── routes/      # Endpoints API
│   ├── prisma/
│   │   ├── schema.prisma # Modelo de BD
│   │   └── seed.ts      # Datos iniciales
│   └── package.json
├── frontend/            # Next.js web app (TypeScript)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── matches/     # Página de resultados
│   │   ├── players/     # Página de jugadores
│   │   └── admin/       # Panel de administración
│   ├── components/      # Componentes reutilizables
│   ├── lib/            # Utilidades y API client
│   └── package.json
├── docker-compose.yml   # PostgreSQL en Docker
└── package.json         # Workspace root
```

## 🚀 Stack Tecnológico

### Backend
- **Node.js 18+** + **Express.js** (TypeScript)
- **Prisma ORM** para gestión de BD
- **PostgreSQL** como base de datos
- Soporte para **Cloudinary** (fotos opcionales)

### Frontend
- **Next.js 14** (React + TypeScript)
- **Tailwind CSS** para diseño responsive
- **Axios** para llamadas API

## 📋 Requisitos

- **Node.js** 18+
- **npm** o **yarn**
- **Docker** (recomendado para PostgreSQL) o PostgreSQL instalado localmente

## 🛠️ Instalación y Setup

### 1. Clonar el repositorio (ya está hecho)

```bash
cd lamberpool-web
```

### 2. Instalar dependencias

```bash
npm install
```

Este comando instalará dependencias tanto en `/backend` como en `/frontend` automáticamente (workspace monorepo).

### 3. Configurar la Base de Datos

#### Opción A: Con Docker (Recomendado)
```bash
docker-compose up -d
```

Esto levantará una instancia PostgreSQL en `localhost:5432` con credenciales:
- Usuario: `lamberpool_user`
- Contraseña: `lambda123`
- Base de datos: `lamberpool`

#### Opción B: PostgreSQL local
Si ya tienes PostgreSQL instalado, actualiza el `.env` del backend:
```
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/lamberpool"
```

### 4. Inicializar la Base de Datos

```bash
# Migrar esquema
npm run -w backend prisma:migrate

# (Opcional) Seed con datos de ejemplo
npm run -w backend seed
```

## 📦 Comandos Disponibles

```bash
# Desarrollo (backend + frontend simultáneamente)
npm run dev

# Solo backend
npm run backend:dev

# Solo frontend
npm run frontend:dev

# Build para producción
npm run build

# Prisma Studio (visualizar BD graphically)
npm run -w backend prisma:studio

# Crear nueva migración después de cambiar schema.prisma
npm run -w backend prisma:migrate
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Prisma Studio**: http://localhost:5555 (cuando ejecutas `prisma:studio`)

## 📊 Modelo de Datos

### Entidades principales:

```
Team (Lamberpool FC)
├── Players (Jugadores)
├── Tournaments (Torneos)
│   └── Matches (Partidos)
│       ├── MatchPlayers (Jugadores en el partido)
│       │   └── Ratings (Valoraciones de jueces)
│       └── Photos (Fotos del partido)
└── Judges (Jueces: Pato, Chicho, Cape, Stefa, Roña)
```

### Flujo de Valoración:
1. Por cada partido, se registra quién jugó
2. Los 5 jueces califican a cada jugador (1-10, con decimales .5)
3. Sistema calcula automáticamente el promedio de cada jugador
4. Público puede ver valoraciones agregadas

## 🎮 Uso de la App

### Página Pública
- **Inicio**: Resumen del equipo
- **Resultados**: Lista de partidos con placares
- **Jugadores**: Plantilla con estadísticas agregadas

### Área Admin (Próximamente completamente)
- Crear partidos
- Registrar asistencia y estadísticas
- Añadir valoraciones
- Subir fotos
- Gestionar jugadores

## 🔒 Seguridad

Actualmente la app no tiene autenticación. El panel admin está visible pero no funcional. Para producción, implementar:
- Autenticación (JWT o sesiones)
- Restricción de rutas admin
- Validación en backend

## 📝 Variables de Entorno

### Backend (`.env`)
```
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=opcional
CLOUDINARY_API_KEY=opcional
CLOUDINARY_API_SECRET=opcional
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🐛 Troubleshooting

### Error: "Can't reach database"
- Verifica que PostgreSQL esté corriendo: `docker ps`
- Revisa el DATABASE_URL en `.env`

### Error: "Prisma client not found"
```bash
npm run -w backend prisma:generate
```

### Frontend no conecta con API
- Asegúrate que el backend esté corriendo (`npm run backend:dev`)
- Verifica `NEXT_PUBLIC_API_URL` en `.env.local`

## 🚀 Próximos Pasos

1. **Implementar Panel Admin**
   - Formulario para crear partidos
   - Interfaz para agregar valoraciones
   - Uploader de fotos

2. **Agregar Upload de Fotos**
   - Integración con Cloudinary
   - Galería por partido

3. **Autenticación**
   - Login para admin
   - Protección de rutas

4. **Estadísticas Avanzadas**
   - Gráficos de rendimiento
   - Comparativa jugadores
   - Histórico por torneo

5. **Deploy**
   - Vercel (frontend)
   - Railway/Render (backend)

## 📞 Soporte

Para problemas o sugerencias, contacta al equipo de desarrollo.

---

**Creado para Lamberpool FC** ⚽ | Tercera División - Liga Nuñez

