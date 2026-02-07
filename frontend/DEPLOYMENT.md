Deployment recommendations for the frontend

Summary
-------
This project serves pre-built static assets from a simple webserver (nginx recommended).

Common pitfall
--------------
Some deployment platforms attempt to run Node/npm commands (for example `npx serve` or `npm start`) at container start. If the runtime image is an nginx-based image (no Node installed), that will fail with errors such as "The executable `npx` could not be found."

Safe approach
-------------
- Build the assets at image build time (use a Node-based build stage).
- Use an nginx runtime image with the built `dist/` copied into `/usr/share/nginx/html`.
- Ensure the platform's start command does not invoke `npm`/`npx` at runtime. If your platform uses a `Procfile`, include `web: nginx -g 'daemon off;'` (this repo includes one).

Example Docker build (recommended)
---------------------------------
Build locally with a concrete backend URL baked in:

```bash
docker build -f frontend/Dockerfile --build-arg VITE_API_URL="http://backend:4000/api" -t carp-king-frontend:latest frontend/
```

Notes
-----
- If your deployment platform injects a start command (for example through UI settings), make sure it uses the nginx command or leave it empty so the image default CMD runs.
- Alternatively, if you need node at runtime (not recommended for static sites), use a Node runtime image instead of nginx.
