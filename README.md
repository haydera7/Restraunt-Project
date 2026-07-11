# Nightly stock tally (MERN)

A tool for a restaurant owner to enter nightly sales (from a paper/verbal report)
and instantly see how much of each ingredient was used, and what's left in stock.

Stack: MongoDB + Express + React (Vite) + Node.

## Project layout

```
server/   Express API + Mongoose models (Ingredient, MenuItem, TallyLog)
client/   React frontend (Vite)
```

## 1. Backend setup

```
cd server
npm install
cp .env.example .env
# edit .env if your MongoDB is not on localhost:27017
npm run seed   # optional: adds example ingredients + menu items (Pizza, Burger)
npm run dev    # starts the API on http://localhost:4000
```

Requires a running MongoDB instance. Locally: install MongoDB Community Server,
or run `docker run -d -p 27017:27017 mongo` if you use Docker.
For a hosted option, MongoDB Atlas has a free tier — put its connection string
in `MONGO_URI` in `.env`.

## 2. Frontend setup

In a second terminal:

```
cd client
npm install
npm run dev    # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`, so just
open http://localhost:5173 in your browser.

## How it works

1. **Stock tab** — add ingredients (name, unit, starting stock).
2. **Recipes tab** — add menu items and how much of each ingredient one unit uses
   (e.g. Pizza = 3.5 eggs + 200ml milk + 250g flour + 150g cheese).
3. **Tally tab** — each night, pick a menu item and type the quantity sold from
   the report, click Add, repeat for every item sold. Click
   "Process tonight's tally" to deduct ingredient usage from stock and see the
   remaining amounts. Items running low (under 15% of pre-tally stock) or that
   went negative (oversold vs. what's on hand) are flagged.

All data lives in MongoDB, so it persists across restarts and is shared across
anyone using the same deployed instance.

## Deploying

- **API**: any Node host (Render, Railway, a VPS) + a MongoDB Atlas cluster.
- **Frontend**: `npm run build` in `client/` produces static files in
  `client/dist/` that can be served from any static host (Netlify, Vercel,
  Nginx) — just point `VITE`'s proxy or your host's rewrite rules at the API's
  real URL instead of localhost.

## Notes / next steps

- No authentication yet — anyone who can reach the app can edit stock. If this
  goes on a shared network, consider adding a simple login before going live.
- `TallyLog` keeps history of every processed night — a "History" tab could be
  added to browse or export past nights if useful.
