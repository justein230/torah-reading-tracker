---
title: Back up your readings
---

## Export a backup

1. Open **Settings** and log in if prompted.
2. Select **Export DB (.sqlite)**. Name the file, then save or share it. On Android, you can save it to `Documents/Torah Tracker`.
3. Keep a copy somewhere outside the device or server that runs the app.

Use the database file to [restore your readings](restore.md). Excel exports are for viewing or sharing and cannot be imported.

## Find automatic backups

The app saves a copy before importing a database or changing its structure during an upgrade. These copies are stored alongside the app's data.

- **Android.** Open **Settings → Backups** to view or export a copy.
- **Desktop.** Open **Settings → Open backups folder**. Upgrade backups sit beside `torah.db`. Pre-import copies are in the `backups` subfolder.
- **Docker.** Upgrade backups are in `/data`. Pre-import copies are in `/data/backups`.

## Copy the database directly

On desktop, open the backups folder, fully quit the app, and copy `torah.db` to a safe location. If the app won't open, see [desktop file recovery](restore.md#recover-a-desktop-database-file) for the default folder locations.

For Docker, run these commands from your Compose directory. If you use a bind mount for `/data`, you can copy `torah.db` from the host directory while the service is stopped.

```bash
docker compose stop torah
docker compose cp torah:/data/torah.db "./torah-$(date +%F-%H%M%S).db"
docker compose start torah
```
