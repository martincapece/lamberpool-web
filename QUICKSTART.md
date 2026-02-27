⚽ **LAMBERPOOL FC** - Quick Start Guide

## 🚀 En 60 segundos:

```bash
# 1. Instalar
npm install

# 2. Levantar PostgreSQL (elige una opción):
# Opción A - Docker (recomendado)
docker-compose up -d

# Opción B - PostgreSQL local (ya corriendo)
# Sigue: SETUP.md → PASO 2

# 3. Crear BD
npm run -w backend prisma:migrate

# 4. Cargar datos de ejemplo (opcional pero recomendado)
npm run -w backend seed

# 5. ¡Listo!
npm run dev
```

## 🌐 URLs

| | URL |
|---|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:3001/api |
| **BD Visual** | http://localhost:5555 |

## 📖 Documentos

- 📊 [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - ¿Qué es Lamberpool?
- 🚀 [SETUP.md](SETUP.md) - Instalación detallada
- 📘 [README.md](README.md) - Documentación completa

## ⚠️ Requisitos

- ✅ Node.js 18+
- ✅ npm o yarn
- ❌ PostgreSQL (necesario) - ver SETUP.md

## 🛠️ Comandos Útiles

```bash
npm run dev              # Frontend + Backend
npm run backend:dev      # Solo Backend
npm run frontend:dev     # Solo Frontend
npm run -w backend prisma:studio  # Ver BD
```

## 🐛 ¿No funciona?

```bash
# Error de BD → ejecuta
npm run -w backend prisma:generate

# Error de puertos → edita backend/.env
# Puerto ocupado → cambia PORT=3002

# Necesitas limpiar todo
npm run -w backend prisma:migrate reset
```

## 📊 Stack

**Frontend**: Next.js + React + Tailwind
**Backend**: Node.js + Express  
**BD**: PostgreSQL + Prisma

---

¡Preguntas? Lee SETUP.md o PROJECT_OVERVIEW.md ⬇️
