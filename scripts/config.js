// API Endpoints and Filenames
export const AUTH_URL = "https://api.gomining.com/api/auth/isAuth";
export const MINER_UPGRADE_URL = "https://api.gomining.com/api/internal-payment/get-my";
export const MINER_BUY_URL = "https://api.gomining.com/api/user-payments-history/index";
export const MY_NFT_URL = "https://api.gomining.com/api/nft/get-my";
export const DISCOUNT_URL = "https://api.gomining.com/api/user/get-my-nft-discount";
export const MAINTENANCE_STATE_URL = "https://api.gomining.com/api/action/get-maintenance-state";
export const USER_REWARDS_URL = "https://api.gomining.com/api/nft-game/rewards-by-user";
export const NFT_GAME_INCOME_URL = "https://api.gomining.com/api/nft-game/nft-game-income/find-aggregated-by-date";
export const NFT_GAME_INCOME_APP_URL = "https://app.gomining.com/api/nft-game/nft-game-income/find-aggregated-by-date";
export const CLAN_MEMBER_URL = "https://api.gomining.com/api/nft-game/clan/get-my-with-users";
// Newer API variant (observed to replace get-my-with-users)
export const CLAN_MY_URL = "https://api.gomining.com/api/nft-game/clan/get-my";
export const CLAN_BY_ID_URL = "https://api.gomining.com/api/nft-game/clan/get-by-id";
export const MARKETPLACE_ORDER_URL = "https://api.gomining.com/api/nft-marketplace-order/find-by-user";
// Marketplace listings (public marketplace index)
export const MARKETPLACE_ORDER_INDEX_URL = "https://api.gomining.com/api/nft-marketplace-order/index";
// Some endpoints are also reachable on app.gomining.com (fallback)
export const MARKETPLACE_ORDER_INDEX_APP_URL = "https://app.gomining.com/api/nft-marketplace-order/index";

// NFT marketplace listings (observed working endpoint)
export const NFT_MARKETPLACE_INDEX_URL = "https://api.gomining.com/api/nft/marketplace-index";
export const NFT_MARKETPLACE_INDEX_APP_URL = "https://app.gomining.com/api/nft/marketplace-index";
export const PUSH_SERVICE_URL = "https://api.gomining.com/api/action/push";
