import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Service worker: uygulamayı telefona kurulabilir (PWA) yapar,
  // statik varlıkları önbelleğe alıp çevrimdışı açılışı hızlandırır.
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
