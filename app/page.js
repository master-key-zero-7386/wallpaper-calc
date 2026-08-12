"use client";

import dynamic from "next/dynamic";

const WallpaperCalcApp = dynamic(() => import("../components/WallpaperCalcApp"), {
  ssr: false,
});

export default function Page() {
  return <WallpaperCalcApp />;
}
