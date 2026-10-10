import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload } from "jose";

export type FirebaseIdentity = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
};

declare global {
  // Express declaration merging requires a namespace to extend response locals.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      identity?: FirebaseIdentity;
    }
  }
}

const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function projectId(): string {
  const value = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!value || value.startsWith("replace-with-")) {
    throw new Error("FIREBASE_PROJECT_ID is required to verify Firebase ID tokens.");
  }
  return value;
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdentity> {
  const firebaseProjectId = projectId();
  const { payload } = await jwtVerify(token, firebaseKeys, {
    algorithms: ["RS256"],
    audience: firebaseProjectId,
    issuer: `https://securetoken.google.com/${firebaseProjectId}`,
  });
  return identityFromPayload(payload);
}

function identityFromPayload(payload: JWTPayload): FirebaseIdentity {
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new errors.JWTInvalid("Firebase token is missing a user subject.");
  }
  if (typeof payload.email !== "string" || !payload.email) {
    throw new errors.JWTInvalid("Firebase account must have an email address.");
  }

  const firebase = payload.firebase;
  const providerId = firebase && typeof firebase === "object" &&
    "sign_in_provider" in firebase && typeof firebase.sign_in_provider === "string"
    ? firebase.sign_in_provider
    : "firebase";
  return {
    uid: payload.sub,
    email: payload.email,
    displayName: typeof payload.name === "string" ? payload.name : null,
    photoURL: typeof payload.picture === "string" ? payload.picture : null,
    providerId,
  };
}

export async function requireFirebaseUser(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    response.status(401).json({ error: { code: "unauthorized", message: "Sign in to continue." } });
    return;
  }

  try {
    response.locals.identity = await verifyFirebaseIdToken(match[1]);
    next();
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      response.status(401).json({ error: { code: "invalid_token", message: "Your sign-in has expired. Sign in again." } });
      return;
    }
    next(error);
  }
}
