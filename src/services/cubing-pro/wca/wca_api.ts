import type { WcaProfilePerson } from "@/services/cubing-pro/wca/types";
import { ClientMessageError } from "../clientError";

async function fetchWithRetry<T>(
  url: string,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 404) {
        throw new Error("404");
      }

      if (!response.ok) {
        throw new ClientMessageError("shared.error.http", { status: response.status });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.message === "404") {
        throw error;
      }

      if (attempt < retries) {
        await new Promise((res) => {
          setTimeout(res, delayMs);
        });
      } else {
        throw error;
      }
    }
  }
  throw new ClientMessageError("shared.error.unknown");
}

export async function apiGetWCAPersonProfile(
  wcaID: string,
): Promise<WcaProfilePerson> {
  if (wcaID.length !== 10) throw new ClientMessageError("shared.error.wcaId");
  const url = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}`;
  return fetchWithRetry<WcaProfilePerson>(url);
}
