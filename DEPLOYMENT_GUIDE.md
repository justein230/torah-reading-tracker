# Torah Tracker — Deployment Guide

Torah Tracker can be deployed in two ways:

1. **App-managed authentication** — Torah Tracker presents its own password
   login and decides who can make changes.
2. **Proxy-managed authentication** — an existing identity-aware reverse proxy
   or access gateway authenticates users before requests reach Torah Tracker.

Both options run the same application and store the same data. The choice is
about **where authentication should live**, not how the application is built.

## Choose a deployment model

| Choose | Best when | Avoid when |
|---|---|---|
| **App-managed authentication** | You want the simplest self-contained deployment, have one shared administrator password, or do not already operate SSO | Your organization requires centralized identities, access policies, or user offboarding |
| **Proxy-managed authentication** | You already use an access gateway such as Authelia, oauth2-proxy, Cloudflare Access, Tailscale Serve, Traefik, or Caddy with external authentication | You cannot guarantee that every path to the app goes through the trusted proxy |

**Use app-managed authentication by default.** It has fewer infrastructure
assumptions and is the safer choice for a small or standalone deployment.

Use proxy-managed authentication when it integrates Torah Tracker into an
authentication system you already trust and operate. Do not introduce a proxy
authentication stack solely for this application unless you need the policies
or centralized access it provides.

> The proxy-managed option is safe only when the application cannot be reached
> around the proxy and the proxy removes any client-supplied authentication
> header before setting its own.

## Before you deploy

For either model, prepare:

- A host with Docker and Docker Compose
- A DNS name and HTTPS endpoint for production use
- Persistent storage for `/data`, which contains the SQLite database
- A backup plan for that persistent data

The published image is
`ghcr.io/justein230/torah-reading-tracker:latest`. The examples in this
repository keep environment values in `.env` and deployment-specific Compose
changes in `docker-compose.override.yml`. Neither file is committed.

## Where deployment settings go

Docker Compose automatically reads a file named `.env` from the project
directory and passes the application values referenced by `docker-compose.yml`
into the container. Use `.env` for values such as ports and authentication
settings. Use `docker-compose.override.yml` for changes to the deployment
itself, such as enabling a port mapping, choosing storage, joining a proxy
network, or using a different image.

Use `.env.example` as a reference; a production deployment only needs to
include values it changes from the defaults. Do not copy its development host
value unchanged for Docker: omit `TORAH_HOST` or set it to `0.0.0.0` so the
proxy or published port can reach the application inside the container.

| Setting | Configure it in |
|---|---|
| Production or development mode (`NODE_ENV`) | `.env` |
| Application and host port numbers (`PORT`, `TORAH_HOST_PORT`) | `.env` |
| Container bind address (`TORAH_HOST`) | `.env`; omit it to use Docker's `0.0.0.0` default |
| Authentication values (`TORAH_AUTH_MODE`, `TORAH_AUTH_HEADER`, `TORAH_REQUIRE_PROXY_HEADER`) | `.env`; the proxy override supplies safe header-mode defaults |
| Optional initial password (`TORAH_ADMIN_PASSWORD`) | `.env`, before the first start only |
| Enable a published port, select persistent storage, join a proxy network, or change the image | `docker-compose.override.yml` |
| Database path inside the container | Fixed at `/data/torah.db`; do not set it in `.env` for Docker |

The default app-managed deployment does not require any authentication settings
in `.env`: Compose defaults to production and password authentication, and the
application generates the initial password. The proxy override already sets the
three values needed for proxy-managed authentication; edit the header name there
or set `TORAH_AUTH_HEADER` in `.env` if your proxy uses a different one.

> `TORAH_DB_PATH` is the exception: Docker deliberately ignores that value from
> `.env` because the database must remain on the persistent `/data` volume.

## Option 1: App-managed authentication

Choose this option when Torah Tracker should own the login experience.

### Deploy

1. Create the deployment override:

   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

2. Edit the override for your host. Publish port `3000` only on a private or
   loopback interface, and optionally replace the named Docker volume with a
   host directory that is included in your backups. No authentication entries
   are needed in `.env` for the default setup. If you change the published port,
   set `TORAH_HOST_PORT` in `.env` and use the variable-based port mapping shown
   in the override example.

3. Pull and start the application:

   ```bash
   docker compose pull
   docker compose up -d
   ```

4. Retrieve the automatically generated initial password from the logs:

   ```bash
   docker compose logs torah
   ```

   The password is generated only when no administrator password exists yet.
   Save it temporarily so you can complete the first login.

5. Put the application behind HTTPS and open it in a browser. Log in from the
   Settings drawer, change the generated password, and confirm that you can add
   or update a reading.

### Optional: Set the initial password yourself

Automatic generation is the recommended default. If an unattended deployment
needs a predetermined initial password, configure it **before the first start**.
Set a long, unique value in `.env`:

```dotenv
TORAH_ADMIN_PASSWORD=replace-with-a-long-random-password
```

Compose passes this value into the container automatically. Start the
application normally. After the first successful start, remove the value from
`.env`, then apply the configuration again:

```bash
docker compose up -d
```

The password has already been stored securely in the database; the plaintext
value should not remain in deployment configuration.

### What to expect

- Anyone may view the tracker.
- Only a user with a valid app login may make changes.
- Authentication is managed inside Torah Tracker rather than by the reverse
  proxy.

On a new deployment, the application generates the initial password and prints
it to the container logs. It is not regenerated on ordinary restarts.

## Option 2: Proxy-managed authentication

Choose this option when an existing trusted proxy or access gateway should own
authentication.

### Deploy

1. Create the proxy-oriented deployment override:

   ```bash
   cp docker-compose.override.yml.header-example docker-compose.override.yml
   ```

2. Configure the override with the authentication header emitted by your
   proxy. Keep `TORAH_AUTH_MODE=header` and
   `TORAH_REQUIRE_PROXY_HEADER=true` enabled. These settings are already present
   as defaults in `docker-compose.override.yml.header-example`. If your proxy
   uses a different header, set it in `.env`:

   ```dotenv
   TORAH_AUTH_HEADER=X-Forwarded-User
   ```

3. Connect Torah Tracker to the proxy's private network. Do not publish the app
   directly to the internet, and do not provide another route that bypasses the
   authenticating proxy.

4. Configure the proxy to:

   - authenticate the user;
   - discard any authentication header supplied by the client;
   - set the trusted authentication header only after successful login; and
   - forward the request to Torah Tracker over the private network.

5. Pull and start the application:

   ```bash
   docker compose pull
   docker compose up -d
   ```

6. Verify all three access paths before considering the deployment complete:

   - an authenticated request can make a change;
   - an unauthenticated request cannot make a change; and
   - a request with a forged authentication header cannot bypass the proxy.

### What to expect

- Torah Tracker does not present its own login.
- The proxy or access gateway controls who may make changes.
- Access policies, identity lifecycle, and sign-in behavior are managed in the
  upstream authentication system.

The repository includes `Caddyfile.header-auth-test` and a Compose
`header-auth` profile for validating this model locally. They are test aids,
not a production proxy configuration.

## Production checklist

Before handing either deployment over to users, confirm that:

- the site is served over HTTPS;
- `/data` persists across container replacement;
- database backups are running and have been tested;
- the application port is not unintentionally public;
- an unauthenticated user cannot add, edit, or delete readings; and
- your chosen authentication path works after a container restart.

## Updates

Back up the data volume, then pull and restart the application:

```bash
docker compose pull
docker compose up -d
```

After an update, repeat the authentication checks for your chosen deployment
model and confirm that existing data is still present.
