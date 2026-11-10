# Sync360 Payments

Accounts, transfers, terminals, expenses, approvals, invoices and payroll for a business.

Built with React 19 + Vite, TypeScript, Tailwind CSS v4, React Router 7, TanStack Query, Zustand, React Hook Form + Zod and Sonner. Same structure as sync-shipping.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5181
```

Other scripts: `npm run build`, `npm run preview`, `npm run type-check`, `npm run lint`.

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base the browser calls. Keep `/api/v1/`: Vite proxies it in dev and `netlify.toml` forwards it in production. |
| `VITE_API_PROXY_TARGET` | Where the dev proxy forwards `/api/v1` (defaults to staging). |
| `VITE_AUTH_MODE` | `api` = real backend. `mock` = no backend; demo sign-in and sample data for offline previews. |

For production, change the target in `netlify.toml` to `https://api.sync360.africa`.

## Structure

```
src/
  api/          data hooks + services per domain, typed response mappers
  components/
    ui/         reusable pieces (Field, Modal, DataTable, Pagination, Skeleton…)
    layout/     sidebar, top bar, app shell
  features/     one folder per screen; components only render, logic is in hooks/
  hooks/        shared hooks (useFormatMoney, useClipboard, useDisclosure…)
  lib/ routes/ stores/ styles/
```

Screens with no backend endpoint use sample data and show a "Sample data" badge. Amounts follow the selected business's currency through `useFormatMoney`.
