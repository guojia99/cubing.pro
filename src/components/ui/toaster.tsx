"use client";

import { createToaster, Spinner, Stack, Toast, Toaster } from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
});

export function AppToaster() {
  return (
    <Toaster toaster={toaster}>
      {(toast) => (
        <Toast.Root
          width={{ base: "calc(100vw - 2rem)", md: "sm" }}
          minW="280px"
          maxW="sm"
        >
          {toast.type === "loading" ? (
            <Spinner size="sm" color="blue.solid" />
          ) : (
            <Toast.Indicator />
          )}
          <Stack gap="1" flex="1" maxW="100%" minW="0">
            {toast.title ? <Toast.Title>{toast.title}</Toast.Title> : null}
            {toast.description ? (
              <Toast.Description>{toast.description}</Toast.Description>
            ) : null}
          </Stack>
          {toast.closable !== false ? <Toast.CloseTrigger /> : null}
        </Toast.Root>
      )}
    </Toaster>
  );
}
