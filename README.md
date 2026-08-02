# Village Setu / Cybercafe Database Management System

A production-ready, **online-only** web application for managing village residents, families, government schemes, applications, documents, and audit logs. Built with **FastAPI + SQLAlchemy + Cloud MySQL** on the backend and **HTML5 + Tailwind CSS + Vanilla JS** on the frontend, deployable to **Vercel** directly from GitHub.

> ⚠️ This project is **strictly online**. There is no offline mode, no local SQLite, no desktop app, and no sync agent. All data lives in a cloud MySQL database.

---

## ✨ Features

| Module | Highlights |
| --- | --- |
| **Authentication** | JWT-based, bcrypt password hashing, session revocation, role-based access (admin / operator) |
| **Dashboard** | Stat cards (residents, families, documents, schemes, applications), recent activity, global search with auto-suggest, dark / light theme |
| **Residents** | Full CRUD with 27+ fields, Aadhaar encryption-at-rest, masked display, admin-only reveal, paginated search, filters, sorting, CSV export, print profile |
| **Families** | Group residents into family units, head-of-family flag, family tree view, member linkage |
| **Document Vault** | Upload PDF / JPG / PNG, preview inline, replace with version history, download, delete, type-tagged (Aadhaar, PAN, Income Cert, etc.) |
| **Government Schemes** | CRUD with eligibility criteria (age, gender, category, income, required docs, deadline) |
| **Smart Eligibility Engine** | Auto-evaluates every active scheme for a resident → `eligible` / `possibly_eligible` / `not_eligible` with human-readable reasons |
| **Applications** | Track scheme applications, status transitions (applied → pending → processing → approved / rejected), full timeline |
| **Audit Logs** | Every action recorded with user, timestamp, IP, user-agent; admins see all, operators see their own |
| **Reports** | CSV exports for residents, families, schemes, applications (filtered by status), ward & village aggregates |
| **Security** | JWT, bcrypt, SQLAlchemy ORM (SQL-injection-safe), security headers, Aadhaar Fernet encryption, input validation (Aadhaar / PAN / mobile / email / PIN / DOB) |
| **UX** | Copy-to-clipboard on every important field, print support, toast notifications, loading skeletons, fully responsive (mobile / tablet / desktop) |

---

## 🧱 Tech Stack

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.x, Pydantic v2, PyJWT, bcrypt, cryptography (Fernet), psycopg2
- **Frontend:** HTML5, Tailwind CSS (via CDN), vanilla JavaScript (no build step)
- **Database:** Cloud PostgreSQL (Aiven / Neon / Supabase / Railway)
- **Deployment:** GitHub → Vercel (one-click)

---

## 📁 Folder Structure

```
Village-Setu/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI entry point + static frontend serving
│   ├── database.py          # Engine, session, init_db(), seed_admin()
│   ├── models.py            # SQLAlchemy ORM models
│   ├── auth.py              # JWT, bcrypt, role dependencies
│   ├── config.py            # Settings (env-driven)
│   ├── routers/             # API endpoints (auth, users, residents, ...)
│   ├── services/            # Business logic (eligibility engine)
│   ├── schemas/             # Pydantic request/response schemas
│   ├── utils/               # validation, crypto, audit, helpers
│   └── requirements.txt
├── frontend/
│   ├── index.html           # auth redirect
│   ├── login.html
│   ├── dashboard.html
│   ├── residents.html
│   ├── families.html
│   ├── documents.html
│   ├── schemes.html
│   ├── applications.html
│   ├── audit.html
│   ├── reports.html
│   ├── users.html
│   ├── css/app.css
│   └── js/
│       ├── api.js           # fetch wrapper, token storage
│       ├── ui.js            # sidebar, toast, copy, modal, theme, print
│       └── pages/           # one JS file per HTML page
├── uploads/                 # local dev only (Vercel uses DB storage)
├── .env.example
├── .gitignore
├── vercel.json
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone & install

```bash
git clone https://github.com/deore14567/Project_K.git
cd Project_K
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
```

Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Generate a Fernet key for Aadhaar encryption:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Run the API

```bash
uvicorn backend.main:app --reload --port 8000
```

Open <http://localhost:8000> → you'll be redirected to the login page.

Default admin (from `.env`):
- Email: `admin@villagesetu.gov.in`
- Password: `Admin@12345`

API docs: <http://localhost:8000/api/docs>

---

## ☁️ Cloud Database Setup

Pick **one** of the following PostgreSQL cloud providers. **Aiven for PostgreSQL** is what we tested with — the free tier works great with Vercel.

### Option A — Aiven for PostgreSQL (recommended — already set up)

1. Sign in at <https://console.aiven.io/>.
2. Open your service (e.g. `pg-18bebb6d-...`).
3. Go to the **Overview** tab → click **psql** to reveal the connection string. It looks like:
   ```
   postgres://avnadmin:<password>@pg-18bebb6d-andimandisandi14567-1615.h.aivencloud.com:27478/defaultdb?sslmode=require
   ```
4. **Convert the scheme** from `postgres://` to `postgresql+psycopg2://` so SQLAlchemy uses the right driver. Final value for `DATABASE_URL`:
   ```
   postgresql+psycopg2://avnadmin:<password>@pg-18bebb6d-andimandisandi14567-1615.h.aivencloud.com:27478/defaultdb?sslmode=require
   ```
5. Set this as the `DATABASE_URL` environment variable (in `.env` locally, or in Vercel project settings).

> Aiven requires TLS — `sslmode=require` in the query string handles that. No CA cert download needed.

### Option B — Neon Postgres

1. Sign up at <https://neon.tech>.
2. Create a project → copy the connection string.
3. Prefix it with `postgresql+psycopg2://` instead of `postgres://`.
4. Use it as `DATABASE_URL`.

### Option C — Supabase Postgres

1. Sign up at <https://supabase.com>.
2. Create a project → Project Settings → Database → Connection string (URI).
3. Prefix it with `postgresql+psycopg2://`.

### Option D — Railway Postgres

1. Sign up at <https://railway.app>.
2. New project → Provision PostgreSQL.
3. Use the `DATABASE_PUBLIC_URL` (or compose one from the individual vars). Prefix with `postgresql+psycopg2://`.

---

## 🌐 Deploy to Vercel

### One-click from GitHub

1. Push this repo to GitHub (already at `https://github.com/deore14567/Project_K`).
2. Go to <https://vercel.com/new>.
3. Import the `Project_K` repository.
4. Vercel auto-detects the Python runtime from `vercel.json` — keep defaults.
5. **Add all environment variables** from `.env.example` in the Vercel project settings:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ENCRYPTION_KEY`
   - `CORS_ORIGINS` (set to your Vercel domain, or `*`)
6. Click **Deploy**. Vercel installs deps from `requirements.txt`, builds, and serves `backend/main.py` as a serverless function.
7. On first cold-start, `init_db()` creates all tables and seeds the admin user.

The frontend HTML/CSS/JS files are served from the same FastAPI app (see `routes` in `vercel.json`).

---

## 🔐 Security Notes

- **Never commit `.env`** — it's in `.gitignore`.
- **Rotate `JWT_SECRET` and `ENCRYPTION_KEY`** periodically. Rotating `ENCRYPTION_KEY` makes previously-encrypted Aadhaar numbers unreadable — decrypt-and-re-encrypt before rotating.
- **Aadhaar is encrypted at rest** with Fernet (AES-128-CBC + HMAC-SHA256). It's masked as `XXXX XXXX 1234` everywhere except when an admin explicitly views it.
- **Session revocation** — every JWT has a `jti`; logout revokes it in the `sessions` table.
- **SQL injection** — all queries go through SQLAlchemy ORM; no raw SQL string concatenation.
- **XSS** — all user input is HTML-escaped on render (see `escapeHtml` in `ui.js`).
- **File upload validation** — server-side MIME-type check + size limit (default 5 MB).

---

## 📡 API Documentation

Once deployed, visit `/api/docs` for the interactive Swagger UI or `/api/redoc` for ReDoc.

### Endpoints overview

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Login with email/password, returns JWT |
| POST | `/api/auth/logout` | Revoke current session |
| GET | `/api/auth/me` | Current user info |
| GET/POST | `/api/users` | List / create users (admin) |
| PUT/DELETE | `/api/users/{id}` | Update / delete user (admin) |
| GET | `/api/residents` | List residents (paginated, filterable) |
| GET | `/api/residents/suggest` | Quick type-ahead suggestions |
| POST | `/api/residents` | Create resident |
| GET/PUT/DELETE | `/api/residents/{id}` | Resident CRUD |
| GET | `/api/residents/{id}/eligibility` | Run eligibility engine |
| GET/POST | `/api/families` | Family list / create |
| GET/PUT/DELETE | `/api/families/{id}` | Family CRUD |
| GET | `/api/documents` | List documents |
| POST | `/api/documents/upload` | Upload (multipart/form-data) |
| GET | `/api/documents/{id}` | Document metadata |
| GET | `/api/documents/{id}/download` | Download file |
| GET | `/api/documents/{id}/preview` | Inline preview |
| GET | `/api/documents/{id}/versions` | Version history |
| DELETE | `/api/documents/{id}` | Delete |
| GET/POST | `/api/schemes` | Scheme list / create |
| GET/PUT/DELETE | `/api/schemes/{id}` | Scheme CRUD |
| GET/POST | `/api/applications` | Application list / create |
| GET | `/api/applications/{id}` | Application detail with timeline |
| PUT | `/api/applications/{id}/status` | Update status (adds timeline entry) |
| DELETE | `/api/applications/{id}` | Delete (admin) |
| GET | `/api/audit` | Audit logs (admin: all, operator: own) |
| GET | `/api/dashboard/stats` | Dashboard aggregates |
| GET | `/api/dashboard/search` | Cross-entity global search |
| GET | `/api/reports/residents.csv` | Residents CSV |
| GET | `/api/reports/families.csv` | Families CSV |
| GET | `/api/reports/schemes.csv` | Schemes CSV |
| GET | `/api/reports/applications.csv` | Applications CSV (optional `?status_filter=`) |
| GET | `/api/reports/ward.csv` | Ward aggregate |
| GET | `/api/reports/village.csv` | Village aggregate |
| GET | `/health` | Health check |

---

## 👥 Roles & Permissions

| Action | Admin | Operator |
| --- | :---: | :---: |
| Login / logout | ✅ | ✅ |
| View / search residents | ✅ | ✅ |
| Add / edit residents | ✅ | ✅ |
| Delete residents | ✅ | ❌ |
| Reveal full Aadhaar | ✅ | ❌ |
| Upload / preview / download documents | ✅ | ✅ |
| Manage schemes | ✅ | ✅ |
| Apply for schemes | ✅ | ✅ |
| Update application status | ✅ | ✅ |
| Delete applications | ✅ | ❌ |
| View all audit logs | ✅ | ❌ (own only) |
| Manage users | ✅ | ❌ |
| Change system settings | ✅ | ❌ |

---

## 🛠️ Future Improvements

- [ ] Migrate document storage to **Vercel Blob** or S3 for files >5 MB
- [ ] Two-factor authentication (TOTP) for admins
- [ ] Bulk resident import via CSV upload
- [ ] Multi-language UI (Hindi / Marathi / English)
- [ ] SMS / email notifications for application status changes
- [ ] Per-resident QR code for offline verification
- [ ] Advanced scheme matching with weighted scoring
- [ ] Data export to PDF with formatted layout
- [ ] Role-based dashboard widgets

---

## 📜 License

This project is provided as-is for the Village Setu / Cybercafe use case. Modify and distribute freely within your organization.

---

## 🆘 Troubleshooting

**Deployment fails on Vercel with "module not found"**
→ Ensure `requirements.txt` at the repo root exists (it includes `-r backend/requirements.txt`).

**Database connection error on Vercel cold start**
→ Double-check the `DATABASE_URL` in Vercel env vars. The scheme MUST be `postgresql+psycopg2://` (not `postgres://`). Make sure `?sslmode=require` is appended for Aiven.

**`psycopg2` import error on Vercel**
→ `psycopg2-binary` is in `requirements.txt` and Vercel's Python runtime includes `libpq-dev`. If you still hit an error, switch to `psycopg2-binary==2.9.10` explicitly (already pinned).

**Login fails with "Invalid email or password"**
→ Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars. The admin user is seeded on first startup; if you changed them after first deploy, you'll need to manually update the user in the DB or delete and re-create the database.

**Aadhaar shows as `XXXX XXXX XXXX` even for admin**
→ The `ENCRYPTION_KEY` was changed after Aadhaar data was stored. Restore the original key, decrypt, then re-encrypt with the new key.

**Document upload fails with 413**
→ File exceeds `MAX_UPLOAD_MB` (default 5 MB). Either upload a smaller file or raise the limit (also raise Vercel's request body limit if needed).

**Aiven connection drops after ~30 minutes of idle**
→ Already handled — `pool_recycle=1800` recycles connections before Aiven drops them. On Vercel (serverless), `NullPool` is used automatically so this is a non-issue.

---

Built with ❤️ for digital governance.
