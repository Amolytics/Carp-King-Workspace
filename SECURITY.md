# Security Notes

## Overview
This project currently runs a simple Node/Express backend with in-memory data. It is not designed for production or untrusted networks.

## Current State
- No persistent database
- No secure authentication or session management
- No audit logging or rate limiting
- Upload validation only checks image dimensions

## Recommendations (If Deploying)
1. Add a real authentication system with hashed passwords and sessions or JWTs.
2. Store users and data in a database instead of memory.
3. Add rate limiting and request logging for sensitive endpoints.
4. Restrict CORS and protect admin actions with authorization checks.
5. Store secrets in a secure secret manager or .env (not committed).
6. Add HTTPS and secure cookie settings.

## Scope
These notes reflect the current Node/Express implementation. If the backend changes, update this file accordingly.
