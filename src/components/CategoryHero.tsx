import { categoryCoverUrl } from "@/lib/categories";

type Props = {
  slug: string;
  name: string;
  emoji: string;
  itemCount: number;
};

export function CategoryHero({ slug, name, emoji, itemCount }: Props) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-[var(--radius-lg)] lg:mb-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={categoryCoverUrl(slug)}
        alt=""
        className="h-36 w-full object-cover lg:h-48"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
        <p className="font-display text-xl font-semibold text-white lg:text-2xl">
          <span aria-hidden className="mr-2">
            {emoji}
          </span>
          {name}
        </p>
        <p className="mt-1 text-sm text-white/80">{itemCount} сохранений в этом разделе</p>
      </div>
    </div>
  );
}
