import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // حذف المستخدم من Auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // حذف من جدول users
    await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}