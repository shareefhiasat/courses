# Environment Variables

Create a `.env` file in the `client` directory with the following variables:

## PostHog Analytics (EU Region)
```env
VITE_PUBLIC_POSTHOG_KEY=phc_mpxjjYTNPiUTxE12MYkOsbH1DLTsjuOz4EEUOWEkUuc
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## Sentry Error Tracking
```env
VITE_SENTRY_DSN=https://226bc4d018e5d5b73f2dfd03014bb4c9@o570111.ingest.us.sentry.io/4510386883067904
VITE_SENTRY_ENVIRONMENT=development
```

## Optional: Enable Debug Mode in Development
```env
# Uncomment to enable PostHog in development
# VITE_POSTHOG_DEBUG=true

# Uncomment to enable Sentry in development
# VITE_SENTRY_DEBUG=true
```

## Notes
- PostHog and Sentry are automatically disabled in development unless debug flags are set
- In production, set `VITE_SENTRY_ENVIRONMENT=production`
- All variables with `VITE_PUBLIC_` prefix are embedded in the client bundle
- Keep your `.env` file in `.gitignore` to protect sensitive keys
