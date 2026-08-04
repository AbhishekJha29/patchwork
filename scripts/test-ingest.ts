/**
 * Test script for Patchwork Ingestion Pipeline & AI Triage (Phase 4)
 *
 * Usage:
 *   npx tsx scripts/test-ingest.ts [API_KEY] [API_URL]
 */

import { PrismaClient } from "@prisma/client";

async function main() {
  const apiKeyArg = process.argv[2];
  let apiKey = apiKeyArg;
  const baseUrl = process.argv[3] || "http://localhost:3000";

  // If no API key passed via command line, attempt to retrieve one from the database
  if (!apiKey) {
    console.log("🔍 No API key provided as command line argument. Searching DB for an active key...");
    const prisma = new PrismaClient();
    try {
      const dbKey = await prisma.apiKey.findFirst({
        where: { revoked: false },
        orderBy: { createdAt: "desc" },
      });
      if (dbKey) {
        apiKey = dbKey.key;
        console.log(`✅ Found active API key in DB for project '${dbKey.projectId}'!`);
      }
    } catch (err: any) {
      console.warn("⚠️ Could not query DB for API key:", err.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  if (!apiKey) {
    console.error(`
❌ Error: No API key available!
Please provide an API key as an argument, or generate one in the Settings -> API Keys tab.

Usage:
  npx tsx scripts/test-ingest.ts pw_live_your_api_key_here
`);
    process.exit(1);
  }

  const endpoint = `${baseUrl}/api/ingest`;

  // Sample 1: Critical Payment Failure
  const criticalPayload = {
    message: "PaymentGatewayError: Stripe charge failed - Database connection lost during payment authorization",
    stack: `PaymentGatewayError: Stripe charge failed - Database connection lost during payment authorization
    at ProcessPayment (src/services/billing.ts:102:12)
    at async CheckoutController.charge (src/controllers/checkout.ts:45:9)
    at async Layer.handle (node_modules/express/lib/router/layer.js:95:5)`,
    environment: "production",
    repo: "fetchhub/billing-service",
    metadata: {
      orderId: "ord_99812",
      amountCents: 49900,
      timestamp: new Date().toISOString(),
    },
  };

  // Sample 2: Minor UI Glitch / Warning
  const minorPayload = {
    message: "Warning: Deprecated component prop 'theme' passed to Avatar component in Navbar",
    stack: `Warning: Deprecated component prop 'theme' passed to Avatar component in Navbar
    at renderAvatar (src/components/Avatar.tsx:14:5)
    at Navbar (src/components/Navbar.tsx:42:10)`,
    environment: "staging",
    repo: "fetchhub/frontend-web",
    metadata: {
      browser: "Chrome 122.0",
      timestamp: new Date().toISOString(),
    },
  };

  console.log(`\n🚀 Test 1: Ingesting CRITICAL payment failure payload...`);
  const response1 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(criticalPayload),
  });

  const data1 = await response1.json();
  console.log(`Response status: ${response1.status}`);
  console.log("Response body:", JSON.stringify(data1, null, 2));

  console.log("\n------------------------------------------------");
  console.log("🚀 Test 2: Ingesting MINOR UI warning payload...");
  const response2 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(minorPayload),
  });

  const data2 = await response2.json();
  console.log(`Response status: ${response2.status}`);
  console.log("Response body:", JSON.stringify(data2, null, 2));

  console.log("\n------------------------------------------------");
  console.log("🔄 Test 3: Sending DUPLICATE payload to verify deduplication...");
  const response3 = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(criticalPayload),
  });

  const data3 = await response3.json();
  console.log(`Response status: ${response3.status}`);
  console.log("Response body:", JSON.stringify(data3, null, 2));

  if (response3.ok && data3.isRecurrence && data3.occurrenceCount > 1) {
    console.log("\n✅ SUCCESS: Ingestion, AI Triage, and Deduplication pipeline tests completed!");
  } else {
    console.log("\n⚠️ Deduplication test returned unexpected response.");
  }
}

main().catch((err) => {
  console.error("Fatal test script error:", err);
  process.exit(1);
});
