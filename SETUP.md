# 🚀 GUÍA DE SETUP - Lamberpool FC

¡Bienvenido! Este documento te guiará paso a paso para tener la aplicación corriendo localmente.

## ✅ Requisitos Instalados

- ✅ Node.js 18+ 
- ✅ npm/yarn
- ⚠️ **PostgreSQL** (necesario) - VER ABAJO

## 📋 PASO 1: Verificar PostgreSQL

Necesitas tener PostgreSQL corriendo. Tienes dos opciones:

### Opción A: Docker (Recomendado - Más fácil)

Si tienes **Docker Desktop** instalado:

```bash
docker-compose up -d
```

✅ Esto levantará PostgreSQL automáticamente en puerto 5432

Verifica que esté corriendo:
```bash
docker ps
# Deberías ver "lamberpool_postgres" en la lista
```

### Opción B: PostgreSQL Local

Si ya tienes PostgreSQL instalado:

1. Abre pgAdmin o psql
2. Crea nueva base de datos:
   ```sql
   CREATE DATABASE lamberpool;
   CREATE USER lamberpool_user WITH PASSWORD 'lambda123';
   GRANT ALL PRIVILEGES ON DATABASE lamberpool TO lamberpool_user;
   ```

3. Edita `backend/.env` y asegúrate de que DATABASE_URL apunte a tu instancia:
   ```
   DATABASE_URL="postgresql://lamberpool_user:lambda123@localhost:5432/lamberpool"
   ```

4. Continúa con el Paso 2 ⬇️

---

## 📊 PASO 2: Crear Base de Datos

Ejecuta las migraciones de Prisma:

```bash
npm run -w backend prisma:migrate
```

**Pregunta**: "Enter a name for the new migration" → Presiona ENTER para auto

✅ Esto creará todas las tablas del schema

---

## 🌱 PASO 3: (Opcional) Cargar Datos de Ejemplo

Carga datos iniciales (equipo, jugadores, jueces, un partido de ejemplo):

```bash
npm run -w backend seed
```

Esto es útil para probar la app con datos. **No es obligatorio** si prefieres empezar vacío.

---

## 🎮 PASO 4: Iniciar la Aplicación

```bash
npm run dev
```

Esto abre **dos servidores**:
- 🌐 **Frontend**: http://localhost:3000 
- 🔧 **Backend API**: http://localhost:3001/api

Abre tu navegador en `http://localhost:3000` ¡La app está lista!

---

## 🔍 Verificar que TODO Funciona

1. **Frontend cargó**: ¿Ves la página de inicio de Lamberpool?
2. **Backend conectado**: ¿Las páginas "Resultados" y "Jugadores" cargan datos?
3. **BD funciona**: Abre http://localhost:5555 en otra tab (si ejecutaste `npm run -w backend prisma:studio`)

---

## 🛠️ Problemas Comunes

### "ERROR: can't connect to database"
- ✅ Asegúrate de que PostgreSQL esté corriendo
- ✅ Verifica el `DATABASE_URL` en `backend/.env`
- ✅ Si usas Docker: `docker ps` debe mostrar `lamberpool_postgres`

### "PORT 3001 already in use"
```bash
# Cambia el puerto en backend/.env
PORT=3002
```
Luego actualiza `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

### Frontend no muestra datos
- Revisa la consola (F12 DevTools)
- Verifica que backend esté corriendo: http://localhost:3001/api/health
- Revisa `NEXT_PUBLIC_API_URL` en `frontend/.env.local`

### "Cannot find module '@prisma/client'"
```bash
npm run -w backend prisma:generate
```

---

## 📚 Comandos Útiles

```bash
# Desarrollo (ambos frontend y backend)
npm run dev

# Solo backend
npm run backend:dev

# Solo frontend  
npm run frontend:dev

# Ver base de datos visualmente
npm run -w backend prisma:studio

# Crear nueva migración después de editar schema
npm run -w backend prisma:migrate

# Resetear BD completamente (CUIDADO: borra datos)
# npm run -w backend prisma:migrate reset
```

---

## 🎯 Próximos Pasos en Desarrollo

Una vez que todo funcione, puedes:

1. **Implementar Panel Admin**: Crear formularios para partidos y valoraciones
2. **Upload de Fotos**: Integrar Cloudinary
3. **Autenticación**: Agregar login para admin
4. **UI Mejorada**: Gráficos, galerías, estadísticas

---

## 💡 Tips

- **Prisma Studio** es tu mejor amigo para depurar BD: `npm run -w backend prisma:studio`
- Los logs del backend están en la terminal donde corre `npm run backend:dev`
- El seeding crea 1 partido de ejemplo con 3 jueces que calificaron
- La app es **completamente funcional** pero el panel admin aún está en desarrollo

---

## ❓ Necesitas Ayuda?

1. Revisa los logs en la terminal
2. Abre DevTools (F12) en el navegador
3. Verifica que PostgreSQL esté corriendo
4. Lee el [README.md](../README.md) para más detalles

¡Buena suerte! ⚽

---

**Documento creado: 23 Feb 2025**
