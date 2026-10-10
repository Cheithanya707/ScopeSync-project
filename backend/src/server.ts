import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import helmet from "helmet";
import {
  closeDatabase,
  ensureIndexes,
  getDatabase,
} from "./database.js";
import {
  handleFileDownload,
  handlePublicShare,
  handleResource,
  documentUpload,
  resolveResource,
} from "./dataApi.js";
import {
  requireFirebaseUser,
  verifyFirebaseIdToken,
} from "./firebaseAuth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { captureJson, enforceChangeWorkflow, recordMutation } from "./scope/mutationHooks.js";
import { createPublicScopeRouter } from "./scope/publicRoutes.js";
import { createScopeRouter } from "./scope/routes.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3101")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: false, limit: "12mb" }));
app.use("/api/auth", rateLimit({ name: "auth", windowMs: 60_000, max: 30 }));
app.use("/api/public", rateLimit({ name: "public", windowMs: 60_000, max: 120 }));
app.use("/api", rateLimit({ name: "api", windowMs: 60_000, max: 900 }));

function errorResponse(response: Response, status: number, code: string, message: string): void {
  response.status(status).json({ error: { code, message } });
}

app.get("/api/health", async (_request, response, next) => {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/session", async (request: Request, response: Response, next) => {
  try {
    if (!request.body || typeof request.body.idToken !== "string") {
      errorResponse(response, 400, "missing_id_token", "Firebase did not provide a sign-in token.");
      return;
    }
    const identity = await verifyFirebaseIdToken(request.body.idToken);
    const db = await getDatabase();
    const users = db.collection("users");
    const existing = await users.findOne({ uid: identity.uid });
    const now = new Date().toISOString();
    const profile = await users.findOneAndUpdate(
      { uid: identity.uid },
      {
        $set: {
          email: identity.email,
          ...(existing?.photoURL || identity.photoURL
            ? { photoURL: identity.photoURL ?? existing?.photoURL }
            : {}),
          lastSignInAt: now,
        },
        $setOnInsert: {
          uid: identity.uid,
          displayName: identity.displayName ?? identity.email.split("@")[0],
          workTypes: [],
          goals: [],
          onboardingCompleted: false,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (!profile) {
      errorResponse(response, 500, "profile_sync_failed", "Your account profile could not be saved.");
      return;
    }
    const user = {
      uid: identity.uid,
      email: identity.email,
      displayName: typeof profile.displayName === "string" ? profile.displayName : identity.displayName,
      photoURL: typeof profile.photoURL === "string" ? profile.photoURL : identity.photoURL,
      ...(typeof profile.workspaceId === "string" ? { workspaceId: profile.workspaceId } : {}),
      onboardingCompleted: profile.onboardingCompleted === true,
      metadata: {
        creationTime: typeof profile.createdAt === "string" ? profile.createdAt : now,
        lastSignInTime: now,
      },
      providerData: [{ providerId: identity.providerId }],
    };
    response.json({ accessToken: request.body.idToken, user });
  } catch (error) {
    next(error);
  }
});

app.use("/api/data", requireFirebaseUser, documentUpload, async (
  request: Request,
  response: Response,
  next,
) => {
  try {
    const resource = resolveResource(request.path);
    if (!resource) {
      errorResponse(response, 404, "not_found", "The requested API resource does not exist.");
      return;
    }
    const db = await getDatabase();
    await enforceChangeWorkflow(request, response, db, resource);
    const captured = captureJson(response);
    await handleResource(request, response, db, resource);
    await recordMutation(request, response, db, resource, captured.body());
  } catch (error) {
    next(error);
  }
});

app.use("/api/scope", requireFirebaseUser, createScopeRouter());

app.use("/api/files", requireFirebaseUser, async (request, response, next) => {
  try {
    await handleFileDownload(request, response, await getDatabase());
  } catch (error) {
    next(error);
  }
});

app.use("/api/public/shares", createPublicScopeRouter());

app.use("/api/public/shares", async (request, response, next) => {
  try {
    await handlePublicShare(request, response, await getDatabase());
  } catch (error) {
    next(error);
  }
});

app.use((_request, response) => {
  errorResponse(response, 404, "not_found", "The requested API route does not exist.");
});

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  void _next;
  const status = error && typeof error === "object" && "status" in error &&
    typeof error.status === "number"
    ? error.status
    : error instanceof Error && error.name === "MulterError" ? 400 : 500;
  const code = error && typeof error === "object" && "code" in error &&
    typeof error.code === "string"
    ? error.code
    : status === 400 ? "invalid_request" : "internal_error";
  const message = status < 500 && error instanceof Error
    ? error.message
    : status === 400 ? "The uploaded file is not valid or exceeds the 5 MB limit." : "The API could not complete this request.";
  if (status >= 500) console.error("ScopeSync API request failed:", error);
  errorResponse(response, status, code, message);
};
app.use(errorHandler);

async function start(): Promise<void> {
  const db = await getDatabase();
  await ensureIndexes(db);
  const server = app.listen(port, "127.0.0.1", () => {
    console.info(`ScopeSync API listening on http://127.0.0.1:${port}`);
  });

  const shutdown = () => {
    server.close((error) => {
      void closeDatabase().then(() => {
        if (error) {
          console.error("Could not shut down the ScopeSync API cleanly:", error);
          process.exitCode = 1;
        }
      });
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void start().catch((error: unknown) => {
  console.error(
    "ScopeSync API could not start. Confirm MongoDB is running and the backend environment is valid.",
    error,
  );
  process.exitCode = 1;
});
