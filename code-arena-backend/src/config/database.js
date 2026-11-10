import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to the backend .env file.");
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function connectDatabase() {
  await prisma.$connect();
  console.info("Connected to PostgreSQL.");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}