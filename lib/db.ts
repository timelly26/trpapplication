
import { PrismaClient } from "@prisma/client";

// Prefer DATABASE_URL (port 6543, transaction pooler) for runtime - better for serverless and avoids
// connection resets. Use DIRECT_URL only for migrations (schema directUrl).
const base = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!base) {
  console.error("DATABASE_URL or DIRECT_URL environment variable is not set");
}

function withParam(url: string, key: string, value: string) {
  if (!url) return url;
  const hasQuery = url.includes("?");
  const encodedKey = `${key}=`;
  if (url.includes(encodedKey)) return url;
  return `${url}${hasQuery ? "&" : "?"}${key}=${value}`;
}

let connectionString = base || "";
if (connectionString) {
  connectionString = withParam(connectionString, "statement_timeout", "120000");
  // Default was 3 and exhausted quickly with concurrent API + NextAuth JWT work.
  // Override with PRISMA_CONNECTION_LIMIT in .env if your host requires a specific cap.
  const poolLimit = process.env.PRISMA_CONNECTION_LIMIT || "15";
  if (!connectionString.includes("connection_limit=")) {
    connectionString = withParam(connectionString, "connection_limit", poolLimit);
  }
  connectionString = withParam(connectionString, "pool_timeout", "30");
  connectionString = withParam(connectionString, "connect_timeout", "15");
}

const prismaClientSingleton = () => {
  if (!connectionString) {
    throw new Error("Database connection string is not configured");
  }
  return new PrismaClient({
    datasourceUrl: connectionString,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// In serverless environments (like Vercel), we still want to reuse the connection
// but we need to handle it differently. The globalThis check works in both dev and production.
if (!globalThis.prismaGlobal) {
  globalThis.prismaGlobal = prisma;
}