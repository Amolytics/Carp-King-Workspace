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

## CI: GHCR secrets

- The workflow publishes the frontend image to GitHub Container Registry (`ghcr.io`). Org policies can block the default `GITHUB_TOKEN` from writing packages. To ensure CI can push images, create a Personal Access Token (PAT) with the following scopes:
   - `write:packages` (required)
   - `repo` (only if publishing from private repos)

- Add these repository secrets in the repo settings:
   - `REGISTRY_USERNAME` — the GitHub username that owns the PAT
   - `REGISTRY_PAT` — the PAT value (keep this secret)

- The CI workflow uses these secrets to log in to `ghcr.io` and push the built image. Alternatively, you can enable Actions package publishing in the organization settings to allow `GITHUB_TOKEN` to write packages.

### Alternate secret name

If you already created a single secret named `Amolytics` containing the PAT, the CI workflow accepts that as a fallback (it will use that secret as the PAT). Preferred setup is still the pair of secrets `REGISTRY_USERNAME` and `REGISTRY_PAT`.

