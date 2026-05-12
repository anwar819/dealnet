"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

export default function AdminFinancePage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists() || userSnap.data().isAdmin !== true) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);
      await loadRequests();
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const loadRequests = async () => {
    const snap = await getDocs(collection(db, "boostRequests"));

    const data = snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    setRequests(data);
  };

  const stats = useMemo(() => {
    const approved = requests.filter((r) => r.status === "approved");
    const pending = requests.filter((r) => r.status === "pending");
    const rejected = requests.filter((r) => r.status === "rejected");

    const totalRevenue = approved.reduce(
      (sum, r) => sum + Number(r.price || 0),
      0
    );

    const pendingRevenue = pending.reduce(
      (sum, r) => sum + Number(r.price || 0),
      0
    );

    return {
      totalRevenue,
      pendingRevenue,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalCount: requests.length,
    };
  }, [requests]);

  const formatDate = (value?: number) => {
    if (!value) return "غير محدد";

    return new Date(value).toLocaleString("ar-IQ", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = (status?: string) => {
    if (status === "approved") return "مقبول";
    if (status === "rejected") return "مرفوض";
    return "قيد المراجعة";
  };

  const statusClass = (status?: string) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الأرباح...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-red-600">غير مصرح</h1>
          <p className="mt-2 text-slate-500">هذه الصفحة مخصصة للإدارة فقط.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">💰 لوحة الأرباح</h1>
          <p className="mt-2 text-slate-300">
            متابعة أرباح الترويج وطلبات الدفع اليدوي.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-green-600">
              ${stats.totalRevenue}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              الأرباح المؤكدة
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-orange-500">
              ${stats.pendingRevenue}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              مبالغ قيد المراجعة
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-blue-600">
              {stats.approvedCount}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              طلبات مقبولة
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-slate-900">
              {stats.totalCount}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              إجمالي الطلبات
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-2xl font-black text-yellow-600">
              {stats.pendingCount}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              قيد المراجعة
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-2xl font-black text-green-600">
              {stats.approvedCount}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">مقبولة</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-2xl font-black text-red-600">
              {stats.rejectedCount}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">مرفوضة</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black">سجل طلبات الترويج</h2>

            <button
              onClick={() => router.push("/admin/boosts")}
              className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
            >
              طلبات الترويج
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
              لا توجد عمليات حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600">
                    <th className="p-3">الإعلان</th>
                    <th className="p-3">البائع</th>
                    <th className="p-3">الباقة</th>
                    <th className="p-3">السعر</th>
                    <th className="p-3">الدفع</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">تاريخ الطلب</th>
                    <th className="p-3">إجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {req.postTitle || "بدون عنوان"}
                      </td>

                      <td className="p-3 text-slate-600">
                        {req.sellerName || "مستخدم"}
                      </td>

                      <td className="p-3 text-slate-600">
                        {req.packageTitle || "-"}
                      </td>

                      <td className="p-3 font-black text-green-600">
                        ${req.price || 0}
                      </td>

                      <td className="p-3 text-slate-600">
                        {req.paymentMethod || "-"}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                            req.status
                          )}`}
                        >
                          {statusLabel(req.status)}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500">
                        {formatDate(req.createdAt)}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => router.push(`/post/${req.postId}`)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          فتح الإعلان
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}