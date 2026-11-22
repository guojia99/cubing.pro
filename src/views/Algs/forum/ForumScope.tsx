"use client";

import { Button, Dialog, Portal } from "@chakra-ui/react";
import { createContext, useCallback, useContext, useReducer, useState, type ReactNode } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getForumCounts, type ForumCounts, type ForumKind } from "@/services/cubing-pro/algs/forum";
import { ForumThread, type OpenThread } from "./ForumThread";
import { useForumQuery } from "./forumUi";

const ForumContext = createContext<{
  counts?: ForumCounts;
  open: (target: OpenThread) => void;
  version: number;
  refresh: () => void;
} | null>(null);

export function useFormulaForum() {
  const context = useContext(ForumContext);
  if (!context) throw new Error("ForumScope is missing");
  return context;
}

export function ForumScope({ children, cube, classId }: { children: ReactNode; cube?: string; classId?: string }) {
  const [thread, setThread] = useState<OpenThread | null>(null);
  const [version, refresh] = useReducer((value: number) => value + 1, 0);
  const load = useCallback((signal: AbortSignal) => cube && classId
    ? getForumCounts(cube, classId, signal) : Promise.resolve(undefined), [cube, classId]);
  const { data: counts } = useForumQuery(load, version);

  return <ForumContext.Provider value={{ counts, open: setThread, version, refresh }}>
    {children}
    <Dialog.Root open={thread !== null} lazyMount unmountOnExit placement="center" scrollBehavior="inside"
      size={{ base: "full", md: "lg" }} onOpenChange={({ open }) => { if (!open) setThread(null); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="100dvh">
            {thread && <ForumThread key={`${thread.kind}/${thread.id}/${thread.commentId ?? ""}`}
              thread={thread} onChange={refresh} />}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  </ForumContext.Provider>;
}

export function DiscussionButton({ kind, id }: { kind: ForumKind; id: string }) {
  const { t } = useI18n();
  const { counts, open } = useFormulaForum();
  const count = counts && ((kind === "group" ? counts.groups : counts.solutions)[id] ?? 0);
  return <Button variant="ghost" colorPalette="brand" size="xs" flexShrink={0} onClick={() => open({ kind, id })}>
    {t(kind === "group" ? "forum.group" : "forum.discuss")}{count !== undefined && <span>{count}</span>}
  </Button>;
}
