import { db } from "@workspace/db";
import { createUser } from "../services/db";
import { hashPassword, generateId, generateToken } from "../lib/crypto";

/**
 * Initialize database with seed data
 * Run: node scripts/seed-db.mjs
 */

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Create sample user
    console.log("Creating sample user...");
    const sampleUser = await createUser({
      email: "demo@fireboxai.dev",
      name: "Alex Morgan",
      password: await hashPassword("demo123"), // In production, change this!
      plan: "pro",
      credits: "500",
    });

    console.log(`✅ Created user: ${sampleUser.email}`);

    // Create sample projects (migrating from hardcoded data)
    const { createProject } = await import("../services/db");

    console.log("Creating sample projects...");

    const projectSummit = await createProject({
      userId: sampleUser.id,
      name: "Summit Commerce",
      description: "A headless commerce storefront with a clean checkout flow.",
      slug: "summit-commerce",
      source: "github",
      repository: "github.com/ava/summit-commerce",
      status: "running",
      framework: "Next.js",
      language: "TypeScript",
      runtime: "Node.js 20",
      packageManager: "pnpm",
      buildTool: "Turbopack",
      devCommand: "pnpm dev",
      buildCommand: "pnpm build",
      startCommand: "pnpm start",
      color: "#7c5cff",
    });

    const projectOrbit = await createProject({
      userId: sampleUser.id,
      name: "Orbit Analytics",
      description: "An internal analytics workspace for product teams.",
      slug: "orbit-analytics",
      source: "prompt",
      status: "ready",
      framework: "React + Vite",
      language: "TypeScript",
      runtime: "Node.js 20",
      packageManager: "npm",
      buildTool: "Vite",
      devCommand: "npm run dev",
      buildCommand: "npm run build",
      startCommand: "npm run preview",
      color: "#f0a34a",
    });

    const projectAtlas = await createProject({
      userId: sampleUser.id,
      name: "Atlas API",
      description: "A Python API imported from a local archive.",
      slug: "atlas-api",
      source: "zip",
      status: "needs-setup",
      framework: "FastAPI",
      language: "Python",
      runtime: "Python 3.12",
      packageManager: "pip",
      buildTool: "uvicorn",
      devCommand: "uvicorn app:app --reload",
      buildCommand: "python -m compileall .",
      color: "#35b997",
    });

    console.log(`✅ Created ${3} sample projects`);

    // Record initial usage
    const { recordUsage } = await import("../services/db");

    console.log("Recording initial usage...");
    await recordUsage({
      userId: sampleUser.id,
      date: new Date().toISOString().split("T")[0] as any,
      agentRunTokens: 0,
      computeMinutes: 0,
      apiCalls: 0,
      costUSD: "0",
    });

    console.log("✅ Recorded initial usage");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📝 Sample user credentials:");
    console.log(`   Email: demo@fireboxai.dev`);
    console.log(`   Password: demo123`);
    console.log("\n⚠️  Change these credentials in production!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedDatabase();
