import { AuthHeader } from "./auth/token";
import { getAPIUrl, Request, type ApiRequestConfig } from "./request";

export type AdvertisementImage = { imageUrl: string; caption: string; href?: string };
export type Advertisement = {
  key: string;
  title: string;
  description: string;
  contact: string;
  imageUrl: string;
  targetUrl: string;
  duration: number;
  enabled: boolean;
  products: AdvertisementImage[];
  showcase: AdvertisementImage[];
};
export type AdvertisementUpload = { uid: string; url: string; width: number; height: number };

export async function getPublicAdvertisements(config: ApiRequestConfig = {}): Promise<Advertisement[]> {
  const result = await Request.get<Advertisement[]>("/public/advertisements", config);
  if (!Array.isArray(result.data)) throw new Error("Invalid advertisements response");
  return result.data;
}

export async function getAdminAdvertisements(): Promise<Advertisement[]> {
  const result = await Request.get<Advertisement[]>("/admin/system_result/advertisements", { headers: AuthHeader() });
  if (!Array.isArray(result.data)) throw new Error("Invalid advertisements response");
  return result.data;
}

export async function saveAdvertisements(items: Advertisement[]): Promise<void> {
  await Request.put("/admin/system_result/advertisements", items, { headers: AuthHeader() });
}

export async function uploadAdvertisementImage(file: File): Promise<AdvertisementUpload> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Cannot read image"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
  const result = await Request.post<{ data: AdvertisementUpload }>("/admin/system_result/advertisements/image", { ImageName: file.name, Data: data }, { headers: AuthHeader() });
  return result.data.data;
}

export function resolveAdvertisementImage(url: string): string {
  // Uploaded images belong to the API host, including static previews on another origin.
  const prefix = "/v3/cube-api/";
  return url.startsWith(prefix) ? `${getAPIUrl().replace(/\/$/, "")}/${url.slice(prefix.length)}` : url;
}
