import { randomUUID } from "node:crypto";
import { usage } from "./mongo";

function today() { return new Date().toISOString().slice(0, 10); }

export async function recordUsage(userId: string, input: { tokens: number; computeSeconds: number; apiCalls: number }) {
  const collection = await usage();
  const now = new Date();
  await collection.updateOne({ userId, date: today() }, { $setOnInsert: { _id: randomUUID(), userId, date: today(), agentRunTokens: 0, computeMinutes: 0, apiCalls: 0, costUSD: "0", createdAt: now }, $inc: { agentRunTokens: input.tokens, computeMinutes: Math.ceil(input.computeSeconds / 60), apiCalls: input.apiCalls }, $set: { updatedAt: now } }, { upsert: true });
}

export async function getUsageSummary(userId: string) {
  const documents = await (await usage()).find({ userId }).sort({ date: -1 }).limit(90).toArray();
  return documents.reduce((summary, item) => ({ creditsUsed: summary.creditsUsed + item.agentRunTokens, creditsTotal: summary.creditsTotal, computeUsed: summary.computeUsed + item.computeMinutes, computeTotal: summary.computeTotal, apiCalls: summary.apiCalls + item.apiCalls, costUSD: (Number(summary.costUSD) + Number(item.costUSD)).toFixed(6), resetDate: summary.resetDate }), { creditsUsed: 0, creditsTotal: Number(process.env.DEFAULT_CREDITS ?? 0), computeUsed: 0, computeTotal: Number(process.env.DEFAULT_COMPUTE_MINUTES ?? 0), apiCalls: 0, costUSD: "0.000000", resetDate: process.env.USAGE_RESET_DATE ?? null });
}
