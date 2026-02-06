# Copilot Instructions for Carp King Team Workspace

## Project Overview
- This is a team workspace for planning, uploading, and scheduling social media posts, with strict image size enforcement and team collaboration features.
- The backend (Node/Express + TypeScript) handles API routes, image uploads, and app logic.
- The frontend (React + Vite) provides the user interface for planners, admins, and editors.

## Architecture
- **backend/**: Node/Express API (TypeScript) with routes in `src/routes.ts`, uploads in `src/upload.ts`, and Facebook stub in `src/facebook.ts`.
- **frontend/**: React app (TypeScript/TSX) with UI components in `src/components/`.
- **uploads/**: Stores uploaded images.

## Developer Workflows
- **Start backend (Windows):** Run `run.bat`.
- **Start backend (Linux/macOS):** Run `./run.sh`.
- **Start frontend:** `cd frontend && npm install && npm run start`.

## Key Patterns & Conventions
- **Image uploads:** Enforced size (default 1080×1080). Uploads with incorrect size are blocked.
- **Slot-based scheduling:** Each slot can have threads/comments and strict image requirements.
- **Admin/editor roles:** Role handling is UI-driven in the current in-memory backend.
- **Meetings:** Agenda, notes, action items, and chat are managed in-app.
- **No AI in-app:** All AI/agent logic is external; do not add AI features to the app itself.

## Integration Points
- **API routes:** Managed in `backend/src/routes.ts`.
- **Uploads:** Managed in `backend/src/upload.ts`.
- **Facebook stub:** Managed in `backend/src/facebook.ts`.

## Examples
- To enforce image size, see `backend/src/upload.ts`.
- For meeting UI, see `frontend/src/components/Meeting*`.

## Special Notes
- Do not change image size enforcement logic without consulting admin requirements.
- Do not add AI or automation features to the app itself.
- Reference `README.md` for up-to-date workflow and admin instructions.

---
_Review and update these instructions as the project evolves. If unclear, ask the team for specifics on workflows or conventions._
