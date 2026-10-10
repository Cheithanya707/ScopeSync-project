export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  type: string;
  description?: string;
  logoURL?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
