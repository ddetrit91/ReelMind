import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReelMind",
    short_name: "ReelMind",
    description: "Сохранения по категориям: Instagram, YouTube и любые ссылки",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0f",
    theme_color: "#eef1f8",
    lang: "ru",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
