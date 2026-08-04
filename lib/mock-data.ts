import {
  Incident,
  ConnectedRepo,
  ErrorSource,
  Assignee,
  ApiKey,
} from "./types";

export const MOCK_REPOS: ConnectedRepo[] = [
  {
    id: "repo-1",
    name: "fetchhub/checkout-service",
    owner: "fetchhub",
    branch: "main",
    status: "connected",
    lastSynced: "5 mins ago",
    incidentsCount: 4,
  },
  {
    id: "repo-2",
    name: "fetchhub/auth-gateway",
    owner: "fetchhub",
    branch: "main",
    status: "connected",
    lastSynced: "12 mins ago",
    incidentsCount: 2,
  },
  {
    id: "repo-3",
    name: "fetchhub/payment-worker",
    owner: "fetchhub",
    branch: "prod-v2",
    status: "connected",
    lastSynced: "1 hour ago",
    incidentsCount: 3,
  },
  {
    id: "repo-4",
    name: "fetchhub/frontend-web",
    owner: "fetchhub",
    branch: "main",
    status: "syncing",
    lastSynced: "Just now",
    incidentsCount: 1,
  },
];

export const MOCK_TEAM_MEMBERS: Assignee[] = [
  {
    id: "user-1",
    name: "Elena Rostova",
    email: "elena@fetchhub.io",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "Lead DevOps Engineer",
  },
  {
    id: "user-2",
    name: "Marcus Chen",
    email: "marcus@fetchhub.io",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Senior Backend Engineer",
  },
  {
    id: "user-3",
    name: "Sarah Jenkins",
    email: "sarah@fetchhub.io",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "SRE Lead",
  },
  {
    id: "user-4",
    name: "Alex Rivera",
    email: "alex@fetchhub.io",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "Staff Infrastructure Engineer",
  },
];

export const MOCK_ERROR_SOURCES: ErrorSource[] = [
  {
    id: "src-1",
    name: "Sentry (Production)",
    type: "sentry",
    status: "active",
    lastEventAt: "2 mins ago",
  },
  {
    id: "src-2",
    name: "Datadog APM",
    type: "datadog",
    status: "active",
    lastEventAt: "4 mins ago",
  },
  {
    id: "src-3",
    name: "PagerDuty (On-Call)",
    type: "pagerduty",
    status: "active",
    lastEventAt: "15 mins ago",
  },
  {
    id: "src-4",
    name: "AWS CloudWatch Alerts",
    type: "aws_cloudwatch",
    status: "paused",
    lastEventAt: "3 days ago",
  },
];

export const MOCK_API_KEYS: ApiKey[] = [
  {
    id: "key-1",
    name: "Production Ingestion Token",
    keyPrefix: "pw_live_8f3a9...92d1",
    createdAt: "2026-06-15",
    lastUsedAt: "2 mins ago",
  },
  {
    id: "key-2",
    name: "Staging Sentry Webhook",
    keyPrefix: "pw_test_1c7b2...44f0",
    createdAt: "2026-07-01",
    lastUsedAt: "Yesterday",
  },
  {
    id: "key-3",
    name: "CI/CD Pipeline Bot",
    keyPrefix: "pw_live_99a0b...87c3",
    createdAt: "2026-07-20",
    lastUsedAt: "5 hours ago",
  },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-8492",
    title: "PostgreSQL Connection Pool Exhaustion in Checkout Flow",
    severity: "critical",
    status: "fix_generated",
    createdAt: "2026-08-01T17:22:00Z",
    repo: "fetchhub/checkout-service",
    errorMessage: "FatalError: TimeoutError: ResourcePool timed out waiting for connection (max 50)",
    stackTrace: [
      "at Pool.acquire (node_modules/pg-pool/index.js:142:18)",
      "at async TransactionManager.execute (src/database/transaction.ts:45:22)",
      "at async CheckoutService.processOrder (src/services/checkout.ts:118:5)",
      "at async OrderController.checkout (src/controllers/order.ts:34:12)",
      "at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)"
    ],
    aiSummary: "High traffic caused unreleased database connections in `CheckoutService.processOrder`. A missing `finally` block in `transaction.ts` prevents active connections from returning to the pool upon payment provider timeout.",
    assignee: MOCK_TEAM_MEMBERS[1],
    rootCause: {
      commitHash: "7f9a21b",
      confidenceScore: 94,
      reasoning: "Commit 7f9a21b ('refactor: add async retry to payment provider') introduced a new retry loop in transaction execution without wrapping `client.release()` inside a `finally` clause. When payment endpoints time out, connection handles leak.",
      culpritCommit: {
        hash: "7f9a21b",
        author: "Marcus Chen",
        authorAvatar: MOCK_TEAM_MEMBERS[1].avatar,
        message: "refactor: add async retry to payment provider integration",
        timestamp: "2 hours ago",
        filesChanged: ["src/database/transaction.ts", "src/services/checkout.ts"]
      }
    },
    fix: {
      status: "created",
      prTitle: "fix(db): ensure connection pool release on payment gateway failure",
      prUrl: "https://github.com/fetchhub/checkout-service/pull/412",
      prDescription: "### Patchwork AI Automated Fix\n\n- Wraps DB connection handle in a `try...finally` block in `src/database/transaction.ts`.\n- Increases default connection pool idle timeout to 3000ms.\n- Adds automated health check metric for connection leaks.",
      diff: `--- a/src/database/transaction.ts
+++ b/src/database/transaction.ts
@@ -42,8 +42,11 @@ export class TransactionManager {
   async execute<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
     const client = await pool.acquire();
     try {
       await client.query('BEGIN');
       const result = await fn(client);
       await client.query('COMMIT');
       return result;
     } catch (err) {
       await client.query('ROLLBACK');
       throw err;
+    } finally {
+      client.release();
     }
   }
 }`
    },
    timeline: [
      {
        id: "evt-1",
        incidentId: "INC-8492",
        type: "system",
        message: "Alert triggered by Sentry: High error rate (500 Internal Server Error)",
        timestamp: "17:22:00",
        statusBadge: "detected"
      },
      {
        id: "evt-2",
        incidentId: "INC-8492",
        type: "ai",
        message: "Patchwork Engine auto-triaged incident and grouped 142 related log events",
        timestamp: "17:22:15",
        statusBadge: "triaged"
      },
      {
        id: "evt-3",
        incidentId: "INC-8492",
        type: "ai",
        message: "AI Agent isolated culprit commit 7f9a21b from 14 candidate commits (94% confidence)",
        timestamp: "17:23:05",
        statusBadge: "analyzing"
      },
      {
        id: "evt-4",
        incidentId: "INC-8492",
        type: "action",
        message: "Patchwork AI generated candidate patch and opened GitHub PR #412",
        timestamp: "17:24:10",
        statusBadge: "fix_generated"
      }
    ]
  },
  {
    id: "INC-8491",
    title: "JWT Key Rotation Verification Failure in Auth Gateway",
    severity: "high",
    status: "in_review",
    createdAt: "2026-08-01T16:45:00Z",
    repo: "fetchhub/auth-gateway",
    errorMessage: "JsonWebTokenError: invalid signature at Verify.verifySecrets",
    stackTrace: [
      "at Keyring.getPublicVerificationKey (src/auth/keyring.ts:88:11)",
      "at JWTService.verifyToken (src/auth/jwt.ts:54:29)",
      "at AuthenticateMiddleware (src/middleware/auth.ts:22:18)",
      "at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)"
    ],
    aiSummary: "Token validation fails for users issued keys during rolling updates. The keyring cache key algorithm doesn't trim whitespace from rotated public keys.",
    assignee: MOCK_TEAM_MEMBERS[0],
    rootCause: {
      commitHash: "e34b109",
      confidenceScore: 89,
      reasoning: "Commit e34b109 updated key parsing logic for AWS Secrets Manager without trimming string values, causing RSA header mismatches during signature validation.",
      culpritCommit: {
        hash: "e34b109",
        author: "Elena Rostova",
        authorAvatar: MOCK_TEAM_MEMBERS[0].avatar,
        message: "feat(auth): dynamic key fetch from Secrets Manager",
        timestamp: "3 hours ago",
        filesChanged: ["src/auth/keyring.ts"]
      }
    },
    fix: {
      status: "created",
      prTitle: "fix(auth): trim PEM headers during RSA public key load",
      prUrl: "https://github.com/fetchhub/auth-gateway/pull/89",
      prDescription: "Sanitizes raw PEM string input prior to passing to crypto.createVerify.",
      diff: `--- a/src/auth/keyring.ts
+++ b/src/auth/keyring.ts
@@ -85,5 +85,5 @@ export class Keyring {
   getPublicVerificationKey(kid: string): string {
     const rawKey = this.keys.get(kid);
     if (!rawKey) throw new Error(\`Key \${kid} not found\`);
-    return rawKey;
+    return rawKey.trim();
   }`
    },
    timeline: [
      {
        id: "evt-10",
        incidentId: "INC-8491",
        type: "system",
        message: "Alert: 401 Unauthorized spikes on /api/v1/auth/verify",
        timestamp: "16:45:00",
        statusBadge: "detected"
      },
      {
        id: "evt-11",
        incidentId: "INC-8491",
        type: "action",
        message: "Elena Rostova assigned Patchwork agent to investigate",
        timestamp: "16:47:00",
        statusBadge: "triaged"
      },
      {
        id: "evt-12",
        incidentId: "INC-8491",
        type: "ai",
        message: "Patchwork generated automated PR #89 (In Review)",
        timestamp: "16:50:30",
        statusBadge: "in_review"
      }
    ]
  },
  {
    id: "INC-8490",
    title: "Redis Cluster Split-Brain Eviction Surge",
    severity: "critical",
    status: "analyzing",
    createdAt: "2026-08-01T15:10:00Z",
    repo: "fetchhub/payment-worker",
    errorMessage: "RedisError: READONLY You can't write against a read only replica.",
    stackTrace: [
      "at RedisClient.sendCommand (node_modules/ioredis/lib/redis.js:290:14)",
      "at CacheManager.setSession (src/cache/redis.ts:62:21)",
      "at PaymentQueue.process (src/workers/paymentWorker.ts:40:9)"
    ],
    aiSummary: "Primary Redis node lost failover heartbeat resulting in secondary promotion failure and read-only lockouts on payment worker nodes.",
    assignee: MOCK_TEAM_MEMBERS[2],
    rootCause: {
      commitHash: "a102bc4",
      confidenceScore: 78,
      reasoning: "Recent sentinel timeout threshold modification in deployment manifest dropped keep-alive probe from 5s to 500ms, triggering false positive failovers.",
      culpritCommit: {
        hash: "a102bc4",
        author: "Sarah Jenkins",
        authorAvatar: MOCK_TEAM_MEMBERS[2].avatar,
        message: "ops: tweak redis sentinel ping interval for faster recovery",
        timestamp: "5 hours ago",
        filesChanged: ["k8s/redis-sentinel.yaml"]
      }
    },
    fix: {
      status: "draft",
      prTitle: "fix(ops): restore sentinel down-after-milliseconds to 5000ms",
      prDescription: "Reverts aggressive probe frequency to stabilize cluster topology.",
      diff: `--- a/k8s/redis-sentinel.yaml
+++ b/k8s/redis-sentinel.yaml
@@ -14,3 +14,3 @@ spec:
-        - name: SENTINEL_DOWN_AFTER
-          value: "500"
+        - name: SENTINEL_DOWN_AFTER
+          value: "5000"`
    },
    timeline: [
      {
        id: "evt-20",
        incidentId: "INC-8490",
        type: "system",
        message: "Datadog Alert: Redis node state changed to READONLY",
        timestamp: "15:10:00",
        statusBadge: "detected"
      },
      {
        id: "evt-21",
        incidentId: "INC-8490",
        type: "ai",
        message: "Patchwork actively analyzing Sentinel cluster metrics & network topology",
        timestamp: "15:12:00",
        statusBadge: "analyzing"
      }
    ]
  },
  {
    id: "INC-8489",
    title: "Stripe Webhook Idempotency Race Condition",
    severity: "medium",
    status: "deployed",
    createdAt: "2026-08-01T12:30:00Z",
    repo: "fetchhub/checkout-service",
    errorMessage: "DuplicateKeyError: E11000 duplicate key error collection: fetchhub.transactions",
    stackTrace: [
      "at MongoError.parse (node_modules/mongodb/lib/core/error.js:54:12)",
      "at WebhookHandler.handleInvoicePaid (src/webhooks/stripe.ts:92:15)",
      "at async router.post (src/routes/webhooks.ts:18:5)"
    ],
    aiSummary: "Concurrent Stripe retry events executed identical database inserts before idempotency key lock was persisted.",
    assignee: MOCK_TEAM_MEMBERS[3],
    rootCause: {
      commitHash: "c9921e0",
      confidenceScore: 96,
      reasoning: "Missing distributed lock check prior to calling `transactions.insert()`. Lock was being written asynchronously after processing completed.",
      culpritCommit: {
        hash: "c9921e0",
        author: "Alex Rivera",
        authorAvatar: MOCK_TEAM_MEMBERS[3].avatar,
        message: "feat: async log webhook events for audit",
        timestamp: "1 day ago",
        filesChanged: ["src/webhooks/stripe.ts"]
      }
    },
    fix: {
      status: "merged",
      prTitle: "fix(webhooks): acquire atomic Redis lock before processing Stripe events",
      prUrl: "https://github.com/fetchhub/checkout-service/pull/408",
      prDescription: "Acquires Redis lock key prior to DB insert, preventing parallel duplicate ingestion.",
      diff: `--- a/src/webhooks/stripe.ts
+++ b/src/webhooks/stripe.ts
@@ -89,4 +89,7 @@ export async function handleInvoicePaid(event: Stripe.Event) {
+  const lockAcquired = await redisLock.acquire(\`lock:\${event.id}\`, 5000);
+  if (!lockAcquired) return { status: 'already_processing' };
   await db.transactions.insert(event.data.object);`
    },
    timeline: [
      {
        id: "evt-30",
        incidentId: "INC-8489",
        type: "system",
        message: "Sentry Alert: DuplicateKeyError on Stripe Webhook listener",
        timestamp: "12:30:00",
        statusBadge: "detected"
      },
      {
        id: "evt-31",
        incidentId: "INC-8489",
        type: "ai",
        message: "Fix generated, tested in canary environment and merged into main",
        timestamp: "13:15:00",
        statusBadge: "deployed"
      }
    ]
  },
  {
    id: "INC-8488",
    title: "Next.js Hydration Mismatch in Dark Mode Provider",
    severity: "low",
    status: "resolved",
    createdAt: "2026-07-31T20:15:00Z",
    repo: "fetchhub/frontend-web",
    errorMessage: "Error: Text content does not match server-rendered HTML",
    stackTrace: [
      "at throwOnHydrationMismatch (node_modules/react-dom/cjs/react-dom.development.js:12891:9)",
      "at updateTextNode (node_modules/react-dom/cjs/react-dom.development.js:13192:7)",
      "at ThemeProvider (src/components/ThemeProvider.tsx:31:14)"
    ],
    aiSummary: "Client browser reading localStorage theme before hydration mounted, resulting in mismatch between SSR Light and CSR Dark theme classes.",
    assignee: MOCK_TEAM_MEMBERS[1],
    rootCause: {
      commitHash: "4bb819c",
      confidenceScore: 98,
      reasoning: "ThemeProvider component rendered `window.localStorage` value directly in initial state without delaying render until `useEffect` mount flag.",
      culpritCommit: {
        hash: "4bb819c",
        author: "Marcus Chen",
        authorAvatar: MOCK_TEAM_MEMBERS[1].avatar,
        message: "refactor: simplify theme state initialization",
        timestamp: "2 days ago",
        filesChanged: ["src/components/ThemeProvider.tsx"]
      }
    },
    fix: {
      status: "merged",
      prTitle: "fix(ui): defer theme mounting until client hydration completes",
      prUrl: "https://github.com/fetchhub/frontend-web/pull/154",
      prDescription: "Adds `mounted` state guard to ThemeProvider to align SSR and CSR tree outputs.",
      diff: `--- a/src/components/ThemeProvider.tsx
+++ b/src/components/ThemeProvider.tsx
@@ -28,3 +28,7 @@ export function ThemeProvider({ children }: { children: React.ReactNode }) {
+  const [mounted, setMounted] = useState(false);
+  useEffect(() => setMounted(true), []);
+  if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>;`
    },
    timeline: [
      {
        id: "evt-40",
        incidentId: "INC-8488",
        type: "system",
        message: "Client error logged: React Hydration Warning #418",
        timestamp: "20:15:00",
        statusBadge: "detected"
      },
      {
        id: "evt-41",
        incidentId: "INC-8488",
        type: "action",
        message: "Resolved by Marcus Chen via PR #154",
        timestamp: "21:00:00",
        statusBadge: "resolved"
      }
    ]
  },
  {
    id: "INC-8487",
    title: "AWS S3 Rate Limit (429 Too Many Requests) during Bulk Export",
    severity: "medium",
    status: "triaged",
    createdAt: "2026-07-31T18:40:00Z",
    repo: "fetchhub/checkout-service",
    errorMessage: "S3Exception: SlowDown: Please reduce your request rate. (Service: Amazon S3; Status Code: 429)",
    stackTrace: [
      "at Request.extractError (node_modules/aws-sdk/lib/services/s3.js:711:27)",
      "at Request.callListeners (node_modules/aws-sdk/lib/sequential_executor.js:116:20)",
      "at ExportWorker.uploadBatch (src/workers/exporter.ts:77:19)"
    ],
    aiSummary: "Parallel export job spawned 500 concurrent S3 object PUT requests without exponential backoff jitter.",
    assignee: MOCK_TEAM_MEMBERS[3],
    rootCause: {
      commitHash: "6011ff2",
      confidenceScore: 91,
      reasoning: "Batch upload loop replaced sequential chunking with `Promise.all()` across all export items without a semaphore concurrency limit.",
      culpritCommit: {
        hash: "6011ff2",
        author: "Alex Rivera",
        authorAvatar: MOCK_TEAM_MEMBERS[3].avatar,
        message: "perf: parallelize report generation export task",
        timestamp: "3 days ago",
        filesChanged: ["src/workers/exporter.ts"]
      }
    },
    fix: {
      status: "draft",
      prTitle: "fix(export): throttle S3 uploads with p-limit worker pool",
      prDescription: "Wraps upload requests with concurrency limit of 15 simultaneous connections.",
      diff: `--- a/src/workers/exporter.ts
+++ b/src/workers/exporter.ts
@@ -74,3 +74,4 @@ export async function uploadBatch(items: Item[]) {
-  await Promise.all(items.map(item => s3.upload(item)));
+  const limit = pLimit(15);
+  await Promise.all(items.map(item => limit(() => s3.upload(item))));`
    },
    timeline: [
      {
        id: "evt-50",
        incidentId: "INC-8487",
        type: "system",
        message: "CloudWatch Alarm: S3 429 RateLimit Exceeded (>100 req/s)",
        timestamp: "18:40:00",
        statusBadge: "detected"
      },
      {
        id: "evt-51",
        incidentId: "INC-8487",
        type: "user",
        message: "Alex Rivera marked incident as Triaged",
        timestamp: "18:45:00",
        statusBadge: "triaged"
      }
    ]
  },
  {
    id: "INC-8486",
    title: "Memory Leak in Node.js WebSocket Event Listener",
    severity: "high",
    status: "fix_generated",
    createdAt: "2026-07-31T14:10:00Z",
    repo: "fetchhub/auth-gateway",
    errorMessage: "FatalError: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory",
    stackTrace: [
      "at EventEmitter.addListener (node_modules/events/events.js:280:15)",
      "at SocketConnection.subscribe (src/ws/connection.ts:62:17)",
      "at WebSocketServer.onConnection (src/ws/server.ts:41:10)"
    ],
    aiSummary: "Disconnecting WebSocket clients failed to remove listeners on global event bus `UserStatusEmitter`, retaining orphaned socket objects in heap.",
    assignee: MOCK_TEAM_MEMBERS[0],
    rootCause: {
      commitHash: "889c001",
      confidenceScore: 95,
      reasoning: "Commit 889c001 added presence status broadcasting but neglected to unbind `.on('presence')` when socket fires `'close'` event.",
      culpritCommit: {
        hash: "889c001",
        author: "Elena Rostova",
        authorAvatar: MOCK_TEAM_MEMBERS[0].avatar,
        message: "feat(ws): live presence broadcast channel",
        timestamp: "4 days ago",
        filesChanged: ["src/ws/connection.ts"]
      }
    },
    fix: {
      status: "created",
      prTitle: "fix(ws): unbind presence listeners on socket disconnect",
      prUrl: "https://github.com/fetchhub/auth-gateway/pull/94",
      prDescription: "Ensures cleanup handler removes references to dead socket instances.",
      diff: `--- a/src/ws/connection.ts
+++ b/src/ws/connection.ts
@@ -60,2 +60,5 @@ export class SocketConnection {
     this.bus.on('presence', this.handlePresence);
+    this.socket.on('close', () => {
+      this.bus.off('presence', this.handlePresence);
+    });`
    },
    timeline: [
      {
        id: "evt-60",
        incidentId: "INC-8486",
        type: "system",
        message: "Kubernetes pod container killed (OOMKilled - Exit Code 137)",
        timestamp: "14:10:00",
        statusBadge: "detected"
      },
      {
        id: "evt-61",
        incidentId: "INC-8486",
        type: "ai",
        message: "Patchwork isolated listener leak in `src/ws/connection.ts` and prepared PR #94",
        timestamp: "14:15:30",
        statusBadge: "fix_generated"
      }
    ]
  },
  {
    id: "INC-8485",
    title: "GraphQL Query Complexity Overflow (DoS vulnerability)",
    severity: "low",
    status: "resolved",
    createdAt: "2026-07-30T09:00:00Z",
    repo: "fetchhub/frontend-web",
    errorMessage: "QueryComplexityError: Depth of query (18) exceeds maximum allowed depth (10)",
    stackTrace: [
      "at Object.QueryComplexity [as complexity] (node_modules/graphql-query-complexity/dist/index.js:88:15)",
      "at validate (node_modules/graphql/validation/validate.js:62:22)",
      "at ApolloServer.executeHTTP (node_modules/apollo-server-core/src/requestPipeline.ts:110:12)"
    ],
    aiSummary: "Nested relationship field expansion in new dashboard widget exceeded default depth limit, blocking valid client requests.",
    assignee: MOCK_TEAM_MEMBERS[2],
    rootCause: {
      commitHash: "33100ba",
      confidenceScore: 90,
      reasoning: "Widget component requested deeply nested relational metadata for team audit logs.",
      culpritCommit: {
        hash: "33100ba",
        author: "Sarah Jenkins",
        authorAvatar: MOCK_TEAM_MEMBERS[2].avatar,
        message: "feat: audit log list widget",
        timestamp: "5 days ago",
        filesChanged: ["src/graphql/queries/auditLogs.ts"]
      }
    },
    fix: {
      status: "merged",
      prTitle: "fix(graphql): flatten audit log widget fragment query",
      prUrl: "https://github.com/fetchhub/frontend-web/pull/148",
      prDescription: "Replaced nested queries with direct ID lookups.",
      diff: `--- a/src/graphql/queries/auditLogs.ts
+++ b/src/graphql/queries/auditLogs.ts
@@ -12,4 +12,2 @@ query GetAuditLogs {
     user {
-      org {
-        members { id }
-      }
     }`
    },
    timeline: [
      {
        id: "evt-70",
        incidentId: "INC-8485",
        type: "system",
        message: "GraphQL Guard blocked malformed request",
        timestamp: "09:00:00",
        statusBadge: "detected"
      },
      {
        id: "evt-71",
        incidentId: "INC-8485",
        type: "action",
        message: "Resolved & Merged PR #148",
        timestamp: "10:30:00",
        statusBadge: "resolved"
      }
    ]
  }
];
