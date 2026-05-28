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
    if (!email || !password) {
      alert("يرجى إدخال البريد وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error(error);
        alert("بيانات الدخول غير صحيحة أو البريد غير موثق");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("isBlocked")
        .eq("id", data.user.id)
        .single();

      if (profile?.isBlocked) {
        await supabase.auth.signOut();
        alert("تم حظر هذا الحساب من قبل الإدارة");
        return;
      }

      const target = action === "chat" ? `${redirect}?action=chat` : redirect;

router.push(target);
router.refresh();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-black">تسجيل الدخول</h1>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="mb-3 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <input
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      login();
    }
  }}
  type="password"
  placeholder="كلمة المرور"
  className="mb-5 w-full rounded-xl border p-3 outline-none focus:border-green-500"
/>

        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "جاري الدخول..." : "دخول"}
        </button>
         <div className="mt-4 flex items-center justify-between text-sm font-bold">
  <button
    onClick={() => (window.location.href = "/forgot-password")}
    className="text-green-600 hover:underline"
  >
    نسيت كلمة المرور؟
  </button>

  <button
    onClick={() =>
      router.push(
        `/register?redirect=${redirect}${action ? `&action=${action}` : ""}`
      )
    }
    className="text-slate-700 hover:text-green-600 hover:underline"
  >
    إنشاء حساب جديد
  </button>
</div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">جاري التحميل...</div>}>
      <LoginContent />
    </Suspense>
  );
}