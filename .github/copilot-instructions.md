## Lamberpool FC - Instrucciones para Desarrollo

Este documento proporciona contexto para continuidad del desarrollo de Lamberpool FC.

### 🎯 Visión General

Aplicación full-stack para gestionar estadísticas de un equipo de fútbol 8:
- **Público**: Ver resultados, valoraciones y estadísticas
- **Admin**: Crear partidos, valoraciones de jueces, fotos
- **Valoración**: Sistema de 5 jueces (Pato, Chicho, Cape, Stefa, Roña) con promedios automáticos

### 🏗️ Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Backend**: Node.js + Express + TypeScript
- **BD**: PostgreSQL + Prisma ORM
- **Fotos**: Cloudinary (opcional)

### 📁 Estructura Clave

```
backend/
  ├── src/
  │   ├── index.ts          # Entrada principal con todas las rutas
  │   ├── lib/prisma.ts    # Cliente de Prisma
  │   └── routes/          # Endpoints (judges, players, matches, etc)
  ├── prisma/
  │   ├── schema.prisma    # Modelo de datos
  │   └── seed.ts          # Datos iniciales
  └── package.json

frontend/
  ├── app/
  │   ├── layout.tsx       # Layout principal
  │   ├── page.tsx         # Página inicio
  │   ├── matches/         # Resultados públicos
  │   ├── players/         # Plantilla públic
  │   └── admin/           # Panel admin (WIP)
  ├── components/          # Componentes reutilizables
  ├── lib/api.ts           # Cliente API
  └── package.json
```

### 🚀 Próximo Paso Recomendado

1. **Instalar dependencias**:
   ```
   npm install
   ```

2. **Iniciar PostgreSQL** (si no está corriendo):
   ```
   docker-compose up -d
   ```

3. **Migrar y seedear BD**:
   ```
   npm run -w backend prisma:migrate
   npm run -w backend seed
   ```

4. **Iniciar desarrollo**:
   ```
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

### 🔑 Endpoints API Principales

```
GET    /api/teams                  # Obtener equipo
GET    /api/matches               # Listar partidos
GET    /api/matches/:id           # Detalle de partido
POST   /api/matches               # Crear partido (admin)

GET    /api/players               # Listar jugadores
POST   /api/players               # Agregar jugador (admin)

GET    /api/judges                # Listar jueces
GET    /api/tournaments           # Listar torneos
GET    /api/tournaments/active    # Torneo activo

POST   /api/ratings               # Agregar valoración (admin)
POST   /api/match-players         # Agregar jugador a partido (admin)
POST   /api/photos                # Subir foto (admin)
```

### 📊 Modelo de Datos

- **Team**: Lamberpool FC (único equipo)
- **Players**: Plantilla del equipo (8 jugadores)
- **Judges**: 5 jueces fijos (Pato, Chicho, Cape, Stefa, Roña)
- **Tournaments**: Diferentes ligas (Liga Nuñez activa)
- **Matches**: Partidos jugados
- **MatchPlayers**: Relación jugador-partido con stats (goles, tarjetas, posición)
- **Ratings**: Valoraciones de jueces (1-10, puede tener .5)
- **Photos**: Fotos del partido

### 🎨 Features por Completar

**Admin Panel (en /admin)**:
- [ ] Crear partidos
- [ ] Registrar estadísticas (goles, tarjetas)
- [ ] Agregar valoraciones de jueces
- [ ] Subir fotos
- [ ] Cambiar torneo activo

**Mejoras de UI**:
- [ ] Galería de fotos
- [ ] Gráficos de estadísticas
- [ ] Página de detalle de partido
- [ ] Página de jugador individual

**Backend**:
- [ ] Autenticación (JWT)
- [ ] Upload de fotos a Cloudinary
- [ ] Validación más robusta

### 💾 Variables de Entorno

**Backend (.env)**:
```
DATABASE_URL=postgresql://lamberpool_user:lambda123@localhost:5432/lamberpool
PORT=3001
NODE_ENV=development
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 🐛 Debugging

- **Ver BD visual**: `npm run -w backend prisma:studio`
- **Revisar logs backend**: Revisa console de terminal donde corre Node
- **DevTools frontend**: Abre http://localhost:3000 y abre DevTools

### 📚 Recursos Útiles

- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Última actualización**: 23 Feb 2025
