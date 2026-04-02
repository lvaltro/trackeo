// Empty PostCSS config for the backend.
// Prevents Vite/Vitest from traversing up to the root postcss.config.js
// which requires tailwindcss (frontend-only dependency).
module.exports = { plugins: {} };
