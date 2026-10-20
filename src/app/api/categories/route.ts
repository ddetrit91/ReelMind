import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { listCategoriesWithCounts } from "@/lib/data/items";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await listCategoriesWithCounts(user.id);
  return NextResponse.json({ categories });
}
