# 🪑 Estora — Modern Furniture Storefront & Admin Workspace

Welcome to **Estora**, a premium e-commerce experience designed for high-end home decor. This project is a modern storefront featuring responsive swipe-and-click sliders, cart modules, and a fully fluid administrative workspace to manage stock, reviews, roles, and audit trails.

Designed and crafted by **black12-ag** as a showcase of modern frontend architecture, visual aesthetics, and database integrations.

---

## 🚀 Live Showcase
* **Live App:** [estora-furniture-portfolio.muay01111.workers.dev](https://estora-furniture-portfolio.muay01111.workers.dev)
* **Demo Mode:** Click **"Explore Admin Dashboard (Demo)"** on the sign-in screen to instantly access the dashboard with administrator privileges.

---

## ✨ Features & Architecture

### 🏪 Storefront
* **Spacious Widescreen Layout:** Fluid elements optimized to stretch edge-to-edge for premium, desktop presentations.
* **Fluid Slide Navigation:** Multi-slide promo carousel featuring tactile swipe-gestures and keyboard arrow keys navigation.
* **Shopping Cart & Checkout:** Persistent client-side cart drawer with interactive quantities, promo codes, and a visual payment simulator.

### 🛡️ Admin Dashboard & Governance
* **Overview & Metrics:** Quick-glance charts displaying mock revenues and storefront statistics.
* **Granular Role Controls:** Manage granular resource permissions (products, orders, audit logs) with pre-made templates (Fulfillment, Support, Catalog Manager).
* **Inventory Control & Logs:** Update product stock amounts and review system-wide audit adjustments.

---

## ⚡ Quick Start (Get it running in seconds)

To run the application locally, run these simple commands:

```bash
# Clone the repository
git clone https://github.com/black12-ag/estora-furniture-portfolio.git
cd estora-furniture-portfolio

# Install packages and boot the local server
bun install && bun run dev
```

The dev server will launch at [http://localhost:8080/](http://localhost:8080/).

---

## 🛠️ Stack & Standards
- **Framework:** React 19, TanStack Start (SSR), Vite
- **Styling:** Tailwind CSS v4.0
- **Database & Auth:** Supabase Integration
- **Package Manager:** Bun
- **Deployments:** Cloudflare Workers & Assets
