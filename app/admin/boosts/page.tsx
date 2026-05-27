"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminBoostsPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || profile.isAdmin !== true) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);

      await loadRequests();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التحقق من الإدارة");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("boostRequests")
        .select("*")
        .order("createdAt", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const approveRequest = async (req: any) => {
    if (!confirm("هل تريد قبول طلب الترويج وتفعيل الإعلان؟")) return;

    try {
      const now = Date.now();

      const expiresAt =
        now +
        Number(req.days || 3) *
          24 *
          60 *
          60 *
          1000;

      const { error: postError } = await supabase
        .from("posts")
        .update({
          isBoosted: true,
          isHidden: false,
          boostedAt: now,
          boostExpiresAt: expiresAt,
          createdAt: now,
        })
        .eq("id", req.postId);

      if (postError) {
        console.error(postError);
        alert("فشل تفعيل الترويج");
        return;
      }

      const { error: requestError } = await supabase
        .from("boostRequests")
        .update({
          status: "approved",
          approvedAt: now,
          boostExpiresAt: expiresAt,
        })
        .eq("id", req.id);

      if (requestError) {
        console.error(requestError);
        alert("فشل تحديث الطلب");
        return;
      }

      alert("تم قبول الطلب وتفعيل الترويج 🔥");

      await loadRequests();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء قبول الطلب");
    }
  };

  const rejectRequest = async (req: any) => {
    if (!confirm("هل تريد رفض طلب الترويج؟")) return;

    try {
      const { error } = await supabase
        .from("boostRequests")
        .update({
          status: "rejected",
          rejectedAt: Date.now(),
        })
        .eq("id", req.id);

      if (error) {
        console.error(error);
        alert("فشل رفض الطلب");
        return;
      }

      alert("تم رفض الطلب");

      await loadRequests();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء رفض الطلب");
    }
  };

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
          <h1 className="text-2xl font-black text-red-600">
            غير مصرح
          </h1>

          <p className="mt-2 text-slate-500">
            هذه الصفحة مخصصة للإدارة فقط.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">

        <section className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">
            🔥 طلبات الترويج
          </h1>

          <p className="mt-2 text-slate-300">
            راجع طلبات الترويج وفعّلها بعد تأكيد الدفع.
          </p>
        </section>

        {requests.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <p className="text-xl font-black text-slate-800">
              لا توجد طلبات ترويج حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-3xl bg-white p-5 shadow"
              >

                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">

                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {req.postTitle || "إعلان بدون عنوان"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      البائع: {req.sellerName || "مستخدم"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      تاريخ الطلب: {formatDate(req.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-1 text-sm font-bold ${
                      req.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : req.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {req.status === "approved"
                      ? "مقبول"
                      : req.status === "rejected"
                      ? "مرفوض"
                      : "قيد المراجعة"}
                  </span>

                </div>

                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-2">

                  <p>
                    <b>الباقة:</b> {req.packageTitle}
                  </p>

                  <p>
                    <b>المدة:</b> {req.days} أيام
                  </p>

                  <p>
                    <b>السعر:</b> ${req.price}
                  </p>

                  <p>
                    <b>طريقة الدفع:</b> {req.paymentMethod}
                  </p>

                </div>

                {req.paymentNote && (
                  <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm text-orange-900">

                    <p className="font-black">
                      ملاحظة الدفع:
                    </p>

                    <p className="mt-2">
                      {req.paymentNote}
                    </p>

                  </div>
                )}

                {req.status === "approved" && (
                  <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm text-green-800">

                    <b>ينتهي الترويج:</b>{" "}
                    {formatDate(req.boostExpiresAt)}

                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      router.push(`/post/${req.postId}`)
                    }
                    className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                  >
                    فتح الإعلان
                  </button>

                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          approveRequest(req)
                        }
                        className="rounded-xl bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600"
                      >
                        قبول وتفعيل
                      </button>

                      <button
                        onClick={() =>
                          rejectRequest(req)
                        }
                        className="rounded-xl bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
                      >
                        رفض
                      </button>
                    </>
                  )}

                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}