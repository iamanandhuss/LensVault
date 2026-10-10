# Deployment configuration

## Backend

Configure these environment variables in the backend host:

- `MONGODB_URI`: production MongoDB connection string.
- `JWT_SECRET`: unique random secret with at least 32 characters.
- `FRONTEND_URL`: exact deployed frontend origin (for example `https://studio.example.com`; comma-separated origins are supported).
- `PORT`: supplied by the hosting platform when available.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: required for Google Drive OAuth.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: required for profile and logo uploads.

The server waits for MongoDB before listening, and `/health` returns `503` until the database connection is ready. The backend example file intentionally leaves secrets blank.

## Frontend

Set `VITE_API_URL` to the public HTTPS backend origin in the frontend hosting provider before building. It must be an origin such as `https://api.example.com`, without a trailing slash. Production code never falls back to `localhost`.

## Features requiring follow-up

Paid subscription checkout and password reset are not implemented. Plan upgrades are rejected by the API and disabled in the interface. Configure a payment provider and a verified webhook flow before offering paid plans. Add a password recovery provider and token workflow before enabling password reset.
