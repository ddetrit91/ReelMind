"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AddLinkForm } from "@/components/AddLinkForm";
import type { CategoryWithCount } from "@/lib/data/items";

type Props = {
  categories: CategoryWithCount[];
  initialUrl?: string;
  initialText?: string;
};

/**
 * Remount the add form on every visit to /add so soft-nav cache
 * does not keep the previous URL/note after a successful save.
 */
export function AddLinkFormHost({
  categories,
  initialUrl = "",
  initialText = "",
}: Props) {
  const pathname = usePathname();
  const [visitId, setVisitId] = useState(0);

  useEffect(() => {
    if (pathname !== "/add") return;
    setVisitId((n) => n + 1);
  }, [pathname]);

  const formKey = `${visitId}|${initialUrl}|${initialText}`;

  return (
    <AddLinkForm
      key={formKey}
      formKey={formKey}
      categories={categories}
      initialUrl={initialUrl}
      initialText={initialText}
    />
  );
}
