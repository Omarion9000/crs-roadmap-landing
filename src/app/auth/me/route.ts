import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email ?? "",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}