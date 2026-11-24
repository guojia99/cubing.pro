import { Request } from "./request";
import { AuthHeader } from "./auth/token";
export type CardTemplate = "classic" | "motion";
export type CubeCard = { id: number; title: string; template: CardTemplate; createdAt: string };
const endpoint = "/user/cube-cards";
export async function saveCubeCard(title: string, png: Blob, template: CardTemplate) {
  if (png.size > 7 * 1024 * 1024) throw new Error("Card PNG exceeds 7 MiB");
  const form = new FormData();
  form.append("title", Array.from(title.trim() || "小卡").slice(0, 80).join(""));
  form.append("png", png, "card.png");
  form.append("template", template);
  return (await Request.post<{ data: CubeCard }>(endpoint, form, { headers: AuthHeader() })).data.data;
}
export async function listCubeCards(page: number, signal?: AbortSignal) {
  return (await Request.get<{ data: { items: CubeCard[]; total: number; page: number } }>(endpoint, { params: { page, size: 20 }, headers: AuthHeader(), signal })).data.data;
}
export async function cubeCardImage(id: number, signal?: AbortSignal) {
  return (await Request.get<Blob>(`${endpoint}/${encodeURIComponent(id)}/image`, { headers: AuthHeader(), responseType: "blob", signal })).data;
}
export async function deleteCubeCard(id: number) {
  await Request.delete(`${endpoint}/${encodeURIComponent(id)}`, { headers: AuthHeader() });
}
