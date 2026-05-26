"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminUsers() {
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/admin/users");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("isAdmin")
      .eq("id", user.id)
      .single();

    if (!profile?.isAdmin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error(error);
      setUsers([]);
      return;
    }

    setUsers(data || []);
  };

  const toggleBlock = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("users")
      .update({ isBlocked: !current })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل تعديل الحظر");
      return;
    }

    await loadUsers();
  };

  const toggleVerify = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("users")
      .update({ isVerified: !current })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل تعديل التوثيق");
      return;
    }

    await loadUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("هل تريد حذف الحساب من جدول المستخدمين؟")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("فشل حذف الحساب");
      return;
    }

    setUsers(users.filter((u) => u.id !== id));
    alert("تم حذف الحساب من جدول المستخدمين");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل المستخدمين...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-red-600">غير مصرح</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">👥 إدارة المستخدمين</h1>
          <p className="mt-2 text-slate-300">
            إدارة الحسابات، الحظر، التوثيق، وحذف الحسابات.
          </p>
        </section>

        <div className="space-y-4">
          {users.map((u) => (
            <div key={u.id} className="rounded-3xl bg-white p-5 shadow">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {u.firstName || "مستخدم"} {u.lastName || ""}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">{u.email}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    الهاتف: {u.phone || "غير مضاف"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {u.isAdmin && (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                        ⚡ مدير النظام
                      </span>
                    )}

                    {u.isVerified && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        ⭐ موثق
                      </span>
                    )}

                    {u.isBlocked && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        🚫 محظور
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleBlock(u.id, u.isBlocked)}
                    className="rounded-xl bg-red-500 px-4 py-2 font-bold text-white"
                  >
                    {u.isBlocked ? "فك الحظر" : "حظر"}
                  </button>

                  <button
                    onClick={() => toggleVerify(u.id, u.isVerified)}
                    className="rounded-xl bg-green-500 px-4 py-2 font-bold text-white"
                  >
                    {u.isVerified ? "إلغاء التوثيق" : "توثيق"}
                  </button>

                  <button
                    onClick={() => deleteUser(u.id)}
                    className="rounded-xl bg-black px-4 py-2 font-bold text-white"
                  >
                    حذف الحساب
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow">
            لا يوجد مستخدمون حالياً.
          </div>
        )}
      </div>
    </main>
  );
}