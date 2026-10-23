# TaskFlow React Frontend

The web client for TaskFlow: a focused workspace for signing in and managing projects, teammates, and tasks through the Laravel API.

> **Live website:** _URL to be added after deployment._

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

## Wasmer deployment

`app.yaml`, `wasmer.toml`, and `Staticfile` configure this static-site deployment. Connect this GitHub repository to Wasmer, use the Vite production build output in `dist/`, and configure the runtime API URL in `public/config.js` after the Laravel API has a stable URL. Confirm the deployed frontend can reach the API over HTTPS and that Laravel CORS allows the frontend origin.

## Related repositories

- [TaskFlow Laravel API](https://github.com/zagesh7/taskflow-laravel-api)
- [TaskFlow Django overdue service](https://github.com/zagesh7/taskflow-django-overdue)

