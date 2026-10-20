import { headers } from "next/headers";

export type RequestMeta = {
  ip: string;
  userAgent: string;
  city: string;
};

export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  const userAgent = h.get("user-agent") || "unknown";
  const city = h.get("x-vercel-ip-city") || h.get("cf-ipcity") || h.get("cf-ipcountry") || "—";
  return { ip, userAgent, city: decodeURIComponent(city) };
}
