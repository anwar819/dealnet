"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const reasons = [
  "احتيال أو إعلان وهمي",
  "محتوى مخالف",
  "سعر أو معلومات مضللة",
  "منتج ممنوع",
  "إساءة أو مضايقة",
  "سبب آخر",
];

export default function ReportPostPage() {
  const { postId } = useParams();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [post, setPost] = useState<any>(null);

  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [postId]);

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/report/${postId}`);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error || !data) {
        alert("الإعلان غير موجود");
        router.push("/marketplace");
        return;
      }

      setPost(data);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل صفحة البلاغ");
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    if (!userId || !post) return;

    if (post.userId === userId) {
      alert("لا يمكنك الإبلاغ عن إعلانك");
      return;
    }

    if (!reason) {
      alert("اختر سبب البلاغ");
      return;
    }

    try {
      setSending(true);

      const { error } = await supabase.from("reports").insert({
        postId: post.id,
        postTitle: post.title || "بدون عنوان",
        userId,
        reason,
        details: details.trim(),
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (error) {
        console.error(error);
        alert("فشل إرسال البلاغ");
        return;
      }

      alert("تم إرسال البلاغ وسيتم مراجعته من الإدارة");
      router.push(`/post/${post.id}`);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إرسال البلاغ");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل صفحة البلاغ...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-center text-3xl font-black">
          🚨 الإبلاغ عن إعلان
        </h1>

        <p className="mt-3 text-center text-slate-500">
          سيتم إرسال البلاغ إلى الإدارة للمراجعة.
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">الإعلان</p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {post?.title || "بدون عنوان"}
          </p>
        </div>

        <label className="mt-6 block text-sm font-bold text-slate-700">
          سبب البلاغ
        </label>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-red-500"
        >
          {reasons.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className="mt-5 block text-sm font-bold text-slate-700">
          تفاصيل إضافية
        </label>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={6}
          placeholder="اكتب تفاصيل البلاغ هنا..."
          className="mt-2 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-red-500"
        />

        <button
          onClick={submitReport}
          disabled={sending}
          className="mt-6 w-full rounded-2xl bg-red-500 py-4 font-black text-white hover:bg-red-600 disabled:opacity-60"
        >
          {sending ? "جاري إرسال البلاغ..." : "إرسال البلاغ"}
        </button>

        <button
          onClick={() => router.push(`/post/${post?.id}`)}
          className="mt-3 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-800"
        >
          رجوع للإعلان
        </button>
      </div>
    </main>
  );
}