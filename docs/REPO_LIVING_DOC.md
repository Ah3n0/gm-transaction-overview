# gm-transaction-overview — Living Repo Doc

_Last updated: 2026-02-07_

This document is meant to be a **single source of truth** for the current state of the repository: what exists today, what we want next, and how the architecture is structured.

## 1) What we have (current product)

### Purpose
A Chrome Extension (Manifest v3) that:
- Detects the GoMining `access_token` from browser cookies.
- Fetches user/account-related data from GoMining APIs.
- Provides additional in-popup “dashboards”:
  - NFT / Miner overview + events
  - Rewards overview
  - Clan members overview with sorting/filtering and computed totals
  - Discount overview
  - Maintenance state + auto-activation of a maintenance action button
  - Marketplace overview (cheapest $/TH)

### User-facing UI
- Popup UI: `ui/popup.html`
- Styling: `styles/styles.css`, `styles/clan.css`
- Tabs: NFT / Rewards / Clan Members / Discount / Marketplace

### Key behaviors
- On popup load (`DOMContentLoaded`):
  - reads extension version from `chrome.runtime.getManifest()`
  - attempts auth check (`AUTH_URL`) to display user profile info
  - loads miners (NFTs) + marketplace orders to mark sold NFTs
  - loads discount information
  - loads maintenance state and schedules/activates “Update Maintenance”
  - loads rewards list
  - loads clan members list, provides sorting/filtering and computes a “Total Sum”



## 2) What we want (roadmap + improvement goals)

### Roadmap from README
- Background processing: downloads continue even if popup closes.
- Wallet integration: add BTC wallet support and wallet selection.
- Buy/Sell data: include transactions unrelated to GMT/BTC wallets.
- Clan join/leave: show joiners and leavers.

### Quality / architecture goals (recommended)
- Make API pagination and filtering **correct and configurable** (no hard-coded ranges/cursors).
- Reduce coupling between UI and data fetching (introduce a small “service layer”).
- Improve error handling and resilience (retry/backoff for transient failures, better messages).
- Improve test reliability (tests currently appear out-of-sync with implementation in a few places).
- Add light type-safety (JSDoc types or migrate to TypeScript) to stabilize data models.
- Ensure long-running timers/intervals are not duplicated and are properly cleaned up.

## 3) High-level architecture

### Components
- **Popup UI** (DOM & events)
  - `scripts/popup.js`
  - `ui/popup.html`
- **Background service worker**
  - `scripts/background.js` (auto reload on update)
- **Config & constants**
  - `scripts/config.js` (API endpoints, filenames, CSV headers)
- **Utilities**
  - `scripts/utils/api.js` (API calls)
  - `scripts/utils/cookies.js` (token extraction)
  - `scripts/utils/ui.js` (UI helpers)
  - `scripts/utils/time.js` (date formatting)

### Data flow (Dashboards)
- User info: `AUTH_URL` (GET)
- Miner list: `fetchNFT` (POST to `MINER_BUY_URL`)
- Marketplace orders: `fetchMarketplaceOrders` (POST to `MARKETPLACE_ORDER_URL`) -> mark sold
- Miner events: `displayMinerEvents` -> `fetchUpgradesNFT` (POST to `MINER_UPGRADE_URL`) -> filter by `nft.id`
- Discount: `fetchDiscount` (POST to `DISCOUNT_URL`)
- Maintenance:
  - initial: `fetchMaintenanceState` (POST to `MAINTENANCE_STATE_URL`)
  - action: `pushService` (POST to `PUSH_SERVICE_URL`) + countdown logic
- Rewards: `fetchUserRewards` (POST to `USER_REWARDS_URL`)
- Clan: `fetchClanMember` (POST to `CLAN_MEMBER_URL`, internally paginated)

## 4) Repo map (where to look)

### Entry points
- Popup UI markup: `ui/popup.html`
- Popup logic: `scripts/popup.js`
- Background worker: `scripts/background.js`

### Utilities
- API wrapper: `scripts/utils/api.js`
- Cookie token: `scripts/utils/cookies.js`
- UI helpers (z.B. Maintenance-Countdown/Activation): `scripts/utils/ui.js`
- Date formatting: `scripts/utils/time.js`

### Tests
- Runner: `run-tests.js`
- Tests: `tests/*.test.js`
  - Note: the runner executes tests sequentially and fails the process on the first failing test.

## 5) Build, versioning & tests

### Commands
- Tests: `npm test` (runs `node run-tests.js`)
- Version sync: `npm run sync-version` (runs `node scripts/update-manifest.js`)

### Notes
- `package.json` uses ESM (`"type": "module"`).
- `scripts/update-manifest.js` is ESM-safe (uses `import.meta.url` / `fileURLToPath`) and keeps `manifest.json` in sync with the `package.json` version.

### Current test status (observed)
- `npm test` currently runs `tests/*.test.js` and those pass.

## 6) Known risks / tech debt (observed)

### Timer/interval handling
- Maintenance countdown in `scripts/utils/ui.js` uses repeated intervals/timeouts and may create duplicated timers.
- Risk: repeated background polling, unexpected UI behavior, wasted resources.

### Test drift
- Keep the tests aligned with the current UI/API behavior; this extension relies on multiple API fallbacks (Clan/Marketplace), which are easy to regress.

## 7) Desired improvements (backlog candidate list)

### Architecture
- Introduce a small `services/` layer:
  - `profileService` (auth/user)
  - `nftService`, `clanService`, etc.
- Keep `popup.js` mostly as view/controller wiring.

### Performance & UX
- Cache some API results (per popup session) to avoid repeated calls.
- Add “refresh” buttons for tabs and a global “reload data”.
- Improve error messages (HTTP status + actionable guidance).

### Quality
- Bring tests back to green; decide on ESM-only test style (avoid mixing `require` and ESM).
- Consider TypeScript or stronger JSDoc typing for API responses.
- Add linting/formatting (ESLint/Prettier) if desired.
- Add changes to Changelog. Increase Version within your own expectation. (If it is a bigegr change, increse major, otherwise miner, or if it just a tiny change, last version number)

## 8) How to keep this doc up-to-date

When a change is made, update at least:
- **What we have** (features)
- **Architecture** (data flow, module responsibilities)
- **Commands** (build/test/versioning)
- **Backlog** (remove completed items, add new ones)

---

If you tell me your top 2–3 improvement goals (z.B. “Marketplace-Fallbacks stabilisieren”, “Performance/Cache im Popup”, “UX/Fehlermeldungen”), I can propose a concrete implementation plan and start patching the repo.
