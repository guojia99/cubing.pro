"use client";

import { createToaster, Toast, Toaster } from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
});

export function AppToaster() {
  return (
    <Toaster toaster={toaster}>
      {(toast) => (
        <Toast.Root>
          {toast.title ? <Toast.Title>{toast.title}</Toast.Title> : null}
          {toast.description ? (
            <Toast.Description>{toast.description}</Toast.Description>
          ) : null}
          <Toast.CloseTrigger />
        </Toast.Root>
      )}
    </Toaster>
  );
}
