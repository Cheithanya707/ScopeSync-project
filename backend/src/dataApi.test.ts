import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { Request, Response } from "express";
import { MongoClient } from "mongodb";
import { ensureIndexes } from "./database.js";
import { handleResource, resolveResource } from "./dataApi.js";
import type { FirebaseIdentity } from "./firebaseAuth.js";

test("resolves project, workspace, and profile routes", () => {
  assert.deepEqual(resolveResource("/v1/projects"), { collection: "projects" });
  assert.deepEqual(resolveResource("/v1/projects/project-1"), {
    collection: "projects",
    id: "project-1",
  });
  assert.deepEqual(resolveResource("/workspaces/workspace-1/members/member-1"), {
    collection: "workspaces",
    id: "workspace-1",
  });
  assert.deepEqual(resolveResource("/users/me/preferences"), { collection: "users" });
});

test("resolves nested collections and decodes resource IDs", () => {
  assert.deepEqual(resolveResource("/projects/project-1/scopeChanges/change%2F1"), {
    collection: "scopeChanges",
    projectId: "project-1",
    id: "change/1",
  });
  assert.deepEqual(resolveResource("/marketplace/applications"), {
    collection: "marketplaceApplications",
  });
  assert.deepEqual(resolveResource("/marketplace/listings/listing-1"), {
    collection: "marketplaceListings",
    id: "listing-1",
  });
});

test("rejects unknown and malformed API paths", () => {
  assert.equal(resolveResource("/unknown"), null);
  assert.equal(resolveResource("/projects/project-1/unknown"), null);
  assert.throws(() => resolveResource("/activities/%E0%A4%A"), /invalid/);
});

test("persists workspace onboarding profile in MongoDB", {
  skip: process.env.RUN_MONGODB_INTEGRATION !== "true",
}, async () => {
  const client = new MongoClient(
    process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017",
  );
  const db = client.db(`scopesync_test_${randomUUID().replaceAll("-", "")}`);
  const identity: FirebaseIdentity = {
    uid: "scopesync-integration-user",
    email: "integration@example.com",
    displayName: "Integration User",
    photoURL: null,
    providerId: "password",
  };

  const requestResource = async (path: string, method: string, body: object = {}) => {
    const request = { path, method, body, query: {} } as Request;
    let statusCode = 200;
    let responseBody: unknown;
    const response = {
      locals: { identity },
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(value: unknown) {
        responseBody = value;
        return this;
      },
    } as unknown as Response;
    const resource = resolveResource(path);
    assert.ok(resource, `Expected a resource for ${path}`);
    await handleResource(request, response, db, resource);
    return { statusCode, body: responseBody };
  };

  try {
    await client.connect();
    await ensureIndexes(db);
    assert.equal((await requestResource("/users/me", "GET")).body, null);

    const created = await requestResource("/workspaces", "POST", {
      name: "Integration Workspace",
      type: "software",
    });
    assert.equal(created.statusCode, 201);
    assert.ok(created.body && typeof created.body === "object" && "id" in created.body);
    const workspaceId = (created.body as { id: string }).id;

    await db.collection("users").insertOne({
      uid: identity.uid,
      email: identity.email,
      displayName: identity.displayName,
      workTypes: [],
      goals: [],
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    });
    assert.equal(
      (await requestResource("/users/me", "PATCH", { onboardingCompleted: true })).statusCode,
      400,
    );
    const updated = await requestResource("/users/me", "PATCH", {
      displayName: identity.displayName,
      age: 28,
      country: "United States",
      city: "Seattle",
      occupation: "Product manager",
      workTypes: ["software"],
      goals: [],
      onboardingCompleted: true,
      workspaceId,
    });
    assert.equal(updated.statusCode, 200);
    assert.equal(
      (updated.body as { onboardingCompleted: boolean }).onboardingCompleted,
      true,
    );
    const savedProfile = await requestResource("/users/me", "GET");
    assert.equal((savedProfile.body as { workspaceId: string }).workspaceId, workspaceId);
    assert.equal((savedProfile.body as { age: number }).age, 28);
    assert.equal((savedProfile.body as { occupation: string }).occupation, "Product manager");
    assert.equal((await requestResource("/users/me", "PATCH", { age: 121 })).statusCode, 400);
    assert.equal(
      (await requestResource("/users/me", "PATCH", { occupation: " ".repeat(121) })).statusCode,
      400,
    );
    assert.equal(
      (await requestResource(`/workspaces/${workspaceId}`, "GET")).statusCode,
      200,
    );
    assert.equal(
      (await requestResource("/users/me/preferences", "POST", { theme: "dark" })).statusCode,
      201,
    );
    assert.equal(
      (await requestResource("/users/me/preferences", "PATCH", { theme: "light" })).statusCode,
      200,
    );
  } finally {
    await db.dropDatabase();
    await client.close();
  }
});
