# project_ismt_cloud_website

## ISMT Cloud Website

A cloud-computing coursework website for ISMT College with a public site, course/application pages, an admin dashboard, and a Node.js/Express backend using Node's built-in SQLite.

- Original location: `D:\Computers Files\work\ismt\sakxyam\cloud\ismt-website`
- Working copy: `D:\PROJECTS_READY\project_ismt_cloud_website`
- Stack: Node.js 22+, Express 4, `node:sqlite`, HTML/CSS/JavaScript

## Folder layout

```text
project_ismt_cloud_website/
  frontend/   Public pages, admin page, CSS, JavaScript
  backend/    Express API, SQLite database, package files
  database/   Database notes
  docs/       Project documentation
```

## Setup and run

```powershell
cd backend
npm ci
node server.js
```

The server runs on port `3000` by default (set `PORT` to override, for example `$env:PORT=3005`) and serves the project root.

Open:

- Public site: <http://localhost:3000/frontend/index.html>
- Admin page: <http://localhost:3000/frontend/admin.html>
- Health check: <http://localhost:3000/health>

Demo admin: `admin` / `ismt2026`.

## Verified status (2026-11-09)

- [x] `npm ci` completed
- [x] Restored missing `frontend/admin.js` with login, stats, student CRUD, courses, and applications UI
- [x] Connected the public application form to `/api/applications` with field names/IDs and course IDs
- [x] Backend served `/frontend/index.html`, `/frontend/admin.html`, `/frontend/admin.js`, `/frontend/script.js`, and `/frontend/styles.css` with HTTP 200
- [x] `/api/courses` returned HTTP 200
- [x] Admin login with `admin` / `ismt2026` worked
- [x] `/api/students`, `/api/stats`, and `/api/applications` returned HTTP 200 with a token
- [x] Student CRUD verified and cleaned up
- [x] A test application was inserted (`verify.test@example.com`, id `1`); remove it if no longer useful

## Notes and limitations

- Uses Node's built-in `node:sqlite`, so Node 22+ is required.
- The admin password is a coursework demo value; replace it and use real password hashing/sessions before deployment.
- The SQLite database `backend/ismt.db` is local runtime data and is ignored by Git.
- The Express dependency tree may report audit warnings; review before production use.

## Troubleshooting

- **`node:sqlite` not found**: upgrade Node.js to 22 or newer.
- **Port 3000 in use**: set `PORT=3006` before starting.
- **Admin login fails**: confirm `admin` / `ismt2026` or inspect the seeded `admins` table.
- **Application form does nothing**: confirm `/api/applications` is reachable and the course IDs in the form match `/api/courses`.
