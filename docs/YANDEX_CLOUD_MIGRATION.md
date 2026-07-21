# Motrix migration to Yandex Cloud

## Stage strategy

The first Yandex Cloud deployment uses one Serverless Container that serves:

- the built Vite frontend from `dist`;
- all current `/api/*.js` handlers;
- `/healthz`.

This keeps Vercel production untouched while the Yandex stage environment is tested.

Later stages split the system into:

- Object Storage + CDN for frontend;
- Serverless Container for API;
- Managed PostgreSQL;
- private Object Storage for documents;
- Lockbox for provider credentials;
- an integration gateway with a static outbound IP for providers that require IP allowlisting.

## Local runtime test

```bash
npm ci
npm run build
PORT=8080 npm start
```

Health check:

```bash
curl -fsS http://127.0.0.1:8080/healthz
```

## Container requirements

Yandex Serverless Containers supplies the `PORT` environment variable.
The server listens on `0.0.0.0` and uses `PORT`, defaulting to `8080`.

Secrets must not be baked into the Docker image.
