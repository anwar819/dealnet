"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    boosted: 0,
    reports: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/admin");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("isAdmin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.isAdmin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    await loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    const [{ count: users }, { count: posts }, { count: boosted }, { count: reports }] =
      await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("isBoosted", true),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

    setStats({
      users: users || 0,
      posts: posts || 0,
      boosted: boosted || 0,
      reports: reports || 0,
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل لوحة الإدارة...
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
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
          <p className="mb-2 text-sm font-black text-green-400">
            DealNet Admin
          </p>
          <h1 className="text-4xl font-black">⚡ لوحة الإدارة</h1>
          <p className="mt-3 text-slate-300">
            إدارة المستخدمين، الإعلانات، البلاغات، والترويج من مكان واحد.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-blue-600">{stats.users}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">المستخدمين</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-green-600">{stats.posts}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">الإعلانات</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-orange-500">{stats.boosted}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">المروّجة</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-red-500">{stats.reports}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">بلاغات معلقة</p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["📦 إدارة الإعلانات", "/admin/posts", "إخفاء، حذف، ترويج الإعلانات."],
            ["👥 المستخدمين", "/admin/users", "حظر، توثيق، ومراجعة المستخدمين."],
            ["🚨 البلاغات", "/admin/reports", "مراجعة بلاغات المستخدمين."],
            ["🔥 طلبات الترويج", "/admin/boosts", "قبول أو رفض طلبات الترويج."],
            ["💰 المالية", "/admin/finance", "متابعة المدفوعات والإيرادات."],
            ["🏪 العودة للسوق", "/marketplace", "الرجوع إلى واجهة المستخدم."],
          ].map(([title, href, desc]) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="rounded-[2rem] bg-white p-6 text-right shadow transition hover:-translate-y-1 hover:shadow-xl"
            >
              <h2 className="text-2xl font-black text-slate-900">{title}</h2>
              <p className="mt-3 leading-7 text-slate-500">{desc}</p>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}