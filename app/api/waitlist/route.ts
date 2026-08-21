import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureSchema } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { sendWaitlistSignupEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid name or email" }, { status: 400 });
    }

    await ensureSchema();

    const name = parsed.data.name.trim();
    const email = parsed.data.email.toLowerCase().trim();

    let alreadyJoined = false;
    try {
      await db.insert(waitlist).values({
        name,
        email,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Unique email — still notify the farm, but don't fail the form
      alreadyJoined = true;
    }

    try {
      await sendWaitlistSignupEmail({ name, email, alreadyJoined });
    } catch (err) {
      console.error("waitlist notify email failed", err);
    }

    return NextResponse.json({ ok: true, alreadyJoined });
  } catch (err) {
    console.error("waitlist error", err);
    return NextResponse.json(
      { error: "Could not join waitlist" },
      { status: 500 },
    );
  }
}
