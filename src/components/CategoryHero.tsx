"use client";

import { useState } from "react";

import { categoryColor, categoryCoverUrl } from "@/lib/categories";

type Props = {
  slug: string;
  name: string;
  emoji: string;
  itemCount: number;
};

export function CategoryHero({ slug, name, emoji, itemCount }: Props) {
  const [broken, setBroken] = useState(false);
  const cover = categoryCoverUrl(slug);
  const color = categoryColor(slug);

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-[var(--radius-md)] lg:mb-5"
      style={
        broken
          ? {
              background: `linear-gradient(135deg, ${color}cc 0%, ${color}66 45%, #0c0e14 100%)`,
            }
          : undefined
      }
    >
      {!broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          decoding="async"
          className="h-28 w-full object-cover lg:h-36"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="h-28 w-full lg:h-36" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4">
        <p className="font-display text-lg font-semibold text-white lg:text-xl">
          <span aria-hidden className="mr-2">
            {emoji}
          </span>
          {name}
        </p>
        <p className="mt-0.5 text-xs text-white/80 lg:text-sm">
          {itemCount} сохранений в этом разделе
        </p>
      </div>
    </div>
  );
}
