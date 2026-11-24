// Minimum deposit amounts, centralized here so they can be tuned (e.g. for
// testing) in one place instead of hunting through every form that validates
// a deposit amount. Mirrors Billion_Doller_Backend/config/depositLimits.js -
// keep both in sync if you change one.
export const MIN_DEPOSIT_USD = 1;
export const MIN_DEPOSIT_INR = 10;
export const MIN_DEPOSIT_LKR = 100;
// IDR is whole rupiah. Not used by the IDR form any more: the backend enforces the
// limits (US$1 minimum at the configured rate, maximum below) and returns the message.
export const MIN_DEPOSIT_IDR = 20000;
export const MAX_DEPOSIT_IDR = 10000000; // matches backend DEFAULT_MAX_IDR
