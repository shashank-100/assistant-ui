"use client";

import type React from "react";
import type { ThreadMessageLike } from "@assistant-ui/react";
import type { AppendMessage } from "@assistant-ui/react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  ExportedMessageRepository,
} from "@assistant-ui/react";

const convertMessage = (message: ThreadMessageLike) => {
  return message;
};

const INITIAL_REPOSITORY = ExportedMessageRepository.fromBranchableArray([
  {
    parentId: null,
    message: {
      id: "user-1",
      role: "user",
      content: [{ type: "text", text: "What is the capital of France?" }],
    },
  },
  {
    parentId: "user-1",
    message: {
      id: "assistant-1a",
      role: "assistant",
      content: [{ type: "text", text: "The capital of France is Paris." }],
    },
  },
  {
    parentId: "user-1",
    message: {
      id: "assistant-1b",
      role: "assistant",
      content: [
        {
          type: "text",
          text: "Paris is the capital and largest city of France.",
        },
      ],
    },
  },
]);

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const onNew = async (_message: AppendMessage) => {
    // no-op for testing
  };

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messageRepository: INITIAL_REPOSITORY,
    onNew,
    convertMessage,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
