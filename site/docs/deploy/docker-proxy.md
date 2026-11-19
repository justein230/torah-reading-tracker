---
title: Authentication proxy
---

Use this setup when a reverse proxy or access gateway already handles sign-in. In header mode, Torah Reading Tracker grants write access when the configured identity header is present.

1. Put [`docker-compose.yml` and `docker-compose.override.yml.header-example`](https://github.com/justein230/torah-reading-tracker) in the same directory. Copy the proxy override.

   ```bash
   cp docker-compose.override.yml.header-example docker-compose.override.yml
   ```

2. Connect the app and proxy to the same private Docker network. Keep the app's port unpublished and ensure all access goes through the proxy.
3. Configure the proxy to discard any client-supplied identity header, authenticate the user, and then set the trusted header before forwarding the request. The override defaults to `TORAH_AUTH_MODE=header`, `TORAH_REQUIRE_PROXY_HEADER=true`, and the header `X-Torah-Authenticated`. Keep those authentication settings when reusing an existing `.env` file. Set `TORAH_AUTH_HEADER` if your proxy uses a different header name.
4. Pull the image and start the service.

   ```bash
   docker compose pull
   docker compose up -d
   ```

Confirm that signed-in users can save a reading and that signed-out requests are denied even if they include the identity header. See [Configuration](configuration.md) for the proxy settings and [Docker setup](docker-password.md#update-the-app) for updates.
