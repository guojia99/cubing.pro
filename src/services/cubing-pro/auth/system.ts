import { AuthHeader } from "@/services/cubing-pro/auth/token";
import { unwrapOtherLinks } from "@/services/cubing-pro/otherLinksNormalize";
import type { OtherLinks, Thank } from "@/services/cubing-pro/public/types";
import { Request } from "@/services/cubing-pro/request";

export async function getAcknowledgmentsWithAdmin(): Promise<Thank[]> {
  const result = await Request.get<Thank[]>("/admin/system_result/acknowledgments", {
    headers: AuthHeader(),
  });
  return result.data ?? [];
}

export async function setAcknowledgmentsWithAdmin(req: Thank[]): Promise<void> {
  await Request.put("/admin/system_result/acknowledgments", req, {
    headers: AuthHeader(),
  });
}

export async function getOtherLinksWithAdmin(): Promise<OtherLinks> {
  const result = await Request.get<OtherLinks | OtherLinks[]>("/admin/system_result/otherLinks", {
    headers: AuthHeader(),
  });
  return unwrapOtherLinks(result.data);
}

export async function setOtherLinksWithAdmin(req: OtherLinks): Promise<void> {
  await Request.put("/admin/system_result/otherLinks", req, {
    headers: AuthHeader(),
  });
}
