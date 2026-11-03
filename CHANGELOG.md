# Changelog

## Version 0.8.0
### Added
- Koinly: new tab to export the GoMining wallet history as Koinly Universal CSV (daily net reinvestment, maintenance, Simple Earn BTC rewards, GMT fund, bonuses, asset conversions, deposits/withdrawals). NFT purchases/sales/upgrades are exported as "PRÜFEN" rows for manual review.
- API: `fetchWalletTransactionHistory` (cursor based, `/api/wallet/transaction-history`).

### Fixed
- NFT tab: marketplace orders endpoint `find-by-user` returns 404 -> switched to `find-by-user-v2` (status filter, `nft.id` instead of `nftId`). Previously the whole NFT tab failed to load.

## Version 0.7.2
### Added
- NFT: Toggle (default off) to show sold NFTs.
- NFT: Include gifted/owned miners by merging `user-payments-history/index` with `POST /api/nft/get-my`.
- Pool Rewards: new tab (last 12 months) with net calculation and GMT totals.
- User: moved user info into its own tab.

### Improved
- Marketplace: $/TH now based on `priceUsdt / power` (matches detail view).
- Marketplace: show energy efficiency (W/TH).
- Marketplace: Top-N dropdown (5/10/20/50/100) and auto-reload; removed Reload button.

## Version 0.7.1
### Removed
- Export/Transaction-Download: CSV/Koinly/Blockpit Export vollständig entfernt (inkl. ungenutztem Code und Tests).

## Version 0.6.9
### Fixed
- Marketplace: handle `INVALID_AUDIENCE` (403) by falling back to cookie-auth on `app.gomining.com`.

## Version 0.6.10
### Improved
- Marketplace: try public (no-auth) requests first, then bearer/cookie fallbacks; show detailed diagnostics in the tab when loading fails.

## Version 0.6.11
### Fixed
- Marketplace: when the API blocks extension-origin requests (403), fetch listings via an injected request in an `app.gomining.com` tab.

## Version 0.6.12
### Fixed
- Marketplace: switch listings source to `POST https://api.gomining.com/api/nft/marketplace-index` (working endpoint).

## Version 0.6.13
### Fixed
- Marketplace: `marketplace-index` rejects `filters.currency=USD`; use `GMT` (supported) to avoid 400 errors.

## Version 0.6.14
### Improved
- Marketplace: fix NFT links (prefer API-provided URL / better key+id mapping) and show miner thumbnail images.

## Version 0.6.15
### Fixed
- Marketplace: NFT links now use the canonical format `https://app.gomining.com/nft/view/<id>`.

## Version 0.6.16
### Fixed
- Marketplace: preserve `nft/view/<uuid>` links when present in the API payload (links are often UUID-based).

## Version 0.6.17
### Fixed
- Marketplace: build NFT detail links from `externalUrlId` (UUID) when provided by the API.

## Version 0.6.8
### Added
- Marketplace: new tab showing the 10 currently cheapest miners by $/TH (with a Reload button).

## Version 0.6.7
### Removed
- Clan Members: removed Clan ID override; the popup shows only your own clan.

## Version 0.6.6
### Changed
- Clan Members: Clan ID button now reloads the member list immediately (no need to reopen the popup).

## Version 0.6.5
### Fixed
- Clan Members: handle removed endpoint (404 on `get-my-with-users`) by falling back to `get-my` and then `get-by-id`.
### Added
- Optional Clan ID input in the popup to force member loading via `get-by-id` if clan discovery endpoints change again.

## Version 0.6.4
### Fixed
- Clan Members: restored loading by falling back to `get-by-id` when `get-my-with-users` no longer returns member arrays.
- API errors now include HTTP status and response body for easier debugging.

## Version 0.6.3
### Added
- user panel collaps

## Version 0.6.2
### Added
- Marked sold nft as sold

## Version 0.6.1
### Added
- Aditional Clan Member information

## Version 0.6.0
### Added
- Clan Member information
- Reward information

## Version 0.5.0
### Added
- Maintenance information
- Maintenance Service Button (Without function yet)

## Version 0.4.0
### Added
- NFT Overview with listed events

## Version 0.3.1
### Added
- Unittests for api, cookies, files, mappers, time and popup js files
- Github workflow for unittests

## Version 0.3.0
### Added
- Datepicker

## Version 0.2.3
### Added
   `utils.js` for utility functions.
- Introduced new utility files to improve modularity.
- Badge version in readme

### Changed
- Readme
- Date label

### Changed
- Refactored `popup.js` for better readability and maintainability.

## Version 0.2.2
### Changed
- Reorganized the code structure for better modularity.

## Version 0.2.1
### Added
- `README.md` documentation.

## Version 0.2.0
### Added
- Displayed user information in the popup interface.

## Version 0.1.0
### Added
- Automated `access_token` extraction.
- Retrieved GoMining transfer history.
- Implemented login status check.
- Enhanced initial UI styling.
- Added checkboxes for selecting file formats (CSV, Koinly, Blockpit).
- Enabled automatic UI updates.
