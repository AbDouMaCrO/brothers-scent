# Perfume Wholesale — Project Rules

## What This Is
Wholesale perfume ordering platform. Customers register/sign-in, browse catalogue, order via WhatsApp. Admin manages products, categories, prices, orders via dashboard.

## Auth Rules
- Prices are hidden behind login — never show `.price-current` values to unauthenticated users
- Guest users see "🔒 Sign in for price" in place of every price
- Add-to-cart and order buttons must trigger login modal for guests
- Registration creates a pending account; admin approves from dashboard
- Session stored in `localStorage` key `ls_session`. Never store plaintext passwords — hash with `btoa` until a real backend is wired up

## WhatsApp Orders
- All orders route to the business WhatsApp via `wa.me` deep link
- Phone number is set in dashboard Settings and stored in `ls_settings.whatsappNumber`
- Message format: customer name, company, ordered items (name, size, qty, unit price, line total), grand total, order ID
- Never hardcode the WhatsApp number in HTML or JS — always read from `ls_settings`

## Dashboard
- Route: `/dashboard.html`
- Protected by admin password stored in `ls_settings.adminPassword` (default: `admin123` — prompt user to change on first login)
- Sections: Overview, Categories, Products, Orders, Users, Settings
- All data lives in localStorage keys: `ls_categories`, `ls_products`, `ls_orders`, `ls_users`, `ls_settings`

## Data Schema (localStorage)

### ls_settings
```json
{
  "whatsappNumber": "",
  "businessName": "LuxeScent",
  "currency": "USD",
  "minOrderAmount": 500,
  "adminPassword": "admin123"
}
```

### ls_categories
```json
[{ "id": "uuid", "name": "Women's Fragrances", "slug": "women", "icon": "🌸", "active": true }]
```

### ls_products
```json
[{ "id": "uuid", "name": "", "brand": "", "category": "slug", "size": "100ml", "price": 0, "stock": 0, "badge": "", "active": true, "createdAt": "" }]
```

### ls_orders
```json
[{ "id": "ORD-001", "userId": "", "customerName": "", "company": "", "items": [], "total": 0, "status": "pending", "whatsappSent": false, "date": "" }]
```

### ls_users
```json
[{ "id": "", "name": "", "company": "", "email": "", "phone": "", "passwordHash": "", "approved": false, "createdAt": "" }]
```

## File Structure
```
/
├── index.html          homepage + hero + featured products
├── dashboard.html      admin-only panel
├── CLAUDE.md           this file
├── css/
│   ├── style.css       main theme (dark/gold)
│   └── dashboard.css   dashboard-specific styles
├── js/
│   ├── auth.js         login, register, session, price gating
│   ├── cart.js         cart state + WhatsApp checkout
│   ├── main.js         hero slider, tabs, nav
│   └── dashboard.js    admin panel logic
├── pages/
│   ├── products.html   full catalogue (auth-gated prices)
│   ├── about.html
│   ├── contact.html
│   └── orders.html     customer order history
└── images/
```

## Coding Rules
- No frameworks — vanilla JS + localStorage for MVP
- No external CDNs unless critical
- Auth gates applied by `auth.js` on `DOMContentLoaded` — not baked into HTML
- WhatsApp number never hardcoded — always from `ls_settings`
- When backend is added, swap `localStorage` reads/writes for API calls — the interface stays the same
- Admin dashboard at `/dashboard.html` — never link to it from the public nav

## Recommended Next Stack (when scaling)
- **Supabase** — drop-in Postgres + Auth + Storage (replaces localStorage)
- **PocketBase** — lighter self-hosted alternative (single binary)
- **n8n** — automate WhatsApp notifications via webhook
- **Meilisearch** — product search
