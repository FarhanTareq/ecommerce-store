export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailResult =
  | { delivered: true; id: string }
  | { delivered: false; reason: "email_not_configured" };

/**
 * Email delivery is intentionally not wired to a provider yet.
 * Owner-generated reset links are shown once in the Owner Panel and shared
 * manually. This module is the single seam for adding a provider later without
 * changing callers.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  void message;
  return { delivered: false, reason: "email_not_configured" };
}

export function emailIsConfigured(): boolean {
  return false;
}
