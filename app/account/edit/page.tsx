"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function EditAccountPage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login?redirect=/account/edit";
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
      }

      if (data) {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhone(data.phone || "");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل بيانات الحساب");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    if (!firstName.trim() || !lastName.trim()) {
      alert("يرجى إدخال الاسم واللقب");
      return;
    }

    if (!phone.trim()) {
      alert("يرجى إدخال رقم الهاتف");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("users").upsert({
        id: userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email,
        updatedAt: Date.now(),
      });

      if (error) {
        console.error(error);
        alert("حدث خطأ أثناء حفظ البيانات");
        return;
      }

      alert("تم حفظ بيانات الحساب");
      window.location.href = "/account";
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل بيانات الحساب...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
        <h1 className="mb-6 text-3xl font-black">تعديل الحساب</h1>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              الاسم
            </label>

            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="مثال: أنور"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              اللقب
            </label>

            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="مثال: السامري"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              رقم الهاتف / واتساب
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 0780XXXXXXX"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              البريد الإلكتروني
            </label>

            <input
              value={email}
              disabled
              className="w-full rounded-xl border border-slate-300 bg-slate-100 p-3 text-slate-500"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>

          <button
            onClick={() => (window.location.href = "/account")}
            className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800"
          >
            رجوع
          </button>
        </div>
      </div>
    </main>
  );
}