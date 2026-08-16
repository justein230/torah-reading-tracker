# Deployment

Torah Tracker is a Node/Express API (`server.ts`, default port `3000`) plus a
static frontend built to `dist/` (`npm run build`). Run it behind any reverse
proxy that serves the static build and forwards `/api/*` to the Node process.

Write access is gated by the app's own auth (`TORAH_AUTH_MODE`, see
`.env.example` and the README's [Write-access auth](README.md#write-access-auth)
section). Any IP-based restriction (e.g. LAN-only access) is the reverse proxy's
job, not the app's — the app has no IP allowlist of its own. A generic Caddy
example:

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
        reverse_proxy localhost:3000
    }

    handle {
        root * /path/to/dist
        file_server
        try_files {path} /index.html
    }
}
```

Traefik users can achieve the same with the `ipallowlist` middleware on the
relevant router instead of a `@blockedWrite` matcher.

Replace `your-domain.example.com`, the allowed CIDRs, and `/path/to/dist` with
values for your own environment.
