import { parseDateOnly } from "@/lib/dates";
import { requestLocalData } from "@/lib/localData";
import type { Payment, PaymentFormValues, Project } from "@/types";

function collectionPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/payments`;
}

function recordPath(projectId: string, paymentId: string): string {
  return `${collectionPath(projectId)}/${encodeURIComponent(paymentId)}`;
}

function verifyProject(project: Project, ownerId: string): void {
  if (!project.id || project.ownerId !== ownerId || !project.workspaceId) {
    throw new Error("Project not found in this workspace.");
  }
}

function validatePaymentValues(values: PaymentFormValues): void {
  if (values.title.trim().length < 3 || values.title.trim().length > 150) throw new Error("Payment title must be between 3 and 150 characters.");
  if (!Number.isFinite(values.amount) || values.amount <= 0 || values.amount > 999_999_999_999.99) throw new Error("Enter a positive amount within the supported limit.");
  for (const date of [values.dueDate, values.paidDate]) {
    if (date && !parseDateOnly(date)) throw new Error("Enter a valid payment date.");
  }
}

function normalizedValues(values: PaymentFormValues) {
  validatePaymentValues(values);
  return {
    ...values,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    method: values.method || undefined,
    dueDate: values.dueDate || undefined,
    paidDate: values.paidDate || undefined,
    referenceNumber: values.referenceNumber?.trim() || undefined,
  };
}

export async function getWorkspacePayments(
  ownerId: string,
  workspaceId: string,
  projects: Project[],
): Promise<Payment[]> {
  const validProjects = projects.filter((project) => project.ownerId === ownerId && project.workspaceId === workspaceId);
  return (await Promise.all(validProjects.map((project) => getProjectPayments(ownerId, project))))
    .flat()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getProjectPayments(ownerId: string, project: Project): Promise<Payment[]> {
  verifyProject(project, ownerId);
  return requestLocalData<Payment[]>(collectionPath(project.id));
}

export async function getPayment(ownerId: string, project: Project, paymentId: string): Promise<Payment | null> {
  return (await getProjectPayments(ownerId, project)).find((payment) => payment.id === paymentId) ?? null;
}

export async function createPayment(ownerId: string, project: Project, values: PaymentFormValues): Promise<Payment> {
  verifyProject(project, ownerId);
  const normalized = normalizedValues(values);
  const payment = await requestLocalData<Payment>(collectionPath(project.id), {
    method: "POST",
    body: JSON.stringify(normalized),
  });
  return payment;
}

export async function updatePayment(
  ownerId: string,
  project: Project,
  paymentId: string,
  values: PaymentFormValues,
): Promise<Payment> {
  verifyProject(project, ownerId);
  if (!await getPayment(ownerId, project, paymentId)) throw new Error("Payment not found in this project.");
  return requestLocalData<Payment>(recordPath(project.id, paymentId), {
    method: "PATCH",
    body: JSON.stringify(normalizedValues(values)),
  });
}

export async function markPaymentPaid(ownerId: string, project: Project, paymentId: string): Promise<Payment> {
  verifyProject(project, ownerId);
  const existing = await getPayment(ownerId, project, paymentId);
  if (!existing) throw new Error("Payment not found in this project.");
  if (existing.status !== "pending") throw new Error("Only pending payment records can be marked as paid.");
  return requestLocalData<Payment>(recordPath(project.id, paymentId), {
    method: "PATCH",
    body: JSON.stringify({ status: "paid", paidDate: new Date().toISOString().slice(0, 10) }),
  });
}

export async function deletePayment(ownerId: string, project: Project, paymentId: string): Promise<void> {
  verifyProject(project, ownerId);
  await requestLocalData<{ deleted: boolean }>(recordPath(project.id, paymentId), { method: "DELETE" });
}
