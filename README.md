# Carp King Team Workspace (TypeScript/React)

## Getting Started

### Backend (Node.js/Express)
1. Open a terminal and navigate to the backend folder:
   cd backend
2. Install dependencies:
   npm install
3. Build the backend:
   npm run build
4. Start the backend server:
   npm run dev
   - Runs on http://localhost:4000

### Frontend (React + Vite)
1. Open a new terminal and navigate to the frontend folder:
   cd frontend
2. Install dependencies:
   npm install
3. Build the frontend:
   npm run build
4. Start the frontend dev server:
   npm run start
   - Runs on http://localhost:3000

## Frontend Docker build (production)

When building the frontend Docker image you must provide `VITE_API_URL` at build time so the compiled assets call the correct backend (the dev proxy does not apply to production builds).

Example build command:

```bash
docker build -f frontend/Dockerfile --build-arg VITE_API_URL="http://backend:4000/api" -t carp-king-frontend:latest frontend/
```

This sets the `VITE_API_URL` environment variable during the build so Vite compiles the correct API base URL into the production bundle.

## Features
- Planner, slot threads, team chat, meetings, admin/editor roles
- Image upload with size enforcement (to be implemented)
- A/B timing, Facebook integration (to be implemented)

## Project Structure
- backend/: Node.js/Express API (TypeScript)
- frontend/: React app (TypeScript/TSX, CSS)

## Development Notes
- API endpoints: see backend/src/routes.ts
- UI components: see frontend/src/components/
- Update .env files as needed for configuration

## Railway Deployment Notes
- If a build fails with `npm: not found`, ensure Railway uses Nixpacks.
- Keep `nixpacks.toml` at the repo root so Railway installs Node and runs the backend from `backend/`.

---
For more details, see the code and comments in each folder.
