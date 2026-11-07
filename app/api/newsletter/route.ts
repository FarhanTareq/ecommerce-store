import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeEmail } from "@/lib/db/newsletter";

const schema = z.object({ email: z.email() });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Enter a valid email address" },
        { status: 400 },
      );
    }
    await subscribeEmail(parsed.data.email.trim().toLowerCase());
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not join the newsletter";
    console.error("Newsletter signup failed", error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
