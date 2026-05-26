"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminReportsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/admin/reports");
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
    await loadReports();
    setLoading(false);
  };

  const loadReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      console.error(error);
      setReports([]);
      return;
    }

    setReports(data || []);
  };

  const updateStatus = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        updatedAt: Date.now(),
      })
      .eq("id", reportId);

    if (error) {
      console.error(error);
      alert("فشل تحديث البلاغ");
      return;
    }

    await loadReports();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري التحميل...
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
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">🚨 لوحة البلاغات</h1>
          <p className="mt-2 text-slate-300">إدارة بلاغات المستخدمين.</p>
        </section>

        {reports.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow">
            لا توجد بلاغات حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-3xl bg-white p-5 shadow">
                <h2 className="text-xl font-black">
                  {report.postTitle || "إعلان بدون عنوان"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  السبب: {report.reason || "غير محدد"}
                </p>

                {report.details && (
                  <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-slate-700">
                    {report.details}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/post/${report.postId}`)}
                    className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white"
                  >
                    فتح الإعلان
                  </button>

                  <button
                    onClick={() => updateStatus(report.id, "resolved")}
                    className="rounded-xl bg-green-500 px-4 py-2 font-bold text-white"
                  >
                    تمت المعالجة
                  </button>

                  <button
                    onClick={() => updateStatus(report.id, "rejected")}
                    className="rounded-xl bg-slate-700 px-4 py-2 font-bold text-white"
                  >
                    رفض البلاغ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}