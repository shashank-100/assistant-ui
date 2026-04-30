---
"@assistant-ui/react-opencode": patch
---

feat: add message timing support for OpenCode runtime

Added `useOpenCodeStreamingTiming` hook to track streaming metrics (total stream time, tokens per second, TTFT) on OpenCode messages. Timing data is now available via `useMessageTiming()` when using the OpenCode runtime.
