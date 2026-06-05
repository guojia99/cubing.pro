import { Request } from "@/services/cubing-pro/request";
import { unwrapOtherLinks } from "@/services/cubing-pro/otherLinksNormalize";
import type { OtherLinks, Thank } from "@/services/cubing-pro/public/types";

export async function getAcknowledgments(): Promise<Thank[]> {
  const response = await Request.get<Thank[]>("/public/acknowledgments");
  return response.data ?? [];
}

export async function getOtherLinks(): Promise<OtherLinks> {
  const response = await Request.get<OtherLinks | OtherLinks[]>("/public/otherLinks");
  return unwrapOtherLinks(response.data);
}
