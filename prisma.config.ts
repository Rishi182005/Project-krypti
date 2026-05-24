import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://neondb_owner:npg_Z8NUdG0TiDqF@ep-little-resonance-aoi6xh3q.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  },
  migrations: {
    seed: "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
});