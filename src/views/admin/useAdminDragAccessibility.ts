"use client";

import { useAdminManagement } from "./useAdminManagement";

export function useAdminDragAccessibility() {
  const m = useAdminManagement();
  return {
    screenReaderInstructions: { draggable: m("adminManagement.dragInstructions") },
    announcements: {
      onDragStart: () => m("adminManagement.dragStarted"),
      onDragOver: ({ over }: { over: unknown }) => m(over ? "adminManagement.dragOver" : "adminManagement.dragOutside"),
      onDragEnd: ({ over }: { over: unknown }) => m(over ? "adminManagement.dragEnded" : "adminManagement.dragCancelled"),
      onDragCancel: () => m("adminManagement.dragCancelled"),
    },
  };
}
