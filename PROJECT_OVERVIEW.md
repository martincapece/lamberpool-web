# 📊 LAMBERPOOL FC - Resumen del Proyecto

## 🎯 ¿Qué es Lamberpool?

Una plataforma web moderna para gestionar **estadísticas, resultados, valoraciones y fotos** de tu equipo de fútbol 8. ¡Sin papel, todo digital!

```
┌─────────────────────────────────────────────────────────┐
│                    LAMBERPOOL FC                        │
│                                                         │
│  ⚽ Equipo de Fútbol 8  →  📊 Estadísticas Digitales  │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura (Monorepo)

```
lamberpool-web/
│
├── 🌐 FRONTEND (puerto 3000)
│   └── Next.js + React + Tailwind CSS
│       ├── Página de Inicio
│       ├── Resultados (partidos jugados)
│       ├── Jugadores (plantilla + estadísticas)
│       └── Admin Panel (en desarrollo)
│
├── 🔧 BACKEND (puerto 3001)
│   └── Node.js + Express + Prisma
│       ├── /api/matches     → Partidos
│       ├── /api/players     → Jugadores
│       ├── /api/ratings     → Valoraciones
│       ├── /api/photos      → Fotos
│       └── ... (más rutas)
│
└── 💾 DATABASE (PostgreSQL)
    └── Teams, Players, Judges, Matches, Ratings, Photos, etc.
```

---

## ✨ Características Principales

### 👁️ PÚBLICO (cualquiera puede ver)
```
✅ Resultados de partidos
✅ Tabla de goleadores
✅ Valoraciones promedio de jugadores
✅ Galería de fotos por partido
```

### 🔐 SOLO ADMIN (en desarrollo)
```
⏳ Crear/editar partidos
⏳ Agregar valoraciones de jueces
⏳ Subir fotos
⏳ Gestionar plantilla
```

---

## 📊 La Magia: Sistema de Valoración

```
┌─────────────────────────────────────────────────┐
│         PARTIDO: Lamberpool 3 - Rival 1         │
├─────────────────────────────────────────────────┤
│                                                 │
│  📋 Juez 1 (Pato) →  Juan Pérez: 8.5            │
│  📋 Juez 2 (Chicho) → Juan Pérez: 8.0          │
│  📋 Juez 3 (Cape) →  Juan Pérez: 7.5           │
│  ❌ Juez 4 (Stefa) → (no evaluó)                │
│  ❌ Juez 5 (Roña) →  (no evaluó)                │
│                                                 │
│  ✨ PROMEDIO DE JUAN: 8.0 ⭐                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

Los 5 jueces califican a cada jugador (escala 1-10, pueden usar .5).
El sistema calcula automáticamente el promedio.

---

## 🗂️ Base de Datos (Entities)

```
├── 👥 PLAYERS (Jugadores)
│   └── Juan Pérez (#1), Carlos López (#2), ...
│
├── 🏆 TOURNAMENTS (Torneos)
│   └── Liga Nuñez - Tercera División (ACTIVO)
│
├── ⚽ MATCHES (Partidos)
│   ├── vs Equipo Rival (24/02/2024)
│   ├── vs Otro Equipo (17/02/2024)
│   └── ...
│
├── 📋 MATCH_PLAYERS (Quién jugó qué partido)
│   └── Juan Pérez jugó en Partido #1
│       ├── Posición: FWD (delantero)
│       ├── Goles: 2
│       ├── Tarjetas: (ninguna)
│       └── Ratings: [8.5, 8.0, 7.5] → Promedio 8.0
│
├── 👨‍⚖️ JUDGES (Jueces)
│   └── Pato, Chicho, Cape, Stefa, Roña
│
└── 📸 PHOTOS (Fotos)
    └── Galería por partido
```

---

## 🚀 Flujo de Uso

### 1️⃣ Admin crea un partido
```
Admin → Clic "Crear Partido" 
     → Ingresa: rival, fecha, resultado (3-1)
     → Sistema registra el partido
```

### 2️⃣ Admin registra quién jugó
```
Admin → Para cada jugador:
     → Selecciona posición (GK, DEF, MID, FWD)
     → Ingresa goles (0, 1, 2, ...)
     → Ingresa tarjetas (Y, R, o ninguna)
```

### 3️⃣ Jueces califican
```
5 Jueces → Abren app
        → Van a "Valorar partido"
        → Cada uno califica a los jugadores (1-10)
        → Sistema guarda y calcula promedio
```

### 4️⃣ Admin sube fotos
```
Admin → Selecciona partido
     → Sube múltiples fotos (JPG, PNG)
     → Público ve galería automáticamente
```

### 5️⃣ Público ve todo
```
Cualquiera → Abre www.lamberpool.com
           → Ve resultados ✅
           → Ve valoraciones de jugadores ✅
           → Ve galería de fotos ✅
```

---

## 📱 URLs Principales

| Página | URL | Descripción |
|--------|-----|-------------|
| **Inicio** | `/` | Resumen del equipo |
| **Resultados** | `/matches` | Lista de partidos |
| **Jugadores** | `/players` | Plantilla + estadísticas |
| **Admin** | `/admin` | Panel administrativo (desarrollo) |
| **API Health** | `/api/health` | Verificar backend |

---

## 💻 Stack Técnico

| Componente | Tecnología |
|-----------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Base de Datos | PostgreSQL + Prisma ORM |
| Fotos | Cloudinary (opcional) |
| Deploy (próximo) | Vercel + Railway/Render |

---

## 📦 Instalación Rápida (30 segundos)

```bash
# 1. Instalar deps
npm install

# 2. Iniciar PostgreSQL (si tienes Docker)
docker-compose up -d

# 3. Crear DB
npm run -w backend prisma:migrate

# 4. Seed de ejemplo
npm run -w backend seed

# 5. ¡Listo!
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:3001/api

---

## 🎯 Estado Actual

| Feature | Estado |
|---------|--------|
| 📊 Ver resultados | ✅ **LISTO** |
| 👥 Ver jugadores | ✅ **LISTO** |
| ☆ Ver valoraciones | ✅ **LISTO** |
| 🏆 Gestión de torneos | ✅ **LISTO** (backend) |
| 📅 Crear partidos | ⏳ *EN DESARROLLO* |
| ⭐ Admin: Agregar valoraciones | ⏳ *EN DESARROLLO* |
| 📸 Admin: Subir fotos | ⏳ *EN DESARROLLO* |
| 🔐 Autenticación | ⏳ *PLANEADO* |

---

## 🔄 Ciclo de Desarrollo

El proyecto está organizado en **sprints**:

1. **Sprint 1** ✅ (Completado)
   - Estructura base del proyecto
   - BD + Backend API
   - Frontend público (lectura)

2. **Sprint 2** ⏳ (Próximo)
   - Panel Admin UI
   - Crear partidos
   - Agregar valoraciones
   - Upload de fotos

3. **Sprint 3** ⏳ (Futuro)
   - Autenticación (JWT)
   - Estadísticas avanzadas (gráficos)
   - Deploy (Vercel + Railway)

---

## 🤔 Preguntas Frecuentes

**P: ¿Puedo ver resultados sin registrarme?**
R: Sí, la app es 100% pública para lectura. Solo admin puede crear datos.

**P: ¿Cuántos jueces pueden calificar?**
R: Exactamente 5 (Pato, Chicho, Cape, Stefa, Roña). Pero solo 3+ es obligatorio.

**P: ¿Cómo agrego un nuevo torneo?**
R: Actualmente solo vía API. Panel Admin viene pronto.

**P: ¿Funciona offline?**
R: No, necesita conexión a internet y postgre corriendo.

---

## 📖 Documentación

- 📘 [README.md](README.md) - Guía completa
- 🚀 [SETUP.md](SETUP.md) - Instalación paso a paso
- 🛠️ [.github/copilot-instructions.md](.github/copilot-instructions.md) - Notas de desarrollo

---

## 🎮 ¡Empieza Ya!

```bash
npm install && npm run dev
```

Abre http://localhost:3000 y ¡disfruta! ⚽

---

**Lamberpool FC** | Tercera División - Liga Nuñez | Creado con ❤️
