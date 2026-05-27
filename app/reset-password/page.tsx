"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      alert("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("تم تغيير كلمة المرور بنجاح");
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-3 text-center text-3xl font-black">
          تغيير كلمة المرور
        </h1>

        <p className="mb-6 text-center text-slate-500">
          أدخل كلمة المرور الجديدة ثم أكدها
        </p>

        <input
          type="password"
          placeholder="كلمة المرور الجديدة"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-green-500"
        />

        <input
          type="password"
          placeholder="تأكيد كلمة المرور"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mb-5 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-green-500"
        />

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full rounded-2xl bg-green-500 py-4 font-bold text-white hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
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