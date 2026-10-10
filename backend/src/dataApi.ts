import { randomBytes, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import multer from "multer";
import type { Db, Document, Filter } from "mongodb";
import type { FirebaseIdentity } from "./firebaseAuth.js";

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single("file");

const collectionFor = new Map<string, string>([
  ["activities", "activities"],
  ["eventDetails", "eventDetails"],
  ["eventScheduleItems", "eventScheduleItems"],
  ["eventParticipants", "eventParticipants"],
  ["eventTeams", "eventTeams"],
  ["project-shares", "projectShares"],
  ["marketplace/listings", "marketplaceListings"],
  ["marketplace/applications", "marketplaceApplications"],
]);
const standaloneCollections = new Set([
  "activities",
  "notifications",
  "eventDetails",
  "eventScheduleItems",
  "eventParticipants",
  "eventTeams",
]);

type Resource = {
  collection: string;
  id?: string;
  workspaceId?: string;
  projectId?: string;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw Object.assign(new Error("The requested resource ID is invalid."), { status: 400, code: "invalid_id" });
  }
}

export function resolveResource(path: string): Resource | null {
  const segments = path.split("/").filter(Boolean).map(safeDecode);
  if (segments[0] === "workspaces" && segments.length <= 4) {
    return { collection: "workspaces", ...(segments[1] ? { id: segments[1] } : {}) };
  }
  if (segments[0] === "users" && segments[1] === "me" &&
    (segments.length === 2 || (segments.length === 3 && segments[2] === "preferences"))) {
    return { collection: "users" };
  }
  if (segments[0] === "v1" && segments[1] === "projects" && segments.length <= 3) {
    return { collection: "projects", ...(segments[2] ? { id: segments[2] } : {}) };
  }
  if (segments[0] === "projects" && segments.length >= 3) {
    const projectId = segments[1];
    const collection = segments[2] === "members"
      ? "projectMembers"
      : ({ tasks: "tasks", requirements: "requirements", scopeChanges: "scopeChanges", payments: "payments", documents: "documents" } as Record<string, string>)[segments[2]];
    if (!collection || segments.length > 4 || (segments[2] === "members" && segments.length !== 3)) return null;
    return { collection, projectId, ...(segments[3] ? { id: segments[3] } : {}) };
  }
  if (segments.length === 1 && segments[0] === "my-projects") {
    return { collection: "projects" };
  }
  const pairedRoute = segments.slice(0, 2).join("/");
  const route = collectionFor.has(pairedRoute) ? pairedRoute : segments[0];
  const collection = collectionFor.get(route) ??
    (segments.length === 1 && standaloneCollections.has(route) ? route : undefined);
  if (!collection || ["health", "auth", "files", "users", "workspaces"].includes(segments[0])) return null;
  const id = route === pairedRoute ? segments[2] : segments[1];
  if (segments.length > (route === pairedRoute ? 3 : 2)) return null;
  return { collection, ...(id ? { id } : {}) };
}

function publicDocument(document: Document): Document {
  const { _id: ignoredId, ...value } = document;
  void ignoredId;
  return value;
}

function requestIdentity(response: Response): FirebaseIdentity {
  const identity = response.locals.identity as FirebaseIdentity | undefined;
  if (!identity) throw Object.assign(new Error("Sign in to continue."), { status: 401, code: "unauthorized" });
  return identity;
}

function bodyObject(request: Request): Document {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    throw Object.assign(new Error("Provide a JSON object for this request."), { status: 400, code: "invalid_body" });
  }
  return request.body as Document;
}

function sendError(response: Response, status: number, code: string, message: string): void {
  response.status(status).json({ error: { code, message } });
}

function identityFilter(identity: FirebaseIdentity): Filter<Document> {
  return {
    $or: [
      { ownerId: identity.uid },
      { userId: identity.uid },
      { applicantId: identity.uid },
      { actorId: identity.uid },
    ],
  };
}

async function accessibleWorkspaceIds(db: Db, identity: FirebaseIdentity): Promise<string[]> {
  const [owned, joined] = await Promise.all([
    db.collection("workspaces").find({ ownerId: identity.uid }, { projection: { id: 1 } }).toArray(),
    db.collection("workspaceMembers").find(
      { userId: identity.uid, status: "active" },
      { projection: { workspaceId: 1 } },
    ).toArray(),
  ]);
  return [...new Set([
    ...owned.flatMap((item) => typeof item.id === "string" ? [item.id] : []),
    ...joined.flatMap((item) => typeof item.workspaceId === "string" ? [item.workspaceId] : []),
  ])];
}

async function requireWorkspaceAccess(db: Db, identity: FirebaseIdentity, workspaceId: string): Promise<Document> {
  const workspace = await db.collection("workspaces").findOne({ id: workspaceId });
  if (!workspace) throw Object.assign(new Error("Workspace not found."), { status: 404, code: "not_found" });
  if (workspace.ownerId === identity.uid) return workspace;
  const membership = await db.collection("workspaceMembers").findOne({
    workspaceId,
    userId: identity.uid,
    status: "active",
  });
  if (!membership) throw Object.assign(new Error("You do not have access to this workspace."), { status: 403, code: "forbidden" });
  return workspace;
}

function editableFields(body: Document, reserved: string[] = []): Document {
  const blocked = new Set([
    "_id", "id", "ownerId", "userId", "applicantId", "actorId", "createdAt",
    "updatedAt", "accessToken", ...reserved,
  ]);
  return Object.fromEntries(Object.entries(body).filter(([key]) => !blocked.has(key)));
}

function withDocumentUrl(document: Document, projectId: string): Document {
  const result = publicDocument(document);
  return {
    ...result,
    downloadUrl: `/api/files/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(String(document.id))}`,
  };
}

function setStatus(response: Response, status: number, body: unknown): void {
  response.status(status).json(body);
}

export async function handleWorkspaceRequest(request: Request, response: Response, db: Db): Promise<boolean> {
  const identity = requestIdentity(response);
  const segments = request.path.split("/").filter(Boolean).map(safeDecode);

  if (segments[0] !== "workspaces") return false;
  const workspaces = db.collection("workspaces");
  const members = db.collection("workspaceMembers");

  if (segments.length === 1 && request.method === "POST") {
    const body = bodyObject(request);
    if (typeof body.name !== "string" || !body.name.trim()) {
      sendError(response, 400, "invalid_workspace", "Workspace name is required.");
      return true;
    }
    const now = new Date().toISOString();
    const workspace = {
      id: randomUUID(),
      name: body.name.trim(),
      type: typeof body.type === "string" ? body.type : "other",
      ...(typeof body.description === "string" ? { description: body.description.trim() } : {}),
      ownerId: identity.uid,
      createdAt: now,
      updatedAt: now,
    };
    await workspaces.insertOne(workspace);
    await members.insertOne({
      id: randomUUID(),
      workspaceId: workspace.id,
      userId: identity.uid,
      email: identity.email,
      displayName: identity.displayName ?? identity.email.split("@")[0],
      role: "owner",
      status: "active",
      projectIds: [],
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    setStatus(response, 201, workspace);
    return true;
  }

  if (segments.length < 2) return false;
  const workspaceId = segments[1];
  const workspace = await requireWorkspaceAccess(db, identity, workspaceId);

  if (segments[2] === "members") {
    if (segments.length === 3 && request.method === "GET") {
      response.json((await members.find({ workspaceId }).sort({ displayName: 1 }).toArray()).map(publicDocument));
      return true;
    }
    if (segments.length === 3 && request.method === "POST") {
      if (workspace.ownerId !== identity.uid) {
        sendError(response, 403, "forbidden", "Only the workspace owner can invite members.");
        return true;
      }
      const body = bodyObject(request);
      if (typeof body.email !== "string" || typeof body.displayName !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        sendError(response, 400, "invalid_member", "Enter a name and valid email address.");
        return true;
      }
      const existing = await members.findOne({ workspaceId, email: body.email.trim().toLowerCase() });
      if (existing) {
        sendError(response, 409, "member_exists", "This person is already in the workspace.");
        return true;
      }
      const now = new Date().toISOString();
      const member = {
        id: randomUUID(),
        workspaceId,
        email: body.email.trim().toLowerCase(),
        displayName: body.displayName.trim(),
        role: typeof body.role === "string" ? body.role : "team_member",
        status: body.status === "active" ? "active" : "invited",
        projectIds: [],
        invitedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await members.insertOne(member);
      setStatus(response, 201, member);
      return true;
    }
    if (segments.length === 4 && ["PATCH", "DELETE"].includes(request.method)) {
      if (workspace.ownerId !== identity.uid) {
        sendError(response, 403, "forbidden", "Only the workspace owner can update members.");
        return true;
      }
      const memberId = segments[3];
      const filter = { id: memberId, workspaceId, userId: { $ne: identity.uid } };
      if (request.method === "DELETE") {
        const deleted = await members.deleteOne(filter);
        if (!deleted.deletedCount) {
          sendError(response, 404, "not_found", "Workspace member not found.");
          return true;
        }
        response.json({ deleted: true });
        return true;
      }
      const body = bodyObject(request);
      const result = await members.findOneAndUpdate(
        filter,
        { $set: { ...editableFields(body, ["workspaceId", "userId"]), updatedAt: new Date().toISOString() } },
        { returnDocument: "after" },
      );
      if (!result) {
        sendError(response, 404, "not_found", "Workspace member not found.");
        return true;
      }
      response.json(publicDocument(result));
      return true;
    }
  }

  if (segments.length === 2 && request.method === "GET") {
    response.json(publicDocument(workspace));
    return true;
  }
  if (segments.length === 2 && request.method === "PATCH") {
    if (workspace.ownerId !== identity.uid) {
      sendError(response, 403, "forbidden", "Only the workspace owner can change workspace settings.");
      return true;
    }
    const body = bodyObject(request);
    const fields = editableFields(body, ["ownerId"]);
    const result = await workspaces.findOneAndUpdate(
      { id: workspaceId },
      { $set: { ...fields, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    if (!result) {
      sendError(response, 404, "not_found", "Workspace not found.");
      return true;
    }
    response.json(publicDocument(result));
    return true;
  }
  return false;
}

async function handlePreferences(request: Request, response: Response, db: Db): Promise<boolean> {
  const identity = requestIdentity(response);
  if (request.path !== "/users/me/preferences") return false;
  const collection = db.collection("preferences");

  if (request.method === "GET") {
    response.json((await collection.find({ userId: identity.uid }).toArray()).map(publicDocument));
    return true;
  }
  if (request.method !== "POST" && request.method !== "PATCH") return false;
  const body = bodyObject(request);
  const now = new Date().toISOString();
  const existing = await collection.findOne({ userId: identity.uid });
  const value = {
    ...(existing ? publicDocument(existing) : {}),
    ...editableFields(body, ["userId"]),
    id: typeof existing?.id === "string" ? existing.id : randomUUID(),
    userId: identity.uid,
    updatedAt: now,
  };
  await collection.updateOne(
    { userId: identity.uid },
    { $set: value },
    { upsert: true },
  );
  response.status(existing ? 200 : 201).json(value);
  return true;
}

async function handleProfile(request: Request, response: Response, db: Db): Promise<boolean> {
  const identity = requestIdentity(response);
  if (request.path !== "/users/me") return false;
  const users = db.collection("users");
  if (request.method === "GET") {
    const profile = await users.findOne({ uid: identity.uid });
    response.json(profile ? publicDocument(profile) : null);
    return true;
  }
  if (request.method !== "PATCH") return false;

  const body = bodyObject(request);
  const existing = await users.findOne({ uid: identity.uid });
  const fields = editableFields(body, ["uid", "email"]);
  for (const key of ["displayName", "photoURL", "primaryRole", "teamSize"] as const) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  for (const [key, maxLength] of [
    ["country", 100],
    ["city", 100],
    ["occupation", 120],
  ] as const) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string" || !body[key].trim() || body[key].trim().length > maxLength) {
      sendError(response, 400, "invalid_profile_field", `Enter a valid ${key}.`);
      return true;
    }
    fields[key] = body[key].trim();
  }
  if (body.age !== undefined) {
    if (typeof body.age !== "number" || !Number.isInteger(body.age) || body.age < 1 || body.age > 120) {
      sendError(response, 400, "invalid_age", "Age must be a whole number between 1 and 120.");
      return true;
    }
    fields.age = body.age;
  }
  for (const key of ["workTypes", "goals"] as const) {
    if (body[key] !== undefined && Array.isArray(body[key]) && body[key].every((item) => typeof item === "string")) {
      fields[key] = body[key];
    }
  }
  if (body.onboardingCompleted === true) fields.onboardingCompleted = true;
  if (fields.onboardingCompleted === true) {
    const completedProfile = { ...existing, ...fields };
    const requiredProfileTextFields = [
      ["country", 100],
      ["city", 100],
      ["occupation", 120],
    ] as const;
    const hasRequiredProfile = typeof completedProfile.age === "number" &&
      Number.isInteger(completedProfile.age) &&
      completedProfile.age >= 1 &&
      completedProfile.age <= 120 &&
      requiredProfileTextFields.every(([key, maxLength]) => {
        const value = completedProfile[key];
        return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
      });
    if (!hasRequiredProfile) {
      sendError(response, 400, "incomplete_profile", "Complete your age, country, city, and occupation before finishing setup.");
      return true;
    }
  }
  if (typeof fields.workspaceId === "string") {
    await requireWorkspaceAccess(db, identity, fields.workspaceId);
  }
  const now = new Date().toISOString();
  const insertDefaults: Document = {
    uid: identity.uid,
    createdAt: now,
  };
  if (fields.displayName === undefined) {
    insertDefaults.displayName = identity.displayName ?? identity.email.split("@")[0];
  }
  if (fields.workTypes === undefined) insertDefaults.workTypes = [];
  if (fields.goals === undefined) insertDefaults.goals = [];
  if (fields.onboardingCompleted === undefined) insertDefaults.onboardingCompleted = false;
  const result = await users.findOneAndUpdate(
    { uid: identity.uid },
    {
      $set: { ...fields, email: identity.email, updatedAt: now },
      $setOnInsert: insertDefaults,
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!result) {
    sendError(response, 500, "profile_update_failed", "The account profile could not be updated.");
    return true;
  }
  response.json(publicDocument(result));
  return true;
}

async function handleMyProjects(request: Request, response: Response, db: Db): Promise<boolean> {
  if (request.path !== "/my-projects" || request.method !== "GET") return false;
  const identity = requestIdentity(response);
  const projects = await db.collection("projects").find({ ownerId: identity.uid }).sort({ updatedAt: -1 }).toArray();
  const result = await Promise.all(projects.map(async (project) => ({
    ...publicDocument(project),
    memberRole: "owner",
    teamSize: await db.collection("projectMembers").countDocuments({
      projectId: project.id,
      status: { $ne: "removed" },
    }),
    progress: 0,
  })));
  response.json(result);
  return true;
}

async function handleProjectShares(request: Request, response: Response, db: Db, identity: FirebaseIdentity, resource: Resource): Promise<boolean> {
  if (resource.collection !== "projectShares") return false;
  const collection = db.collection("projectShares");
  if (request.method === "GET") {
    const shares = await collection.find(identityFilter(identity)).sort({ createdAt: -1 }).toArray();
    response.json(shares.map(publicDocument));
    return true;
  }
  if (request.method === "POST" && !resource.id) {
    const body = bodyObject(request);
    if (typeof body.projectId !== "string" || typeof body.workspaceId !== "string") {
      sendError(response, 400, "invalid_share", "Project and workspace are required to create a share.");
      return true;
    }
    await requireWorkspaceAccess(db, identity, body.workspaceId);
    const project = await db.collection("projects").findOne({ id: body.projectId, workspaceId: body.workspaceId });
    if (!project || project.ownerId !== identity.uid) {
      sendError(response, 404, "not_found", "Project not found in this workspace.");
      return true;
    }
    const now = new Date().toISOString();
    const share = {
      ...editableFields(body, ["ownerId"]),
      id: randomUUID(),
      ownerId: identity.uid,
      createdBy: identity.uid,
      accessToken: randomBytes(32).toString("base64url"),
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(share);
    setStatus(response, 201, share);
    return true;
  }
  if (request.method === "PATCH" && resource.id) {
    const existing = await collection.findOne({ id: resource.id, ownerId: identity.uid });
    if (!existing) {
      sendError(response, 404, "not_found", "Project share not found.");
      return true;
    }
    const body = bodyObject(request);
    const result = await collection.findOneAndUpdate(
      { id: resource.id, ownerId: identity.uid },
      { $set: { ...editableFields(body, ["workspaceId", "projectId"]), updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    response.json(publicDocument(result!));
    return true;
  }
  return false;
}

async function handleMarketplace(request: Request, response: Response, db: Db, identity: FirebaseIdentity, resource: Resource): Promise<boolean> {
  if (!resource.collection.startsWith("marketplace")) return false;
  const body = request.method === "POST" ? bodyObject(request) : {};
  if (resource.collection === "marketplaceListings") {
    const listings = db.collection("marketplaceListings");
    if (request.method === "GET") {
      const filter = resource.id
        ? { id: resource.id, $or: [{ status: "published" }, { ownerId: identity.uid }] }
        : request.query.mine === "true"
          ? { ownerId: identity.uid }
          : { status: "published", visibility: "public" };
      const found = await listings.find(filter).sort({ updatedAt: -1 }).toArray();
      response.json(resource.id ? (found[0] ? publicDocument(found[0]) : null) : found.map(publicDocument));
      return true;
    }
    if (request.method === "POST" && !resource.id) {
      const now = new Date().toISOString();
      const user = await db.collection("users").findOne({ uid: identity.uid });
      const listing = {
        ...editableFields(body),
        id: randomUUID(),
        ownerId: identity.uid,
        ownerName: user?.displayName ?? identity.displayName ?? identity.email,
        visibility: "public",
        status: "draft",
        applicationCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      await listings.insertOne(listing);
      setStatus(response, 201, listing);
      return true;
    }
    if (request.method === "PATCH" && resource.id) {
      const result = await listings.findOneAndUpdate(
        { id: resource.id, ownerId: identity.uid },
        { $set: { ...editableFields(body), updatedAt: new Date().toISOString() } },
        { returnDocument: "after" },
      );
      if (!result) {
        sendError(response, 404, "not_found", "Marketplace listing not found.");
        return true;
      }
      response.json(publicDocument(result));
      return true;
    }
  }

  if (resource.collection === "marketplaceApplications") {
    const applications = db.collection("marketplaceApplications");
    if (request.method === "GET") {
      const scope = request.query.scope === "received" ? "received" : "mine";
      let filter: Filter<Document> = scope === "mine"
        ? { applicantId: identity.uid }
        : { ownerId: identity.uid };
      if (scope === "received") {
        const ownedListings = await db.collection("marketplaceListings").find(
          { ownerId: identity.uid },
          { projection: { id: 1 } },
        ).toArray();
        filter = { listingId: { $in: ownedListings.map((listing) => listing.id) } };
      }
      response.json((await applications.find(filter).sort({ createdAt: -1 }).toArray()).map(publicDocument));
      return true;
    }
    if (request.method === "POST" && !resource.id) {
      if (typeof body.listingId !== "string") {
        sendError(response, 400, "listing_required", "Choose a marketplace listing before applying.");
        return true;
      }
      const listing = await db.collection("marketplaceListings").findOne({
        id: body.listingId,
        status: "published",
        visibility: "public",
      });
      if (!listing) {
        sendError(response, 404, "not_found", "This listing is no longer available.");
        return true;
      }
      if (listing.ownerId === identity.uid) {
        sendError(response, 400, "own_listing", "You cannot apply to your own listing.");
        return true;
      }
      const duplicate = await applications.findOne({ listingId: listing.id, applicantId: identity.uid });
      if (duplicate) {
        sendError(response, 409, "already_applied", "You have already applied to this listing.");
        return true;
      }
      const profile = await db.collection("users").findOne({ uid: identity.uid });
      const now = new Date().toISOString();
      const application = {
        ...editableFields(body, ["ownerId", "applicantId", "listingId"]),
        id: randomUUID(),
        listingId: listing.id,
        applicantId: identity.uid,
        applicantName: profile?.displayName ?? identity.displayName ?? identity.email,
        applicantProfile: {
          primaryRole: profile?.primaryRole,
          workTypes: profile?.workTypes ?? [],
        },
        ownerId: listing.ownerId,
        projectId: listing.projectId,
        listingTitle: listing.title,
        listingCategory: listing.category,
        listingCurrency: listing.currency,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      await applications.insertOne(application);
      await db.collection("marketplaceListings").updateOne(
        { id: listing.id },
        { $inc: { applicationCount: 1 }, $set: { updatedAt: now } },
      );
      setStatus(response, 201, application);
      return true;
    }
    if (request.method === "PATCH" && resource.id) {
      const existing = await applications.findOne({ id: resource.id });
      if (!existing || (existing.applicantId !== identity.uid && existing.ownerId !== identity.uid)) {
        sendError(response, 404, "not_found", "Application not found.");
        return true;
      }
      const allowedStatuses = existing.applicantId === identity.uid
        ? new Set(["withdrawn"])
        : new Set(["shortlisted", "accepted", "rejected"]);
      if (typeof body.status !== "string" || !allowedStatuses.has(body.status)) {
        sendError(response, 403, "forbidden", "You cannot set this application status.");
        return true;
      }
      const result = await applications.findOneAndUpdate(
        { id: resource.id },
        { $set: { status: body.status, updatedAt: new Date().toISOString() } },
        { returnDocument: "after" },
      );
      response.json(publicDocument(result!));
      return true;
    }
  }
  return false;
}

function queryFilter(request: Request, resource: Resource, identity: FirebaseIdentity, workspaceIds: string[]): Filter<Document> {
  if (resource.collection === "projects" && request.path.endsWith("/my-projects")) {
    return { ownerId: identity.uid };
  }
  if (resource.projectId) return { projectId: resource.projectId };
  if (resource.collection === "marketplaceListings") {
    return request.query.mine === "true"
      ? { ownerId: identity.uid }
      : { status: "published", visibility: "public" };
  }
  if (resource.collection === "marketplaceApplications") {
    return request.query.scope === "received"
      ? { ownerId: identity.uid }
      : { applicantId: identity.uid };
  }
  if (resource.collection === "notifications") return { userId: identity.uid };
  if (resource.collection === "projectShares") return { ownerId: identity.uid };

  const filter: Document = {
    $or: [
      { ownerId: identity.uid },
      { userId: identity.uid },
      { applicantId: identity.uid },
      { actorId: identity.uid },
      { workspaceId: { $in: workspaceIds } },
    ],
  };
  for (const key of ["workspaceId", "projectId", "entityType", "action", "status"] as const) {
    const value = request.query[key];
    if (typeof value === "string" && value) filter[key] = value;
  }
  return filter as Filter<Document>;
}

export async function handleResource(request: Request, response: Response, db: Db, resource: Resource): Promise<void> {
  const identity = requestIdentity(response);
  if (await handleWorkspaceRequest(request, response, db)) return;
  if (await handlePreferences(request, response, db)) return;
  if (await handleProfile(request, response, db)) return;
  if (await handleMyProjects(request, response, db)) return;
  if (await handleProjectShares(request, response, db, identity, resource)) return;
  if (await handleMarketplace(request, response, db, identity, resource)) return;

  const collection = db.collection(resource.collection);
  if (resource.projectId) {
    const project = await db.collection("projects").findOne({ id: resource.projectId });
    if (!project || typeof project.workspaceId !== "string") {
      sendError(response, 404, "not_found", "Project not found.");
      return;
    }
    await requireWorkspaceAccess(db, identity, project.workspaceId);
  }

  if (resource.collection === "projects" && request.method === "POST") {
    const body = bodyObject(request);
    if (typeof body.workspaceId !== "string") {
      sendError(response, 400, "workspace_required", "Select a workspace before creating a project.");
      return;
    }
    await requireWorkspaceAccess(db, identity, body.workspaceId);
    const now = new Date().toISOString();
    const project = {
      ...editableFields(body, ["workspaceId", "ownerId"]),
      id: randomUUID(),
      workspaceId: body.workspaceId,
      ownerId: identity.uid,
      status: typeof body.status === "string" ? body.status : "planning",
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(project);
    setStatus(response, 201, project);
    return;
  }

  if (resource.collection === "documents" && resource.projectId && request.method === "POST") {
    if (!request.file) {
      sendError(response, 400, "file_required", "Select a file to upload.");
      return;
    }
    const now = new Date().toISOString();
    const id = randomUUID();
    const project = await db.collection("projects").findOne({ id: resource.projectId });
    if (!project || typeof project.workspaceId !== "string") {
      sendError(response, 404, "not_found", "Project not found.");
      return;
    }
    const document = {
      id,
      projectId: resource.projectId,
      workspaceId: project.workspaceId,
      ownerId: identity.uid,
      name: typeof request.body.name === "string" ? request.body.name : request.file.originalname,
      originalName: request.file.originalname,
      fileType: typeof request.body.fileType === "string" ? request.body.fileType : request.file.mimetype,
      mimeType: request.file.mimetype,
      storagePath: `mongodb://${id}`,
      uploadedBy: identity.uid,
      description: typeof request.body.description === "string" ? request.body.description : undefined,
      isShared: request.body.isShared === "true",
      size: request.file.size,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("documentFiles").insertOne({
      id,
      projectId: resource.projectId,
      workspaceId: project.workspaceId,
      isShared: document.isShared,
      contentType: request.file.mimetype,
      data: request.file.buffer,
    });
    await collection.insertOne(document);
    setStatus(response, 201, withDocumentUrl(document, resource.projectId));
    return;
  }

  if (request.method === "GET") {
    const workspaceIds = await accessibleWorkspaceIds(db, identity);
    if (resource.id) {
      const filter = {
        id: resource.id,
        ...queryFilter(request, resource, identity, workspaceIds),
      };
      const document = await collection.findOne(filter);
      if (!document) {
        if (resource.collection === "projects" && resource.id) {
          const legacyProject = await collection.findOne({ id: resource.id, ownerId: identity.uid });
          if (legacyProject) {
            response.json(publicDocument(legacyProject));
            return;
          }
        }
        response.status(404).json(null);
        return;
      }
      response.json(resource.collection === "documents" && resource.projectId
        ? withDocumentUrl(document, resource.projectId)
        : publicDocument(document));
      return;
    }
    const found = await collection.find(queryFilter(request, resource, identity, workspaceIds))
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(500)
      .toArray();
    const values = resource.collection === "documents" && resource.projectId
      ? found.map((document) => withDocumentUrl(document, resource.projectId!))
      : found.map(publicDocument);
    response.json(values);
    return;
  }

  if (request.method === "POST" && !resource.id) {
    const body = resource.collection === "documents" && request.file
      ? request.body as Document
      : bodyObject(request);
    if (
      resource.collection === "scopeChanges" &&
      (typeof body.title !== "string" || !body.title.trim() ||
        typeof body.description !== "string" || !body.description.trim() ||
        body.title.length > 120 || body.description.length > 3000)
    ) {
      sendError(response, 400, "invalid_change_request", "Provide a title and description within the allowed length.");
      return;
    }
    const now = new Date().toISOString();
    const project = resource.projectId
      ? await db.collection("projects").findOne({ id: resource.projectId })
      : null;
    const workspaceId = resource.projectId
      ? project?.workspaceId
      : typeof body.workspaceId === "string" ? body.workspaceId : undefined;
    if (typeof workspaceId === "string") await requireWorkspaceAccess(db, identity, workspaceId);
    const value: Document = {
      ...editableFields(body, ["workspaceId", "projectId", "ownerId"]),
      id: randomUUID(),
      ownerId: identity.uid,
      createdAt: now,
      updatedAt: now,
      ...(typeof workspaceId === "string" ? { workspaceId } : {}),
      ...(resource.projectId ? { projectId: resource.projectId } : {}),
    };
    if (resource.collection === "activities") {
      value.actorId = identity.uid;
      value.ownerId = identity.uid;
    }
    if (resource.collection === "notifications") {
      if (typeof body.userId !== "string") {
        sendError(response, 400, "invalid_notification", "A notification recipient is required.");
        return;
      }
      if (typeof workspaceId !== "string") {
        sendError(response, 400, "workspace_required", "A workspace is required for notifications.");
        return;
      }
      if (body.userId !== identity.uid) {
        const recipient = await db.collection("workspaceMembers").findOne({
          workspaceId,
          userId: body.userId,
          status: "active",
        });
        if (!recipient) {
          sendError(response, 400, "invalid_recipient", "The notification recipient is not an active workspace member.");
          return;
        }
      }
      value.userId = body.userId;
    }
    if (resource.collection === "requirements" && resource.projectId) {
      const nextCode = await collection.countDocuments({ projectId: resource.projectId }) + 1;
      value.code = `REQ-${String(nextCode).padStart(3, "0")}`;
    }
    if (resource.collection === "scopeChanges" && resource.projectId) {
      value.changeNumber = await collection.countDocuments({ projectId: resource.projectId }) + 1;
    }
    if (resource.collection === "payments" && resource.projectId) {
      value.paymentNumber = await collection.countDocuments({ projectId: resource.projectId }) + 1;
    }
    await collection.insertOne(value);
    setStatus(response, 201, resource.collection === "documents" && resource.projectId
      ? withDocumentUrl(value, resource.projectId)
      : value);
    return;
  }

  if (resource.id && request.method === "PATCH") {
    const workspaceIds = await accessibleWorkspaceIds(db, identity);
    const current = await collection.findOne({
      id: resource.id,
      ...queryFilter(request, resource, identity, workspaceIds),
    });
    if (!current) {
      sendError(response, 404, "not_found", "The requested record was not found.");
      return;
    }
    const body = bodyObject(request);
    const updates = editableFields(body, ["workspaceId", "projectId"]);
    const result = await collection.findOneAndUpdate(
      { id: resource.id, ownerId: current.ownerId },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    if (!result) {
      sendError(response, 404, "not_found", "The requested record was not found.");
      return;
    }
    response.json(publicDocument(result));
    return;
  }

  if (resource.id && request.method === "DELETE") {
    const workspaceIds = await accessibleWorkspaceIds(db, identity);
    const filter = {
      id: resource.id,
      ...queryFilter(request, resource, identity, workspaceIds),
    };
    const removed = await collection.deleteOne(filter);
    if (!removed.deletedCount) {
      sendError(response, 404, "not_found", "The requested record was not found.");
      return;
    }
    if (resource.collection === "documents") {
      await db.collection("documentFiles").deleteOne({ id: resource.id });
    }
    response.json({ deleted: true });
    return;
  }

  sendError(response, 405, "method_not_allowed", "This operation is not supported for the requested resource.");
}

export async function handleFileDownload(request: Request, response: Response, db: Db): Promise<void> {
  const identity = requestIdentity(response);
  const match = request.path.match(/^\/projects\/([^/]+)\/documents\/([^/]+)$/);
  if (!match) {
    sendError(response, 404, "not_found", "File not found.");
    return;
  }
  const projectId = safeDecode(match[1]);
  const documentId = safeDecode(match[2]);
  const file = await db.collection("documentFiles").findOne({ id: documentId, projectId });
  if (!file || typeof file.workspaceId !== "string" || !Buffer.isBuffer(file.data)) {
    sendError(response, 404, "not_found", "File not found.");
    return;
  }
  await requireWorkspaceAccess(db, identity, file.workspaceId);
  response.type(typeof file.contentType === "string" ? file.contentType : "application/octet-stream");
  response.setHeader("Content-Disposition", "attachment");
  response.send(file.data);
}

export async function handlePublicShare(request: Request, response: Response, db: Db): Promise<void> {
  const segments = request.path.split("/").filter(Boolean).map(safeDecode);
  const [shareToken, action, documentId] = segments;
  if (!shareToken) {
    sendError(response, 404, "not_found", "Shared project not found.");
    return;
  }
  const share = await db.collection("projectShares").findOne({ accessToken: shareToken });
  if (!share || share.status !== "active") {
    if (share && share.status === "revoked") {
      sendError(response, 410, "share_revoked", "This project share has been revoked.");
      return;
    }
    if (share && share.status !== "active") {
      sendError(response, 403, "share_inactive", "This project share is not active.");
      return;
    }
    response.status(404).json(null);
    return;
  }
  if (typeof share.expiresAt === "string" && Date.parse(share.expiresAt) <= Date.now()) {
    await db.collection("projectShares").updateOne(
      { id: share.id },
      { $set: { status: "revoked", updatedAt: new Date().toISOString() } },
    );
    sendError(response, 410, "share_revoked", "This project share has expired.");
    return;
  }
  if (action === "files" && documentId && request.method === "GET") {
    const permissions = share.permissions as Document | undefined;
    if (permissions?.viewDocuments !== true) {
      sendError(response, 403, "forbidden", "This shared project does not allow document downloads.");
      return;
    }
    const file = await db.collection("documentFiles").findOne({
      id: documentId,
      projectId: share.projectId,
      isShared: true,
    });
    if (!file || !Buffer.isBuffer(file.data)) {
      sendError(response, 404, "not_found", "File not found.");
      return;
    }
    response.type(typeof file.contentType === "string" ? file.contentType : "application/octet-stream");
    response.setHeader("Content-Disposition", "attachment");
    response.send(file.data);
    return;
  }
  if (action === "change-requests" && request.method === "POST") {
    const body = bodyObject(request);
    const permissions = share.permissions as Document | undefined;
    if (permissions?.submitChangeRequest !== true) {
      sendError(response, 403, "forbidden", "This shared project does not allow change requests.");
      return;
    }
    const now = new Date().toISOString();
    const change = {
      ...editableFields(body, ["ownerId", "workspaceId", "projectId"]),
      id: randomUUID(),
      ownerId: share.ownerId,
      workspaceId: share.workspaceId,
      projectId: share.projectId,
      status: "new",
      source: "client",
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("scopeChanges").insertOne(change);
    response.status(201).json(publicDocument(change));
    return;
  }
  if (request.method !== "GET" || action) {
    sendError(response, 404, "not_found", "Shared project resource not found.");
    return;
  }

  await db.collection("projectShares").updateOne(
    { id: share.id },
    { $set: { lastAccessedAt: new Date().toISOString() } },
  );
  const project = await db.collection("projects").findOne({ id: share.projectId, workspaceId: share.workspaceId });
  if (!project) {
    response.status(404).json(null);
    return;
  }
  const permissions = share.permissions as Document | undefined;
  const [tasks, requirements, changes, storedDocuments, payments, schedule, eventDetails] = await Promise.all([
    db.collection("tasks").find({ projectId: share.projectId, workspaceId: share.workspaceId }).toArray(),
    db.collection("requirements").find({ projectId: share.projectId, workspaceId: share.workspaceId }).toArray(),
    db.collection("scopeChanges").find({ projectId: share.projectId, workspaceId: share.workspaceId }).toArray(),
    permissions?.viewDocuments === true
      ? db.collection("documents").find({ projectId: share.projectId, workspaceId: share.workspaceId, isShared: true }).toArray()
      : Promise.resolve([]),
    db.collection("payments").find({ projectId: share.projectId, workspaceId: share.workspaceId }).toArray(),
    db.collection("eventScheduleItems").find({ projectId: share.projectId, workspaceId: share.workspaceId }).toArray(),
    db.collection("eventDetails").findOne({ projectId: share.projectId, workspaceId: share.workspaceId }),
  ]);
  const taskValues = permissions?.viewTasks === true
    ? tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        ...(typeof task.dueDate === "string" ? { dueDate: task.dueDate } : {}),
      }))
    : [];
  const requirementValues = permissions?.viewRequirements === true
    ? requirements.map((requirement) => ({
        id: requirement.id,
        code: requirement.code,
        title: requirement.title,
        status: requirement.status,
        description: requirement.description,
        acceptanceCriteria: requirement.acceptanceCriteria,
        type: requirement.type,
        priority: requirement.priority,
        approved: requirement.approved,
      }))
    : [];
  const changeValues = permissions?.viewChanges === true
    ? changes.map((change) => ({
        id: change.id,
        title: change.title,
        description: change.description,
        status: change.status,
        requestedDate: change.requestedDate,
        priority: change.priority,
      }))
    : [];
  const documentValues = storedDocuments.map((document) => ({
    id: document.id,
    name: document.name,
    originalName: document.originalName ?? document.name,
    fileType: document.fileType,
    size: document.size,
    description: document.description,
  }));
  const paymentValues = permissions?.viewPayments === true
    ? payments.map((payment) => ({
        id: payment.id,
        title: payment.title,
        type: payment.type,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate,
      }))
    : [];
  const calendarValues: Document[] = [];
  if (permissions?.viewCalendar === true) {
    for (const task of tasks) {
      if (typeof task.dueDate === "string") {
        calendarValues.push({ id: `task:${task.id}`, title: task.title, date: task.dueDate, type: "task_due" });
      }
    }
    for (const change of changes) {
      if (typeof change.requestedDate === "string") {
        calendarValues.push({ id: `change:${change.id}`, title: change.title, date: change.requestedDate, type: "change_requested" });
      }
    }
    for (const event of schedule) {
      if (typeof event.startDateTime === "string") {
        calendarValues.push({
          id: `event:${event.id}`,
          title: event.title,
          date: event.startDateTime.slice(0, 10),
          type: "event_schedule",
        });
      }
    }
  }
  const result: Document = {
    share: { role: share.role, permissions: share.permissions },
    project: permissions?.viewProject === false ? null : {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      startDate: project.startDate,
      deadline: project.deadline,
    },
    tasks: taskValues,
    requirements: requirementValues,
    changes: changeValues,
    calendar: calendarValues,
    documents: documentValues,
    payments: paymentValues,
    eventDetails: permissions?.viewProject === true && eventDetails
      ? {
          eventName: eventDetails.eventName,
          shortDescription: eventDetails.shortDescription,
          venue: eventDetails.venue,
          startDate: eventDetails.startDate,
          endDate: eventDetails.endDate,
        }
      : null,
  };
  response.json(result);
}
