# RecipeHub – Recipe Sharing Website

Express + JWT backend, vanilla HTML/CSS/JS frontend. Data is stored in JSON files (`data/`), so no database setup is needed.

## Run
```bash
npm install
npm start          # http://localhost:3000
```
Optional: set `JWT_SECRET` and `PORT` environment variables (see `.env.example`).

## API
| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | – | Create account, returns JWT |
| POST | /api/auth/login | – | Log in, returns JWT |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/recipes?q=&category=&maxTime= | – | List / search / filter |
| GET | /api/recipes/:id | – | Recipe detail |
| POST | /api/recipes | JWT | Submit recipe |
| POST | /api/recipes/:id/rate | JWT | Rate 1–5 |
| DELETE | /api/recipes/:id | JWT (owner) | Delete own recipe |

Send the token as `Authorization: Bearer <token>`.
