import type { WcaProfilePerson } from "@/services/cubing-pro/wca/types";

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
        throw new Error(`请求失败: ${response.status}`);
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
  throw new Error("未知错误");
}

export async function apiGetWCAPersonProfile(
  wcaID: string,
): Promise<WcaProfilePerson> {
  if (wcaID.length !== 10) throw new Error("WCAID错误");
  const url = `https://www.worldcubeassociation.org/api/v0/persons/${wcaID}`;
  return fetchWithRetry<WcaProfilePerson>(url);
}
