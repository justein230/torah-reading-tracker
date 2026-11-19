---
title: Docker setup
---

Use Docker Compose to run Torah Reading Tracker with its built-in administrator login. Anyone who can reach the site can view readings. Changing readings and exporting or importing the database require a login.

## Start the tracker

1. Get [`docker-compose.yml` and `docker-compose.override.yml.example`](https://github.com/justein230/torah-reading-tracker) from the repository and put them in the same directory.
2. Copy the override and uncomment its `ports` mapping. The example binds the app to `127.0.0.1:3000` on the Docker host.

   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```

3. Pull and start the service. By default, Compose stores the database in a named volume mounted at `/data`. Keep that volume when replacing or updating the container.

   ```bash
   docker compose pull
   docker compose up -d
   docker compose logs torah
   ```

4. Find the generated administrator password in the logs. On the Docker host, open `http://localhost:3000`. For access from other devices, put the app behind an HTTPS reverse proxy. Open **Settings**, log in, and use **Change password**.

See [Configuration](configuration.md) to change the port or supply a password before first startup. If you already have a proxy that authenticates users, see [Authentication proxy](docker-proxy.md).

## Update the app

[Back up your readings](../data/backup.md) before updating. Pull the image and apply the update from the same Compose directory.

```bash
docker compose pull
docker compose up -d
```

Open the app and confirm your readings and login still work. An older image cannot open a database with a newer schema. If you need to roll back after a schema change, stop the service and [copy the pre-update backup into place](../data/restore.md#recover-a-docker-database-file). Set the previous image tag in your Compose override, then run `docker compose up -d` in place of the recovery guide's start command.
