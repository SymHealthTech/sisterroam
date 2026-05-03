/**
 * Seed default promo codes into MongoDB.
 * Run once:  node scripts/seed-promo-codes.mjs
 * Safe to re-run — uses upsert, won't overwrite existing usage counts.
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load MONGODB_URI from .env.local
function loadEnv() {
  try {
    const env = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
    for (const line of env.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
  } catch {
    // .env.local missing — MONGODB_URI must already be in environment
  }
}

loadEnv();

const PromoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["brand_ambassador", "first_100"],
      required: true,
    },
    maxUses: { type: Number, required: true, default: 100 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        userEmail: String,
        usedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true },
);

const PromoCode =
  mongoose.models.PromoCode || mongoose.model("PromoCode", PromoCodeSchema);

const DEFAULT_CODES = [
  {
    code: "BRAND100",
    type: "brand_ambassador",
    maxUses: 100,
    notes: "Brand ambassador promo — free verified badge",
  },
  {
    code: "NEW100",
    type: "first_100",
    maxUses: 100,
    notes: "First 100 users promo code",
  },
];

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      "MONGODB_URI is not set. Add it to .env.local or your environment.",
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  for (const entry of DEFAULT_CODES) {
    const result = await PromoCode.findOneAndUpdate(
      { code: entry.code },
      { $setOnInsert: entry },
      { upsert: true, new: true },
    );
    const wasInserted =
      result.usedCount === 0 && result.createdAt >= new Date(Date.now() - 5000);
    console.log(
      `${wasInserted ? "✓ created" : "— already exists"}: ${entry.code} (${entry.type}, max ${entry.maxUses})`,
    );
  }

  console.log("\nDone! You can add more codes via POST /api/admin/promo-codes");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
