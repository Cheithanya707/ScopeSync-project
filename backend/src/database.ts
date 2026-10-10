import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017";
const databaseName = process.env.MONGODB_DATABASE?.trim() || "scopesync";

let clientPromise: Promise<MongoClient> | undefined;

export async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect().catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return (await clientPromise).db(databaseName);
}

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("users").createIndex({ uid: 1 }, { unique: true }),
    db.collection("users").createIndex(
      { email: 1 },
      { unique: true, partialFilterExpression: { email: { $type: "string" } } },
    ),
    db.collection("workspaces").createIndex({ id: 1 }, { unique: true }),
    db.collection("workspaceMembers").createIndex(
      { workspaceId: 1, email: 1 },
      { unique: true },
    ),
    db.collection("workspaceMembers").createIndex(
      { workspaceId: 1, userId: 1 },
      { sparse: true },
    ),
    db.collection("projects").createIndex({ id: 1 }, { unique: true }),
    db.collection("documentFiles").createIndex({ id: 1 }, { unique: true }),
    db.collection("scopeBaselines").createIndex({ projectId: 1, version: 1 }, { unique: true }),
    db.collection("scopeBaselines").createIndex({ id: 1 }, { unique: true }),
    db.collection("auditLog").createIndex({ projectId: 1, seq: 1 }, { unique: true }),
    db.collection("notifications").createIndex(
      { userId: 1, dedupeKey: 1 },
      { partialFilterExpression: { dedupeKey: { $type: "string" } } },
    ),
  ]);
}

export async function closeDatabase(): Promise<void> {
  if (!clientPromise) return;
  const client = await clientPromise;
  await client.close();
  clientPromise = undefined;
}
