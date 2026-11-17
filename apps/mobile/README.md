# Mobile daily companion

Expo SDK 55 / React Native 0.83. Native views, safe areas, platform keyboard handling, Ionicons, SecureStore sessions and success haptics. The app has four destinations: Today, Goals, Journey and You. Modal sheets keep check-ins and lightweight creation close to the daily flow.

`src/components/ui.tsx` defines shared native primitives and semantic light/dark colors. Features remain platform-specific while `@membrant/core` and `@membrant/client` share the behavior and backend.

From the root: `npm run dev:mobile`. For web preview: `npm run web --workspace @membrant/mobile`. For all production JS/asset bundles: `npm run export --workspace @membrant/mobile`.

See the [root README](../../README.md#start-the-mobile-app) for SDK compatibility and physical-phone networking. The browser preview is a verification tool for this companion, not a replacement for the separate Vite app.
