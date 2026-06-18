import type { MetadataRoute } from "next";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PontoLab",
    short_name: "PontoLab",
    description:
      "Sistema de gestão de apontamentos, horas e produtividade.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f0f8ff",
    theme_color: "#38a8d8",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      ...ICON_SIZES.map((size) => ({
        src: `/icons/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/icons/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable" as const,
      },
    ],
    shortcuts: [
      {
        name: "Novo Registro",
        short_name: "Registro",
        description: "Lançar um novo registro de horas",
        url: "/registros?new=1",
      },
      {
        name: "Timer",
        short_name: "Timer",
        description: "Abrir o timer de trabalho",
        url: "/timer",
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard",
      },
    ],
  };
}
