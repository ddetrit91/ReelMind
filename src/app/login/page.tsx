export const instant = false;

import { AuthScreen } from "@/components/AuthScreen";
import { redirectIfAuthenticated } from "@/lib/auth/actions";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/";
  await redirectIfAuthenticated(nextPath);
  return <AuthScreen mode="login" nextPath={nextPath} />;
}
