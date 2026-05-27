"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      alert("يرجى إدخال البريد الإلكتروني");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://dealnet.app/reset-password",
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-3 text-center text-3xl font-black">
          نسيت كلمة المرور
        </h1>

        <p className="mb-6 text-center text-slate-500">
          أدخل بريدك الإلكتروني لإرسال رابط استعادة الحساب
        </p>

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-5 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-green-500"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full rounded-2xl bg-green-500 py-4 font-bold text-white hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
        </button>

        <button
          onClick={() => (window.location.href = "/login")}
          className="mt-4 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-800"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    </main>
  );
}