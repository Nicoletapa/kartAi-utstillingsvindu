/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// Convert to async IIFE (Immediately Invoked Function Expression)
(async () => {
  await import("./src/env.js");
})();

/** @type {import('next').NextConfig} */
const config = {
    output: 'standalone',
};

module.exports = config;
