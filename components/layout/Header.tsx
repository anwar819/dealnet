"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setUser(null);
      setFirstName("");
      return;
    }

    setUser(data.user);

    const { data: profile } = await supabase
      .from("users")
      .select("firstName")
      .eq("id", data.user.id)
      .single();

    setFirstName(profile?.firstName || "مستخدم");
  };

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900 bg-black text-white shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/marketplace" className="text-3xl font-black tracking-tight">
          <span className="text-green-400">Deal</span>
          <span className="text-white">Net</span>
        </Link>

        {user ? (
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold transition hover:bg-slate-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
              {firstName ? firstName.charAt(0).toUpperCase() : "U"}
            </span>
            <span>{firstName}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold transition hover:bg-green-600"
            >
              تسجيل الدخول
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-slate-200"
            >
              إنشاء حساب
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}