# Deployment

Torah Tracker is a Node/Express API (`server.ts`, default port `3000`) plus a
static frontend built to `dist/` (`npm run build`). Run it behind any reverse
proxy that serves the static build and forwards `/api/*` to the Node process.

Write endpoints are meant to be restricted to trusted clients. The application
enforces this via `TORAH_ALLOWED_IPS` (see `.env.example`); you can add a second
layer at the proxy. A generic Caddy example:

```caddyfile
http://your-domain.example.com {
    # Block writes/exports from untrusted networks (adjust CIDRs to your LAN)
    @blockedWrite {
        method POST PUT DELETE
        path /api/readings*
        not { remote_ip 10.0.0.0/8 127.0.0.0/8 }
    }
    respond @blockedWrite 403

    handle /api/* {
        reverse_proxy localhost:3000 {
            header_up X-Real-IP {remote_host}
        }
    }

    handle {
        root * /path/to/dist
        file_server
        try_files {path} /index.html
    }
}
```

Replace `your-domain.example.com`, the allowed CIDRs, and `/path/to/dist` with
values for your own environment.
