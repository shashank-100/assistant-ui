"use client";

import { useEffect, useRef, useState } from "react";
import type { LangChainMessage } from "./types";
import type { MessageTiming } from "@assistant-ui/core";

type TrackingState = {
  messageId: string;
  startTime: number;
  firstTokenTime?: number;
  lastContentLength: number;
  totalChunks: number;
};

function getAssistantTextLength(messages: readonly LangChainMessage[]): number {
  let len = 0;
  for (const m of messages) {
    if (m.type !== "ai") continue;
    const content = m.content;
    if (typeof content === "string") {
      len += content.length;
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if ("text" in part && typeof part.text === "string") {
          len += part.text.length;
        }
        if ("thinking" in part && typeof part.thinking === "string") {
          len += part.thinking.length;
        }
      }
    }
  }
  return len;
}

function getAssistantToolCallCount(
  messages: readonly LangChainMessage[],
): number {
  let count = 0;
  for (const m of messages) {
    if (m.type !== "ai") continue;
    const toolCalls = m.tool_calls;
    if (toolCalls) count += toolCalls.length;
  }
  return count;
}

function getLastAssistantId(
  messages: readonly LangChainMessage[],
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.type === "ai" && messages[i]?.id) {
      return messages[i]!.id;
    }
  }
  return undefined;
}

export const useLangGraphStreamingTiming = (
  messages: readonly LangChainMessage[],
  isRunning: boolean,
): Record<string, MessageTiming> => {
  const [timings, setTimings] = useState<Record<string, MessageTiming>>({});
  const trackRef = useRef<TrackingState | null>(null);

  useEffect(() => {
    const lastId = getLastAssistantId(messages);

    if (isRunning && lastId) {
      if (!trackRef.current || trackRef.current.messageId !== lastId) {
        trackRef.current = {
          messageId: lastId,
          startTime: Date.now(),
          lastContentLength: 0,
          totalChunks: 0,
        };
      }

      const t = trackRef.current;
      const len = getAssistantTextLength(messages);
      if (len > t.lastContentLength) {
        if (t.firstTokenTime === undefined) {
          t.firstTokenTime = Date.now() - t.startTime;
        }
        t.totalChunks++;
        t.lastContentLength = len;
      }
    } else if (!isRunning && trackRef.current) {
      const t = trackRef.current;
      const totalStreamTime = Date.now() - t.startTime;
      const tokenCount = Math.ceil(t.lastContentLength / 4);
      const toolCallCount = getAssistantToolCallCount(messages);

      const timing: MessageTiming = {
        streamStartTime: t.startTime,
        totalStreamTime,
        totalChunks: t.totalChunks,
        toolCallCount,
        ...(t.firstTokenTime !== undefined && {
          firstTokenTime: t.firstTokenTime,
        }),
        ...(tokenCount > 0 && { tokenCount }),
        ...(totalStreamTime > 0 &&
          tokenCount > 0 && {
            tokensPerSecond: tokenCount / (totalStreamTime / 1000),
          }),
      };
      setTimings((prev) => ({ ...prev, [t.messageId]: timing }));
      trackRef.current = null;
    }
  }, [messages, isRunning]);

  return timings;
};
