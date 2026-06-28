# Motrix

Motrix is a Russian-language digital twin of a car and a contextual AI mechanic. It remembers the vehicle, its service history and documents, then tells the owner what deserves attention next.

## Product surface

- a personal garage built around the user's actual vehicle and photo;
- evidence-based next action without a fabricated health score;
- short ownership baseline that treats unknown history honestly;
- image review of service estimates and work orders;
- completed and planned service history;
- AI mechanic with vehicle and history context;
- local export, import and deletion;
- document review as a tool inside the vehicle rather than the whole product;
- annual Pro and one-off review pricing with provider-independent checkout links;
- isolated VIN provider adapter with manual-entry fallback.

The previous estate core, home, pet and device screens remain in the repository but are not imported into the launch UI.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to the deployment environment. `OPENAI_API_KEY` is required for document review and the AI mechanic. VIN lookup and paid checkout fail closed until their respective environment variables are configured.

## Build

```bash
npm run lint
npm run build
```

## Important limitation

The launch version stores the vehicle profile and history in the browser. This is suitable for a public beta, not for a paid cross-device account. Payment links can be exposed now, but production entitlements require a payment-provider webhook and a server-side user database after the acquiring provider is selected.
