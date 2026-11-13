# TRT FINDS — Deployment & Operations Guide

## 1. Architecture Overview
TRT FINDS runs as a full-stack Node.js + Express + React application (`server.ts` serving both `/api/*` endpoints, uploaded media under `/uploads`, and the Vite-built SPA `dist/`).

- **Storefront**: Open to all visitors with zero Sign-Up or Sign-In friction. Wishlist items persist cleanly in browser `localStorage`.
- **Admin Portal (`/admin`)**: Protected by password-only authentication (`scrypt` hashed in `data/trt-store.json` + signed HMAC-SHA256 bearer sessions).
  - You can set `ADMIN_INITIAL_PASSWORD` in your environment before first startup (defaults to `TRT-ADMIN-2026`).
  - Once unlocked at `/admin`, you can change the password anytime from the **Password** tab.

---

## 2. Production Build & Start (Node / Cloud Run / Render / Railway)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the frontend bundle:
   ```bash
   npm run build
   ```
3. Start the production Express server on port `3000` (or `PORT`):
   ```bash
   NODE_ENV=production npm start
   ```
4. Ensure the `data/` directory is mounted on persistent storage if deploying to containers so uploaded media (`data/uploads/`) and `data/trt-store.json` persist across restarts.
