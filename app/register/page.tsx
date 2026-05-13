"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect") || "/marketplace";
  const action = searchParams.get("action");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!firstName || !lastName || !phone || !email || !password) {
      alert("يرجى ملء جميع الحقول");
      return;
    }

    if (password.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?redirect=${redirect}${
            action ? `&action=${action}` : ""
          }`,
          data: {
            firstName,
            lastName,
            phone,
            role: "user",
            isAdmin: false,
            isVerified: false,
          },
        },
      });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        alert("فشل إنشاء الحساب");
        return;
      }

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          firstName,
          lastName,
          phone,
          email,
          isAdmin: false,
          isBlocked: false,
          isVerified: false,
          rating: 0,
          totalSales: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      if (insertError) {
        console.error(insertError);
        alert("تم إنشاء الحساب، لكن فشل حفظ بيانات المستخدم");
        return;
      }

      alert("تم إنشاء الحساب. يرجى فتح بريدك الإلكتروني لتأكيد الحساب.");

      router.push(
        `/login?redirect=${redirect}${action ? `&action=${action}` : ""}`
      );
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-black">إنشاء حساب</h1>

        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="الاسم الأول"
          className="mb-3 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="اسم العائلة"
          className="mb-3 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم الهاتف"
          className="mb-3 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="mb-3 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="كلمة المرور"
          className="mb-5 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <button
          onClick={register}
          disabled={loading}
          className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </button>

        <button
          onClick={() =>
            router.push(
              `/login?redirect=${redirect}${action ? `&action=${action}` : ""}`
            )
          }
          className="mt-3 w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
        >
          لدي حساب بالفعل
        </button>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">جاري التحميل...</div>}>
      <RegisterContent />
    </Suspense>
  );
}