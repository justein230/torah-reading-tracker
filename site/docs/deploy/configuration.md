---
title: Configuration
---

Set environment values in `.env` in your Compose directory. Use `docker-compose.override.yml` for port mappings, storage, and networks. The default Docker setup works with an empty or absent `.env`.

| Variable | Default in Docker | When to set it |
|---|---|---|
| `PORT` | `3000` | Change the port the app listens on inside the container. |
| `TORAH_HOST_PORT` | `3000` | Change the host port published by the example port mapping. |
| `TORAH_HOST` | `0.0.0.0` | Keep the Docker default for access from the host or proxy. The development value `127.0.0.1` binds to the container's own loopback interface. |
| `NODE_ENV` | `production` | Keep production mode for secure session cookies. Use HTTPS when accessing the app remotely. |
| `TORAH_AUTH_MODE` | `password` | Use `header` with an [authentication proxy](docker-proxy.md). |
| `TORAH_ADMIN_PASSWORD` | Generated on first start in password mode | Set a custom initial password before starting with a new database. After the first successful start, remove the value from `.env` and run `docker compose up -d` again. |
| `TORAH_AUTH_HEADER` | `X-Torah-Authenticated` with the proxy override | Match the header your authentication proxy sets. |
| `TORAH_REQUIRE_PROXY_HEADER` | `true` in production and in the proxy override | Keep `true` in header mode to enable header-based writes. |
| `TORAH_TRUST_PROXY` | Off in the base setup | Set trusted hops or subnets if the app should use forwarded client IPs for rate limiting. The proxy override supplies a subnet list. |

Docker stores the database at `/data/torah.db`. To change where it's stored on the host, mount your directory at `/data` in the override.
