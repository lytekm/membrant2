# Shared client boundary

`Repository` has two implementations: device-local demo storage and authenticated HTTP. `MembrantProvider` owns hydration, sessions, refresh, conflict recovery and save state. Pass stable `StorageAdapter` instances to the provider; mobile uses AsyncStorage for demo data and SecureStore for the session.

Use `dispatch(command)` for every mutation, and handle its rejection in the form. It resolves only after persistence succeeds. A read-only snapshot is available through `useMembrant().state`. UI components remain platform-specific.

This is the primary adapter boundary for the user's existing backend. See the [API contract](../../docs/mvp/api.md) and [architecture](../../docs/mvp/architecture.md).
