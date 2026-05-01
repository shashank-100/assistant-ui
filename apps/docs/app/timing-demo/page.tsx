"use client";

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessageTiming,
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunOptions,
} from "@assistant-ui/react";
import { Bot, SendHorizontal, Square, Loader2, Clock } from "lucide-react";
import { useState, type FC } from "react";

const MOCK_RESPONSES = [
  "Hello! I'm a mock assistant that simulates streaming so you can see timing metrics in action. Each response generates fake streaming data character by character.",
  "The timing badge shows total stream duration, tokens per second, and time-to-first-token (TTFT). All of this is tracked client-side using the `useMessageTiming()` hook.",
  "This demo works with any runtime that implements timing support: AI SDK, LangGraph, AG-UI, OpenCode, DataStream, and LocalRuntime. Try sending another message!",
  "Message timing data is attached via `metadata.timing` on assistant messages. The hook reads this from the message context and renders it in the action bar footer.",
  "assistant-ui composes primitives — `MessagePrimitive.Root` provides the context, `useMessageTiming()` reads it, and you render it however you want. This badge is just a pill with monospace text.",
];

let responseIndex = 0;

function makeMockAdapter(delayMs: number): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      const text = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length] ?? "";
      responseIndex++;

      const startTime = Date.now();
      const tokens: string[] = [];
      let i = 0;
      let nextChunkDeadline = startTime;

      while (i < text.length) {
        if (abortSignal?.aborted) break;

        const chunkSize = Math.min(
          Math.floor(Math.random() * 5) + 2,
          text.length - i,
        );
        const chunk = text.slice(i, i + chunkSize);
        tokens.push(chunk);
        i += chunkSize;

        yield {
          content: [{ type: "text" as const, text: tokens.join("") }],
        };

        nextChunkDeadline += delayMs + Math.random() * delayMs * 0.5;
        const wait = nextChunkDeadline - Date.now();
        if (wait > 0) {
          await new Promise((r) => setTimeout(r, wait));
        }
      }

      const totalStreamTime = Date.now() - startTime;
      const totalTokens = Math.ceil(text.length / 4);

      yield {
        content: [{ type: "text" as const, text }],
        metadata: {
          usage: {
            promptTokens: messages.length * 10,
            completionTokens: totalTokens,
            totalTokens: messages.length * 10 + totalTokens,
          },
          timing: {
            streamStartTime: startTime,
            totalStreamTime,
            tokenCount: totalTokens,
            tokensPerSecond: totalTokens / (totalStreamTime / 1000),
            totalChunks: tokens.length,
            toolCallCount: 0,
          },
        },
      };
    },
  };
}

const MessageTimingBadge: FC = () => {
  const timing = useMessageTiming();
  if (!timing?.totalStreamTime) return null;

  const formatMs = (ms: number) =>
    ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <Clock className="size-3" />
      <span>{formatMs(timing.totalStreamTime)}</span>
      {timing.tokensPerSecond != null && (
        <>
          <span className="opacity-50">·</span>
          <span>{timing.tokensPerSecond.toFixed(1)} tok/s</span>
        </>
      )}
      {timing.firstTokenTime != null && (
        <>
          <span className="opacity-50">·</span>
          <span>TTFT {Math.round(timing.firstTokenTime)}ms</span>
        </>
      )}
    </div>
  );
};

const UserMessage: FC = () => (
  <MessagePrimitive.Root className="flex justify-end">
    <div className="max-w-[85%] rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root className="flex gap-3" data-role="assistant">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
      <Bot className="size-4 text-zinc-500 dark:text-zinc-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-sm text-zinc-800 leading-relaxed dark:text-zinc-200">
        <MessagePrimitive.Parts />
        <MessagePrimitive.If hasContent={false}>
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-xs">Thinking...</span>
          </div>
        </MessagePrimitive.If>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <MessageTimingBadge />
      </div>
    </div>
  </MessagePrimitive.Root>
);

export default function TimingDemoPage() {
  const [delay, setDelay] = useState(30);
  const [adapter, setAdapter] = useState(() => makeMockAdapter(30));

  const runtime = useLocalRuntime(adapter);

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="font-semibold text-base">Message Timing Demo</h1>
          <p className="text-muted-foreground text-xs">
            Mock streaming adapter — no API keys needed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Delay:</span>
            <input
              type="range"
              min={5}
              max={100}
              value={delay}
              onChange={(e) => {
                const newDelay = Number(e.target.value);
                setDelay(newDelay);
                setAdapter(() => makeMockAdapter(newDelay));
              }}
              className="w-24"
            />
            <span className="font-mono text-xs text-zinc-400">{delay}ms</span>
          </div>
        </div>
      </div>

      <AssistantRuntimeProvider runtime={runtime}>
        <ThreadPrimitive.Root className="flex flex-1 flex-col overflow-hidden">
          <ThreadPrimitive.Viewport className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-6">
            <ThreadPrimitive.Empty>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <Clock className="size-8 text-zinc-300" />
                <p className="font-medium text-sm">Timing Demo</p>
                <p className="text-muted-foreground text-xs">
                  Send a message to see streaming metrics
                </p>
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{ UserMessage, AssistantMessage }}
            />
          </ThreadPrimitive.Viewport>

          <div className="border-t px-4 py-3">
            <ComposerPrimitive.Root>
              <div className="flex items-end gap-2 rounded-xl border bg-zinc-50 px-3 py-2 focus-within:ring-2 focus-within:ring-zinc-200 dark:bg-zinc-900 dark:focus-within:ring-zinc-700">
                <ComposerPrimitive.Input
                  placeholder="Type a message..."
                  className="min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  rows={1}
                />
                <ThreadPrimitive.If running={false}>
                  <ComposerPrimitive.Send className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700">
                    <SendHorizontal className="size-4" />
                  </ComposerPrimitive.Send>
                </ThreadPrimitive.If>
                <ThreadPrimitive.If running={true}>
                  <ComposerPrimitive.Cancel className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700">
                    <Square className="size-3.5 fill-current" />
                  </ComposerPrimitive.Cancel>
                </ThreadPrimitive.If>
              </div>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </AssistantRuntimeProvider>
    </div>
  );
}
