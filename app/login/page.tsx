"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = searchParams.get("redirect") || "/marketplace";
  const action = searchParams.get("action");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email || !password) {
      alert("يرجى إدخال البريد وكلمة المرور");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (action === "chat") {
        router.push(`${redirect}?action=chat`);
      } else {
        router.push(redirect);
      }
    } catch (error) {
      alert("بيانات الدخول غير صحيحة");
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
          type="password"
          placeholder="كلمة المرور"
          className="mb-5 w-full rounded-xl border p-3 outline-none focus:border-green-500"
        />

        <button
          onClick={login}
          className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600"
        >
          دخول
        </button>

        <button
          onClick={() => router.push(`/register?redirect=${redirect}${action ? `&action=${action}` : ""}`)}
          className="mt-3 w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
        >
          إنشاء حساب
        </button>
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