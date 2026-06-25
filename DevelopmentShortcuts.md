# 🚀 DevelopmentShortcuts.md

> A collection of useful development commands, deployment configurations, Git shortcuts, and reusable code snippets for MERN Stack projects.

---

# 📑 Table of Contents

* [JWT Secret Generation](#-jwt-secret-generation)
* [ImageKit URL Format](#-imagekit-url-format)
* [Remove Existing Git Repository](#-remove-existing-git-repository)
* [.gitignore Template](#-gitignore-template)
* [Vercel Deployment](#-vercel-deployment)

  * [Backend Configuration](#backend-verceljson)
  * [Frontend Configuration](#frontend-verceljson)
  * [Single Vercel Project (Monorepo)](#root-verceljson-monorepo)
* [Production API URL](#-production-api-url)
* [CORS Configuration](#-cors-configuration)

---

# 🔐 JWT Secret Generation

Generate a secure 256-bit JWT secret using Node.js.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Example Output

```text
d9f4b57d9adf55bc8f51ceaf63db71d0581fb63e4f56d534f77d1d7bd8cb9d79
```

> **Tip:** Store this value inside your `.env` file.

```env
JWT_SECRET=your_generated_secret_here
```

---

# 🖼️ ImageKit URL Format

General ImageKit URL structure:

```text
https://ik.imagekit.io/<imagekit_id>/path/to/image.jpg
```

### Example

```text
https://ik.imagekit.io/oqf7lzhbi/path/to/myimage.jpg
```

---

# 🗑️ Remove Existing Git Repository

Sometimes you clone a frontend from another repository and want to connect it to your own GitHub repository.

Navigate into the project:

```bash
cd frontend
```

Remove the existing Git history:

```bash
rm -rf .git
```

Initialize a fresh repository:

```bash
git init
```

Add your own remote:

```bash
git remote add origin <your-repository-url>
```

---

# 📄 .gitignore Template

A recommended `.gitignore` for MERN Stack projects.

```gitignore
# ==========================
# Dependencies
# ==========================
node_modules/
*/node_modules/

# ==========================
# Environment Variables
# ==========================
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

frontend/.env
backend/.env

# ==========================
# Build Files
# ==========================
dist/
build/

# ==========================
# Logs
# ==========================
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ==========================
# OS Files
# ==========================
.DS_Store
Thumbs.db

# ==========================
# Vercel
# ==========================
.vercel

# ==========================
# IDE
# ==========================
.vscode/
.idea/
```

---

# ☁️ Vercel Deployment

---

## Backend `vercel.json`

Use this configuration when deploying an Express backend.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "dist/**"
        ]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

---

## Frontend `vercel.json`

For React/Vite frontend deployment.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

---

## Root `vercel.json` (Monorepo)

Use this **only** when deploying both frontend and backend in the **same Vercel project**.

```json
{
  "experimentalServices": {
    "frontend": {
      "root": "frontend",
      "routePrefix": "/",
      "framework": "vite"
    },
    "backend": {
      "root": "backend",
      "routePrefix": "/_/backend",
      "entrypoint": "server.js"           //index.js if backend server file named as index.js
    }
  }
}
```

### Folder Structure

```text
project-root
│
├── frontend/
├── backend/
├── .gitignore
├── vercel.json           //Root vercel.json file
└── README.md
```

---

# 🌐 Production API URL

When using a monorepo deployment on Vercel:

```javascript
const API_URL = import.meta.env.PROD
  ? "/_/backend/api"
  : "http://localhost:8000/api";
```

### Development

```text
http://localhost:8000/api
```

### Production

```text
/_/backend/api
```

This allows the frontend to automatically use the correct API endpoint depending on the environment.

---

# 🛡️ CORS Configuration

Allow localhost during development and your deployed frontend in production.

```javascript
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);

    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
```

### Example `.env`

```env
CLIENT_URL=https://your-frontend.vercel.app
```

Or allow multiple frontend URLs:

```env
CLIENT_URL=https://frontend1.vercel.app,https://frontend2.vercel.app
```

---

# 💡 Notes

* Keep all secrets inside `.env` files.
* Never commit `.env` files to GitHub.
* Use the root `vercel.json` only for monorepo deployments where both frontend and backend are hosted in the same Vercel project.
* Store JWT secrets securely and regenerate them if they are ever exposed.
* Always test your CORS configuration in both local and production environments before deployment.

---

## 📌 Quick Reference

| Task                | Command / File                                                             |
| ------------------- | -------------------------------------------------------------------------- |
| Generate JWT Secret | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Remove Git          | `rm -rf .git`                                                              |
| Initialize Git      | `git init`                                                                 |
| Backend Config      | `backend/vercel.json`                                                      |
| Frontend Config     | `frontend/vercel.json`                                                     |
| Monorepo Config     | `vercel.json`                                                              |
| Production API      | `/_/backend/api`                                                           |
| Local API           | `http://localhost:8000/api`                                                |

---

**Happy Coding! 🚀**
