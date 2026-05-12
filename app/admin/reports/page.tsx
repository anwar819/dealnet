"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminReportsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : null;

      if (!userData?.isAdmin) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);
      await loadReports();
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loadReports = async () => {
    const snap = await getDocs(collection(db, "reports"));

    const data = snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    setReports(data);
  };

  const updateStatus = async (reportId: string, status: string) => {
    await updateDoc(doc(db, "reports", reportId), {
      status,
      updatedAt: Date.now(),
    });

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
          <p className="mt-2 text-slate-500">
            هذه الصفحة مخصصة للإدارة فقط.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black">🚨 لوحة البلاغات</h1>

          <button
            onClick={() => router.push("/marketplace")}
            className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white"
          >
            الرجوع للسوق
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow">
            لا توجد بلاغات حاليًا.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-3xl bg-white p-5 shadow"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">
                      {report.postTitle || "إعلان بدون عنوان"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      السبب: {report.reason}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1 text-sm font-bold ${
                      report.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : report.status === "rejected"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {report.status === "resolved"
                      ? "تمت المعالجة"
                      : report.status === "rejected"
                      ? "مرفوض"
                      : "قيد المراجعة"}
                  </span>
                </div>

                {report.details && (
                  <p className="mb-4 rounded-2xl bg-slate-50 p-4 text-slate-700">
                    {report.details}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
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