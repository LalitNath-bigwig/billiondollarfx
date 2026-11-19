// Minimum deposit amounts, centralized here so they can be tuned (e.g. for
// testing) in one place instead of hunting through every form that validates
// a deposit amount. Mirrors Billion_Doller_Backend/config/depositLimits.js -
// keep both in sync if you change one.
export const MIN_DEPOSIT_USD = 1;
export const MIN_DEPOSIT_INR = 10;
export const MIN_DEPOSIT_LKR = 100;
// IDR is whole rupiah. The backend also enforces a US$1 minimum at the configured
// rate, so keep this comfortably above 1 USD. Max matches the gateway per-order cap.
export const MIN_DEPOSIT_IDR = 20000;
export const MAX_DEPOSIT_IDR = 100000;
