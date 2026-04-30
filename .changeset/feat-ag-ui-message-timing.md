---
"@assistant-ui/react-ag-ui": patch
---

feat: add message timing support for AG-UI runtime

Timing data (`totalStreamTime`, `tokensPerSecond`, `firstTokenTime`) is now tracked and emitted via `metadata.timing` on assistant messages. Available via `useMessageTiming()` when using the AG-UI runtime.
