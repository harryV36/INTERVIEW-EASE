// cleanup-orgs.mjs
// Run once: node cleanup-orgs.mjs
// Lists all organizations and lets you verify the state

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const orgs = await db.collection("organizations").find({}).toArray();

  if (orgs.length === 0) {
    console.log("ℹ️  No organizations in database.");
  } else {
    console.log(`Found ${orgs.length} organization(s):`);
    orgs.forEach((o, i) => {
      console.log(`  ${i + 1}. name="${o.name}" email="${o.email}" ownerId="${o.ownerId}" members=${o.members?.length || 0}`);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
