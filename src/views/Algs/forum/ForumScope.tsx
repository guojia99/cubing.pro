"use client";

import { Badge, Button, Dialog, Portal } from "@chakra-ui/react";
import { LuMessageCircle } from "react-icons/lu";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { getForumCounts, type ForumCounts, type ForumKind } from "@/services/cubing-pro/algs/forum";
import { ForumThread, type OpenThread } from "./ForumThread";
import { consumeForumLoginResume } from "./forumResume";
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

export function ForumScope({ children, cube, classId, resumeReady = true, onNavigateLibrary }: {
  children: ReactNode; cube?: string; classId?: string; resumeReady?: boolean; onNavigateLibrary?: () => void;
}) {
  const [thread, setThread] = useState<OpenThread | null>(null);
  const { currentUser } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (!currentUser?.id || !resumeReady || !pathname) return;
    const payload = consumeForumLoginResume(pathname);
    if (payload) setThread(payload.thread);
  }, [currentUser?.id, pathname, resumeReady]);
  const positioner = useRef<HTMLDivElement>(null);
  const isOpen = thread !== null;
  useEffect(() => {
    if (!isOpen || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const resize = () => {
      positioner.current?.style.setProperty("--forum-viewport-height", `${viewport.height}px`);
      positioner.current?.style.setProperty("--forum-viewport-top", `${viewport.offsetTop}px`);
    };
    resize();
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
    };
  }, [isOpen]);
  const [version, refresh] = useReducer((value: number) => value + 1, 0);
  const load = useCallback((signal: AbortSignal) => cube && classId
    ? getForumCounts(cube, classId, signal) : Promise.resolve(undefined), [cube, classId]);
  const { data: counts } = useForumQuery(load, version);

  return <ForumContext.Provider value={{ counts, open: setThread, version, refresh }}>
    {children}
    <Dialog.Root open={thread !== null} lazyMount unmountOnExit placement={{ base: "bottom", md: "center" }} scrollBehavior="inside"
      size="lg" onOpenChange={({ open }) => { if (!open) setThread(null); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner ref={positioner} height="var(--forum-viewport-height, 100dvh)"
          top="var(--forum-viewport-top, 0px)" px={{ base: "2", md: "4" }}
          pb={{ base: "max(8px, env(safe-area-inset-bottom))", md: "0" }}>
          <Dialog.Content data-testid="forum-dialog" my="0" minH="0"
            maxH="min(85dvh, calc(var(--forum-viewport-height, 100dvh) - 24px))"
            borderRadius="xl" overflow="hidden">
            {thread && <ForumThread key={`${thread.kind}/${thread.id}/${thread.commentId ?? ""}/${thread.notificationId ?? ""}`}
              thread={thread} currentCube={cube} currentClassId={classId}
              onNavigateLibrary={onNavigateLibrary} onChange={refresh} onClose={() => setThread(null)} />}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  </ForumContext.Provider>;
}

export function DiscussionButton({ kind, id }: { kind: Exclude<ForumKind, "class">; id: string }) {
  const { t } = useI18n();
  const { counts, open } = useFormulaForum();
  const count = counts && ((kind === "group" ? counts.groups : counts.solutions)[id] ?? 0);
  return <Button variant="outline" colorPalette="brand" size="xs" flexShrink={0}
    borderColor="colorPalette.border" bg={kind === "group" ? "colorPalette.subtle" : undefined}
    color="colorPalette.fg" maxW="full" height="auto" minH="8" py="1" whiteSpace="normal" onClick={() => open({ kind, id })}>
    <LuMessageCircle aria-hidden="true" />
    {t(kind === "group" ? "forum.group" : "forum.solution")}
    {count !== undefined && count > 0 && <Badge colorPalette="brand" size="sm">{count}</Badge>}
  </Button>;
}

export function EgDiscussionButton() {
  const { version } = useFormulaForum();
  const load = useCallback((signal: AbortSignal) => getForumCounts("222", "EG", signal), []);
  const { data: counts } = useForumQuery(load, version);
  return <ClassDiscussionButton className="EG" counts={counts} origin="library" />;
}

export function ClassDiscussionButton({ className, counts: explicitCounts, origin }: {
  className: string; counts?: ForumCounts; origin?: OpenThread["origin"];
}) {
  const { tf } = useI18n();
  const { counts: scopeCounts, open } = useFormulaForum();
  const counts = origin === "library" ? explicitCounts : scopeCounts;
  if (!counts?.classId) return null;
  const id = counts.classId;
  return <Button variant="outline" colorPalette="brand" size="sm" flexShrink={0}
    borderColor="colorPalette.border" bg="colorPalette.subtle" color="colorPalette.fg"
    maxW="full" height="auto" minH="9" py="1" whiteSpace="normal"
    aria-label={tf("forum.classScope", { className })}
    onClick={() => open({ kind: "class", id, origin })}>
    <LuMessageCircle aria-hidden="true" />
    {tf("forum.class", { className })}
    {counts.classCount !== undefined && counts.classCount > 0 && <Badge colorPalette="brand" size="sm">{counts.classCount}</Badge>}
  </Button>;
}
