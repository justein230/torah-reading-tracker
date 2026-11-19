---
title: Restore your readings
---

## Import a backup file

Importing replaces all readings with the contents of the backup. The app saves a copy of your current data before replacing it.

1. Open **Settings** and log in if prompted.
2. Select **Import DB (.sqlite)** and choose your database backup.
3. Select **Import and replace**.

Import keeps your current app login. If the backup requires a newer database version, update the app and try again.

On Android, you can also restore an automatic backup from **Settings → Backups → Restore**. Confirm with **Restore and replace**.

## Recover a desktop database file

If the app won't open, quit it fully and make a copy of the existing `torah.db`. Replace that file with your backup, named `torah.db`, then reopen the app.

| Platform | Default database folder |
|---|---|
| Windows | `%APPDATA%\Torah Reading Tracker` |
| macOS | `~/Library/Application Support/Torah Reading Tracker` |
| Linux | `~/.config/Torah Reading Tracker` |

## Recover a Docker database file

If you can't use the in-app import, [copy the existing database](backup.md#copy-the-database-directly) before replacing it. In password mode, replacing the file also restores the administrator password stored in that file.

Run these commands from your Compose directory, using the path to the backup you want to restore.

```bash
docker compose stop torah
docker compose cp ./torah-backup.db torah:/data/torah.db
docker compose start torah
```

If you use a bind mount for `/data`, replace `torah.db` in the host directory while the service is stopped.
