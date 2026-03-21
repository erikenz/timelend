import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://localhost:3000"],
  turbopack: {
    root: fileURLToPath(new URL("../../", import.meta.url)),
  },
};

export default nextConfig;
