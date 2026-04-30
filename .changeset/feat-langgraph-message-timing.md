---
"@assistant-ui/react-langgraph": patch
---

feat: add message timing support for LangGraph runtime

Added `useLangGraphStreamingTiming` hook to track streaming metrics (total stream time, tokens per second, TTFT) on LangGraph messages. Timing data is now available via `useMessageTiming()` when using the LangGraph runtime.
