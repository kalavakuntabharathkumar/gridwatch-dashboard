# GridWatch - Real-time Energy Market Dashboard

Angular 17+ dashboard consuming live U.S. Energy Information Administration (EIA) electricity APIs with GraphQL aggregation, threshold-based alerting, and production monitoring.

## Features
- Live hourly electricity prices, demand, and generation by source for 65+ balancing authorities
- GraphQL aggregation layer combining 3 EIA REST endpoints via Apollo Client RESTLink
- Chart.js virtualized time-series visualizations with real-time polling
- Browser notification alerts with configurable thresholds and 4-hour SLA tracking
- Sentry error monitoring integration
- 94% unit test coverage (Jest) + Cypress E2E suite

## Data Source
**U.S. EIA Electricity API v2** - `https://api.eia.gov/v2/electricity/`
- Real-time hourly prices, demand, and generation by fuel type
- Covers all 65+ balancing authorities (BA) in the lower 48 states
- Free API key required (register at https://www.eia.gov/opendata/)

## Tech Stack
- Angular 17+ (standalone components, signals)
- Vite, TypeScript, RxJS
- Apollo Client (GraphQL) with RESTLink for EIA aggregation
- Chart.js / ng2-charts
- Tailwind CSS
- Jest (unit), Cypress (E2E)
- Sentry (error monitoring)

## Prerequisites
- Node.js 20+
- npm 10+
- EIA API key (free registration)

## Setup
```bash
# Clone and install
npm install

# Configure environment
cp src/environments/environment.example.ts src/environments/environment.ts
# Edit environment.ts and add your EIA_API_KEY

# Development server
npm run start
```

## Available Scripts
| Command | Description |
|---------|-------------|
| `npm run start` | Start dev server on http://localhost:4200 |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run Jest unit tests with coverage |
| `npm run test:watch` | Jest in watch mode |
| `npm run e2e` | Run Cypress E2E tests |
| `npm run lint` | Run ESLint |

## Environment Variables
Create `src/environments/environment.ts` from the example:
```typescript
export const environment = {
  production: false,
  eiaApiKey: 'YOUR_EIA_API_KEY_HERE',
  sentryDsn: '', // Optional: add Sentry DSN for error tracking
  pollingIntervalMs: 300000, // 5 minutes
  alertSlaHours: 4
};
```

## Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/      # Main dashboard with BA selector & charts
│   │   └── chart/          # Reusable Chart.js wrapper component
│   ├── graphql/
│   │   ├── apollo.config.ts  # Apollo Client with RESTLink setup
│   │   └── queries.ts        # GraphQL queries for aggregated data
│   ├── models/
│   │   └── energy.models.ts  # TypeScript interfaces for EIA data
│   ├── services/
│   │   ├── eia.service.ts    # REST API calls & data transformation
│   │   └── alert.service.ts  # Threshold alerts & browser notifications
│   ├── app.component.ts
│   ├── app.config.ts         # Angular 17+ application config
│   └── app.routes.ts
├── environments/
└── main.ts
```

## API Endpoints Used
| Endpoint | Description |
|----------|-------------|
| `/electricity/rto/region-data/data/` | Hourly prices & demand by BA |
| `/electricity/rto/fuel-type-data/data/` | Hourly generation by fuel source |
| `/electricity/rto/daily-fuel-type-data/data/` | Daily generation summaries |

## Alerting
Configure thresholds in `alert.service.ts` or via UI:
- Price spikes (> $100/MWh)
- Demand anomalies (> 2σ from 7-day avg)
- Generation mix shifts (e.g., coal > 50%)

Alerts trigger browser notifications (with permission) and log to Sentry.

## Testing
```bash
# Unit tests
npm run test

# E2E tests (requires dev server running)
npm run e2e
```

## Production Monitoring
- Sentry DSN configured via `environment.sentryDsn`
- All unhandled errors captured automatically
- Alert delivery failures logged as Sentry events

## License
MIT - Portfolio project for demonstration purposes.