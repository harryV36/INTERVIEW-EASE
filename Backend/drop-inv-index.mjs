// drop-inv-index.mjs
// Run once: node drop-inv-index.mjs
// This drops the broken unique sparse index on organizations.invitations.token

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error("❌ No MONGO_URL found in .env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const collection = db.collection("organizations");

  try {
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));

    // Drop the problematic unique index on invitations.token
    const targetIndex = indexes.find(
      (i) => i.key && i.key["invitations.token"] !== undefined
    );

    if (targetIndex) {
      await collection.dropIndex(targetIndex.name);
      console.log(`✅ Dropped index: ${targetIndex.name}`);
    } else {
      console.log("ℹ️  No invitations.token unique index found — already clean.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Done. You can now restart your backend normally.");
  }
}

run();
