"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ReviewPage() {
  const router = useRouter();
  const { userId } = useParams();

  const chatId = userId as string;

  const [currentUserId, setCurrentUserId] = useState("");
  const [chat, setChat] = useState<any>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetName, setTargetName] = useState("مستخدم");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/review/${chatId}`);
        return;
      }

      setCurrentUserId(user.id);

      const { data: chatData, error } = await supabase
        .from("chats")
        .select("*")
        .eq("chatId", chatId)
        .single();

      if (error || !chatData) {
        alert("المحادثة غير موجودة");
        router.push("/messages");
        return;
      }

      if (!chatData.users?.includes(user.id)) {
        alert("غير مصرح لك بتقييم هذه المحادثة");
        router.push("/messages");
        return;
      }

      const otherId =
        user.id === chatData.sellerId
          ? chatData.buyerId
          : chatData.sellerId;

      const otherName =
        user.id === chatData.sellerId
          ? chatData.buyerName || "المشتري"
          : chatData.sellerName || "البائع";

      setChat(chatData);
      setTargetUserId(otherId);
      setTargetName(otherName);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل صفحة التقييم");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!currentUserId || !targetUserId || !chat) return;

    if (currentUserId === targetUserId) {
      alert("لا يمكنك تقييم نفسك");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("reviews").upsert({
        reviewerId: currentUserId,
        targetUserId,
        postId: chat.postId || null,
        rating,
        comment: comment.trim(),
        createdAt: Date.now(),
      });

      if (error) {
        console.error(error);
        alert("فشل حفظ التقييم");
        return;
      }

      alert("تم حفظ التقييم بنجاح");
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ التقييم");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل التقييم...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-center text-3xl font-black">
          ⭐ تقييم {targetName}
        </h1>

        <p className="mt-3 text-center text-slate-500">
          قيّم تجربتك مع هذا المستخدم بخصوص الإعلان:
        </p>

        <p className="mt-2 text-center font-bold text-green-700">
          {chat?.postTitle || "إعلان"}
        </p>

        <div className="mt-8 flex justify-center gap-2 text-4xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition hover:scale-110"
            >
              {star <= rating ? "⭐" : "☆"}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب تعليقك عن التجربة..."
          rows={5}
          className="mt-8 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-green-500"
        />

        <button
          onClick={submitReview}
          disabled={saving}
          className="mt-5 w-full rounded-2xl bg-green-500 py-4 font-black text-white hover:bg-green-600 disabled:opacity-60"
        >
          {saving ? "جاري الحفظ..." : "حفظ التقييم"}
        </button>

        <button
          onClick={() => router.push(`/chat/${chatId}`)}
          className="mt-3 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-800"
        >
          رجوع للمحادثة
        </button>
      </div>
    </main>
  );
}