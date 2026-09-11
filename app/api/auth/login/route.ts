import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid email/mobile and password." },
      { status: 400 },
    );
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      {
        error:
          "Authentication is ready but Supabase environment variables are not configured.",
      },
      { status: 503 },
    );
  const id = parsed.data.identifier.trim();
  const admin = createAdminClient();
  let credentials: { email: string; password: string } | { phone: string; password: string };
  if (id.includes("@")) {
    credentials = { email: id, password: parsed.data.password };
  } else {
    const phone = id.startsWith("+") ? id : `+91${id}`;
    const profile = admin
      ? await admin
          .from("profiles")
          .select("email")
          .in("mobile", [...new Set([id, phone])])
          .maybeSingle()
      : null;
    credentials = profile?.data?.email
      ? { email: profile.data.email, password: parsed.data.password }
      : { phone, password: parsed.data.password };
  }
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error || !data.user)
    return NextResponse.json(
      { error: "Email/mobile or password is incorrect." },
      { status: 401 },
    );
  if (admin) {
    const metadata = data.user.user_metadata ?? {};
    await admin
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: String(
            metadata.full_name ??
              data.user.email?.split("@")[0] ??
              "GiftsByRashii customer",
          ),
          mobile: String(metadata.mobile ?? data.user.phone ?? "") || null,
          email: data.user.email ?? null,
        },
        { onConflict: "id" },
      );
  }
  return NextResponse.json({ ok: true });
}
