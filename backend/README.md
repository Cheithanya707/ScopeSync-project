# ScopeSync API

This is a separate Express API. Firebase Authentication owns sign-in credentials; the API verifies Firebase ID tokens and stores ScopeSync profiles, workspaces, projects, collaboration records, and uploaded files in MongoDB.

## Local setup

1. Install MongoDB Community Server and start its local service. MongoDB Compass is a client and needs the database server running.
2. In Compass, connect to `mongodb://127.0.0.1:27017`. The API creates the `scopesync` database and collections when used.
3. Create a Firebase project. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**. Add `localhost` to Authorized domains.
4. Copy `.env.local.example` to `.env.local` in the repository root and replace the four `NEXT_PUBLIC_FIREBASE_*` values with the Firebase Web App configuration. Keep `NEXT_PUBLIC_API_URL=http://127.0.0.1:5000`.
5. Copy `backend/.env.example` to `backend/.env`. Set `FIREBASE_PROJECT_ID` to the same Firebase project ID. The default MongoDB URI is for the local, unauthenticated Community Server.
6. From the repository root run `npm run dev`. Next.js starts on port `3101`; the API starts on port `5000`. Use `npm run dev:frontend` only when you intentionally need the frontend without the API.
7. Open `http://localhost:3101`, sign up or use Google, then create a workspace. Browse `scopesync` in Compass to see persisted data.

The API verifies Firebase ID tokens against Google's published signing keys; no Firebase Admin service-account key is needed. Passwords remain managed by Firebase Authentication and are never stored in MongoDB. Email/password and Google sign-in both synchronize the verified Firebase UID and profile to MongoDB.

The local backend binds to `127.0.0.1` and only allows the configured `FRONTEND_ORIGIN`. Change these settings deliberately before exposing the service to a network. Uploaded files are limited to 5 MB and stored as binary MongoDB documents, below MongoDB's 16 MB per-document limit.

## Checks

```powershell
npm run backend:build
npm run backend:test
```

`GET /api/health` reports whether MongoDB is reachable. If the API cannot start, confirm MongoDB Community Server is running and both environment files use the same Firebase project ID.
