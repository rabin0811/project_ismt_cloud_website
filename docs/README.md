# ISMT Cloud Website — Technical Notes

## Overview

A cloud-computing coursework website for ISMT College. It combines a public marketing site, a course-application form, and an admin dashboard with student CRUD, course data, applications, and statistics.

## Architecture

```text
Browser
  ├─ frontend/index.html       public site and application form
  ├─ frontend/admin.html       admin dashboard
  └─ Express API (server.js)
        ├─ node:sqlite database
        ├─ in-memory session tokens
        └─ static file serving from the project root
```

## Folder structure

```text
frontend/
  index.html, styles.css, script.js
  admin.html, admin.css, admin.js
backend/
  server.js       Express app and API
  database.js     SQLite setup and seed data
  package.json
database/         Database notes
```

## Setup

```powershell
cd backend
npm ci
node server.js
```

The server listens on `PORT` or `3000` by default.

```powershell
$env:PORT=3005
node server.js
```

## URLs

| URL | Purpose |
|---|---|
| `/frontend/index.html` | Public site |
| `/frontend/admin.html` | Admin dashboard |
| `/health` | Health check |
| `/api/courses` | Public course list |
| `/api/applications` | Submit an application (POST) |
| `/api/login` | Admin login |
| `/api/students` | Student CRUD (requires bearer token) |
| `/api/stats` | Dashboard statistics (requires bearer token) |

Demo admin: `admin` / `ismt2026`.

## Database

`backend/database.js` creates and seeds a local SQLite database using Node's built-in `node:sqlite` module. Node.js 22 or newer is required.

Tables include:

- `admins`
- `courses`
- `students`
- `applications`

## Verification evidence (2026-11-09)

| Check | Result |
|---|---|
| `npm ci` | Passed |
| Public and admin pages | HTTP 200 |
| `/api/courses` | HTTP 200 |
| Admin login | Passed |
| `/api/students`, `/api/stats`, `/api/applications` with token | HTTP 200 |
| Student create/update/delete | Passed and cleaned up |

A test application for `verify.test@example.com` remains in the local database; remove it if desired.

## Limitations

- The admin password is a coursework demo value and is stored in plain text.
- Sessions are in-memory and disappear when the server restarts.
- `node:sqlite` requires Node.js 22+.
- The SQLite database is local runtime data and is ignored by Git.
- This is not production-ready: add password hashing, persistent sessions, CSRF protection, and audit logging before deployment.
