"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const packages = [
  {
    id: "3days",
    title: "ترويج 3 أيام",
    days: 3,
    price: 3,
    features: [
      "ظهور أعلى السوق",
      "شارة 🔥 مروّج",
      "زيادة فرص البيع",
    ],
  },
  {
    id: "7days",
    title: "ترويج 7 أيام",
    days: 7,
    price: 5,
    features: [
      "ظهور أعلى السوق",
      "شارة 🔥 مروّج",
      "أفضلية داخل القسم",
    ],
  },
  {
    id: "30days",
    title: "ترويج 30 يوم",
    days: 30,
    price: 10,
    features: [
      "ظهور قوي",
      "شارة 🔥 مروّج",
      "أفضلية طويلة المدة",
    ],
  },
];

export default function BoostRequestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [post, setPost] = useState<any>(null);

  const [selectedPackage, setSelectedPackage] =
    useState(packages[0]);

  const [paymentMethod, setPaymentMethod] =
    useState("زين كاش");

  const [paymentNote, setPaymentNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkUserAndLoadPost();
  }, []);

  const checkUserAndLoadPost = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/boost/${id}`);
        return;
      }

      setUserId(user.id);

      await loadPost(user.id);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التحقق من الحساب");
    }
  };

  const loadPost = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("الإعلان غير موجود");
        router.push("/my-posts");
        return;
      }

      if (data.userId !== uid) {
        alert("لا يمكنك ترويج إعلان لا تملكه");
        router.push("/my-posts");
        return;
      }

      setPost(data);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تحميل الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!post || !userId) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from("boostRequests")
        .insert({
          postId: post.id,
          postTitle: post.title || "بدون عنوان",
          userId,
          sellerName: post.userName || "مستخدم",
          packageId: selectedPackage.id,
          packageTitle: selectedPackage.title,
          days: selectedPackage.days,
          price: selectedPackage.price,
          paymentMethod,
          paymentNote: paymentNote.trim(),
          status: "pending",
          createdAt: Date.now(),
        });

      if (error) {
        console.error(error);
        alert("فشل إرسال طلب الترويج");
        return;
      }

      alert(
        "تم إرسال طلب الترويج. سيتم تفعيله بعد مراجعة الدفع."
      );

      router.push("/my-posts");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إرسال طلب الترويج");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل طلب الترويج...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">
            🔥 طلب ترويج الإعلان
          </h1>

          <p className="mt-2 text-slate-300">
            اختر الباقة وأرسل الطلب. سيتم تفعيل الترويج بعد تأكيد الدفع.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">

          <h2 className="mb-2 text-xl font-black">
            الإعلان
          </h2>

          <p className="text-lg font-bold text-slate-900">
            {post?.title || "بدون عنوان"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            السعر:{" "}
            {post?.price
              ? `$${post.price}`
              : "حسب الاتفاق"}
          </p>

        </section>

        <section className="grid gap-4 md:grid-cols-3">

          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`rounded-3xl p-5 text-right shadow transition ${
                selectedPackage.id === pkg.id
                  ? "bg-orange-500 text-white ring-4 ring-orange-200"
                  : "bg-white text-slate-900 hover:-translate-y-1"
              }`}
            >
              <h3 className="text-xl font-black">
                {pkg.title}
              </h3>

              <p className="mt-3 text-3xl font-black">
                ${pkg.price}
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                {pkg.features.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </button>
          ))}

        </section>

        <section className="rounded-3xl bg-white p-6 shadow">

          <h2 className="mb-4 text-xl font-black">
            طريقة الدفع
          </h2>

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
            className="mb-4 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-orange-500"
          >
            <option>زين كاش</option>
            <option>تحويل مصرفي</option>
            <option>كاش</option>
            <option>واتساب</option>
          </select>

          <div className="mb-4 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-orange-900">

            <p className="font-black">
              تعليمات الدفع:
            </p>

            <p>
              بعد اختيار الباقة، أرسل المبلغ عبر الطريقة المختارة ثم اكتب رقم العملية أو أي ملاحظة في الحقل التالي.
            </p>

            <p className="mt-2 font-bold">
              مثال: رقم العملية / اسم المرسل / وقت التحويل
            </p>

          </div>

          <textarea
            value={paymentNote}
            onChange={(e) =>
              setPaymentNote(e.target.value)
            }
            placeholder="اكتب رقم العملية أو ملاحظة الدفع..."
            rows={4}
            className="mb-5 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-orange-500"
          />

          <button
            onClick={submitRequest}
            disabled={sending}
            className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-black text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {sending
              ? "جاري إرسال الطلب..."
              : `إرسال طلب الترويج - ${selectedPackage.title}`}
          </button>

          <button
            onClick={() =>
              router.push("/my-posts")
            }
            className="mt-3 w-full rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
          >
            رجوع إلى إعلاناتي
          </button>

        </section>
      </div>
    </main>
  );
}