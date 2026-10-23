# TaskFlow React Frontend

The web client for TaskFlow: a focused workspace for signing in and managing projects, teammates, and tasks through the Laravel API.

> **Live website:** https://taskflow-react-frontend.wasmer.app

## Features

- React single-page application built with Vite
- Sign-in and role-aware task/project experience
- Laravel API integration with configurable API base URL
- Runtime API URL configuration for static hosting through `public/config.js`
- Responsive interface for desktop and mobile layouts

## Stack

React 18, Vite 5, JavaScript

## Run locally

1. Install Node.js 20+.
2. Install packages: `npm install`.
3. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8000/api` when using the local Laravel API.
4. Start the development server: `npm run dev`.
5. Open the local URL printed by Vite (normally `http://localhost:5173`).

For a production build, run `npm run build`; Vite writes static assets to `dist/`. Preview that build with `npm run preview`.

## API configuration

The app first reads `globalThis.TASKFLOW_CONFIG?.apiUrl` from `public/config.js`, then falls back to `VITE_API_URL`. For deployment, set the API base URL to the deployed Laravel URL ending in `/api`, and configure the Laravel API's CORS `FRONTEND_URL` to the deployed frontend origin. Keep credentials and tokens out of frontend source files.

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@taskflow.local` | `Admin123!` |
| Member | `member@taskflow.local` | `Member123!` |

Admins can create projects and tasks. Members see projects and tasks assigned to them and can update their assigned task status.

## Tests

Run `npm run build` for the production bundle. For the Playwright UI flow, start the Vite server with `npm run dev` in one terminal, install a Playwright browser with `npx playwright install chromium`, then run `npm run test:ui` in another terminal. The UI flow uses stubbed API responses and covers both roles, project/task creation, project navigation, status updates, and member task visibility. If using an installed Chrome instead of the Playwright browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path.

## Wasmer deployment

`app.yaml`, `wasmer.toml`, and `Staticfile` configure this static-site deployment. `public/config.js` points to the live Laravel API. When deploying elsewhere, update that public URL and make sure the Vite build can read `VITE_API_URL` if using the environment variable fallback. Laravel CORS must allow the frontend origin.

## Related repositories

- [TaskFlow Laravel API](https://github.com/zagesh7/taskflow-laravel-api)
- [TaskFlow Django overdue service](https://github.com/zagesh7/taskflow-django-overdue)

