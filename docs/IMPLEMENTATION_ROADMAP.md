# Motrix implementation roadmap

## Phase 1. Foundation

- [x] Yandex organization search provider.
- [x] Exist provider contract and capability map.
- [x] Environment configuration.
- [ ] Auth and server database.
- [ ] Provider request logging and cost accounting.
- [ ] Rate limiting.
- [ ] Staging environment.
- [ ] Unit and integration tests.

## Phase 2. Vehicle truth layer

- [ ] TRONK adapter.
- [ ] VIN and plate lookup.
- [ ] Vehicle facts with source and timestamp.
- [ ] Multiple vehicles and ownership periods.
- [ ] Replace health score with data coverage and service attention.

## Phase 3. Documents

- [ ] PDF and multipage support.
- [ ] Separate estimates, recommendations, and completed work.
- [ ] Document line model.
- [ ] Review result with evidence and questions for service.
- [ ] Never add an estimate to completed history automatically.

## Phase 4. Parts and services

- [ ] Confirm Exist authentication and request schemas.
- [ ] Original catalog lookup.
- [ ] Applicability by VIN/catalog.
- [ ] Analogs and offers.
- [ ] Basket and order flow.
- [ ] Yandex service search screen.
- [ ] Open online booking from organization card when available.
- [ ] Direct booking through partner CRM when commercially agreed.

## Phase 5. Commercial beta

- [ ] Entitlements and limits.
- [ ] One-off document review.
- [ ] Motrix Pro.
- [ ] Payments, webhooks, online cash register.
- [ ] Legal documents and consent journal.
- [ ] Product analytics.
