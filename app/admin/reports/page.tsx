"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminReportsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

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

  const hidePost = async (postId: string) => {
    if (!confirm("هل تريد إخفاء الإعلان؟")) return;

    const { error } = await supabase
      .from("posts")
      .update({
        isHidden: true,
        updatedAt: Date.now(),
      })
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("فشل إخفاء الإعلان");
      return;
    }

    alert("تم إخفاء الإعلان");
    await loadReports();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("هل تريد حذف الإعلان نهائيًا؟")) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("فشل حذف الإعلان");
      return;
    }

    alert("تم حذف الإعلان");
    await loadReports();
  };

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((item) => item.status === filter);
  }, [reports, filter]);

  const counts = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      action_taken: reports.filter((r) => r.status === "action_taken").length,
    };
  }, [reports]);

  const statusLabel = (status?: string) => {
    if (status === "resolved") return "تمت المعالجة";
    if (status === "rejected") return "مرفوض";
    if (status === "action_taken") return "تم اتخاذ إجراء";
    return "قيد المراجعة";
  };

  const statusClass = (status?: string) => {
    if (status === "resolved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-slate-200 text-slate-700";
    if (status === "action_taken") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const formatDate = (value?: number) => {
    if (!value) return "";
    return new Date(value).toLocaleString("ar-IQ");
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
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">🚨 لوحة البلاغات</h1>
          <p className="mt-2 text-slate-300">
            مراجعة بلاغات الإعلانات واتخاذ الإجراء المناسب.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-3xl p-4 text-center shadow ${
              filter === "all" ? "bg-slate-950 text-white" : "bg-white"
            }`}
          >
            <p className="text-3xl font-black">{counts.all}</p>
            <p className="mt-1 text-sm font-bold">الكل</p>
          </button>

          <button
            onClick={() => setFilter("pending")}
            className={`rounded-3xl p-4 text-center shadow ${
              filter === "pending" ? "bg-yellow-400 text-black" : "bg-white"
            }`}
          >
            <p className="text-3xl font-black">{counts.pending}</p>
            <p className="mt-1 text-sm font-bold">قيد المراجعة</p>
          </button>

          <button
            onClick={() => setFilter("resolved")}
            className={`rounded-3xl p-4 text-center shadow ${
              filter === "resolved" ? "bg-green-500 text-white" : "bg-white"
            }`}
          >
            <p className="text-3xl font-black">{counts.resolved}</p>
            <p className="mt-1 text-sm font-bold">معالجة</p>
          </button>

          <button
            onClick={() => setFilter("action_taken")}
            className={`rounded-3xl p-4 text-center shadow ${
              filter === "action_taken" ? "bg-red-500 text-white" : "bg-white"
            }`}
          >
            <p className="text-3xl font-black">{counts.action_taken}</p>
            <p className="mt-1 text-sm font-bold">إجراء</p>
          </button>

          <button
            onClick={() => setFilter("rejected")}
            className={`rounded-3xl p-4 text-center shadow ${
              filter === "rejected" ? "bg-slate-700 text-white" : "bg-white"
            }`}
          >
            <p className="text-3xl font-black">{counts.rejected}</p>
            <p className="mt-1 text-sm font-bold">مرفوضة</p>
          </button>
        </section>

        {filteredReports.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow">
            لا توجد بلاغات ضمن هذا التصنيف.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="rounded-3xl bg-white p-5 shadow">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">
                        {report.postTitle || "إعلان بدون عنوان"}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                          report.status
                        )}`}
                      >
                        {statusLabel(report.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-bold text-red-600">
                      السبب: {report.reason || "غير محدد"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      تاريخ البلاغ: {formatDate(report.createdAt)}
                    </p>

                    {report.details && (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">
                        {report.details}
                      </p>
                    )}
                  </div>

                  <div className="min-w-[220px] rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>
                      <b>Report ID:</b> {report.id}
                    </p>
                    <p className="mt-1">
                      <b>Post ID:</b> {report.postId || "غير متوفر"}
                    </p>
                    <p className="mt-1">
                      <b>User ID:</b> {report.userId || "غير متوفر"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {report.postId && (
                    <button
                      onClick={() => router.push(`/post/${report.postId}`)}
                      className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white"
                    >
                      فتح الإعلان
                    </button>
                  )}

                  {report.postId && (
                    <button
                      onClick={() => hidePost(report.postId)}
                      className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white"
                    >
                      إخفاء الإعلان
                    </button>
                  )}

                  {report.postId && (
                    <button
                      onClick={() => deletePost(report.postId)}
                      className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                    >
                      حذف الإعلان
                    </button>
                  )}

                  <button
                    onClick={() => updateStatus(report.id, "resolved")}
                    className="rounded-xl bg-green-500 px-4 py-2 font-bold text-white"
                  >
                    تمت المعالجة
                  </button>

                  <button
                    onClick={() => updateStatus(report.id, "action_taken")}
                    className="rounded-xl bg-red-500 px-4 py-2 font-bold text-white"
                  >
                    تم اتخاذ إجراء
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