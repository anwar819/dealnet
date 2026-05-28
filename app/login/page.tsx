"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect") || "/marketplace";
  const action = searchParams.get("action");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      alert("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        console.error(error);
        alert("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("isBlocked")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.isBlocked) {
        await supabase.auth.signOut();
        alert("تم حظر هذا الحساب من قبل الإدارة");
        return;
      }

      const target =
        action === "chat"
          ? `${redirect}?action=chat`
          : redirect;

      window.location.href = target;
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-8 text-center text-3xl font-black">
          تسجيل الدخول
        </h1>

        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="mb-4 w-full rounded-xl border border-slate-300 p-4 outline-none transition focus:border-green-500"
        />

        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="mb-6 w-full rounded-xl border border-slate-300 p-4 outline-none transition focus:border-green-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-500 py-4 font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>

        <div className="mt-5 flex items-center justify-between text-sm font-bold">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-green-600 hover:underline"
          >
            نسيت كلمة المرور؟
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/register?redirect=${redirect}${
                  action ? `&action=${action}` : ""
                }`
              )
            }
            className="text-slate-700 hover:text-green-600 hover:underline"
          >
            إنشاء حساب جديد
          </button>
        </div>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          جاري التحميل...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}