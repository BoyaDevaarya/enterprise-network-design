# EnterpriseNet Access Portal - Render Deployment Guide

Step-by-step guide to deploying **EnterpriseNet Access Portal** as a single high-performance Web Service on **Render** using Render Blueprints (`render.yaml`).

---

## 🌐 Live Demo URL

> **Production Deployment URL**: [https://enterprisenet-portal.onrender.com](https://enterprisenet-portal.onrender.com)
> *(Replace with your live Render Web Service URL after deployment)*

---

## 🛠️ Step-by-Step Deployment Options

### Option A: Automatic Blueprint Deployment (Recommended)

1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/BoyaDevaarya/enterprise-network-design.git`.
4. Render will automatically detect `render.yaml` and configure:
   - **Service Name**: `enterprisenet-portal`
   - **Environment**: `Node` (v20)
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
   - **Environment Variables**: `JWT_SECRET` (Auto-generated), `NODE_ENV=production`, `NODE_VERSION=20`.
5. Click **Apply**. Render will trigger the initial build and deploy your fullstack application.

---

### Option B: Manual Web Service Deployment

If creating a standard Web Service manually:
1. Click **New +** -> **Web Service**.
2. Connect `https://github.com/BoyaDevaarya/enterprise-network-design.git`.
3. Configure the following fields:
   - **Name**: `enterprisenet-portal`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables under **Advanced**:
   - `NODE_VERSION`: `20`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Click **Generate** (or enter a long random secret string).
5. Click **Create Web Service**.

---

## 🧪 Post-Deployment Verification Checklist

Once Render shows **Live**:
- [ ] **Health Endpoint**: Open `https://<your-app>.onrender.com/api/health` -> verify returns `{"status":"ok"}`.
- [ ] **Console Login**: Login as `hr@enterprisenet.local` with `Demo@123` -> verify cookie is set and user session loads.
- [ ] **Access Enforcement**: Open `Finance Ledger` -> verify 403 Forbidden with rule explanation.
- [ ] **SPA Deep Link Refresh**: Navigate to `https://<your-app>.onrender.com/matrix` and hit Refresh (`F5`) -> verify page reloads seamlessly without 404.
- [ ] **Live SSE Sync**: Open an `HR` window and an `Admin` window side-by-side -> flip `HR -> Finance` to Allowed in Admin session -> verify HR window unlocks live without page refresh.
- [ ] **Test Lab**: Run a simulated traffic ping (`Sales` to `Servers`) -> verify packet drop animation and blocked verdict.
- [ ] **Config Generator**: Open `Config Generator` -> verify Cisco IOS CLI router and switch syntax displays.

---

## ⚠️ Free Tier Ephemeral File Persistence & Upgrade Path

> [!NOTE]
> **Ephemeral Storage Notice**: Render's free tier Web Services utilize an ephemeral filesystem and spin down after 15 minutes of inactivity. When the instance restarts, `server/data/db.json` automatically re-seeds to factory default policy rules. This is expected behavior for demonstration mode.

### Production Upgrade Path:
The repository architecture (`server/src/repo/db.js`) is decoupled behind a repository interface (`dbRepository`). To preserve state permanently across server restarts:
1. Attach a **Render Persistent Disk** to mount `/server/data`.
2. Or swap the repository layer for **Render Postgres** or **SQLite**.
