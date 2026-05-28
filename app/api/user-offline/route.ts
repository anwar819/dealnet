import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body?.userId;

    if (!userId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await supabase
      .from("users")
      .update({
        isOnline: false,
        lastSeen: Date.now(),
        updatedAt: Date.now(),
      })
      .eq("id", userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}