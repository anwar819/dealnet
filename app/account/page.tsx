"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function AccountPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState<any>(null);

  const [postsCount, setPostsCount] = useState(0);
  const [chatsCount, setChatsCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }

      await loadStats(user.uid);

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const loadStats = async (uid: string) => {
    const postsQ = query(collection(db, "posts"), where("userId", "==", uid));
    const postsSnap = await getDocs(postsQ);
    setPostsCount(postsSnap.size);

    const chatsQ = query(
      collection(db, "chats"),
      where("users", "array-contains", uid)
    );
    const chatsSnap = await getDocs(chatsQ);
    setChatsCount(chatsSnap.size);

    const ratingsQ = query(
      collection(db, "ratings"),
      where("sellerId", "==", uid)
    );
    const ratingsSnap = await getDocs(ratingsQ);

    const ratings = ratingsSnap.docs.map((item) =>
      Number(item.data().rating || 0)
    );

    setRatingsCount(ratings.length);

    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
        : 0;

    setAvgRating(avg);
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الحساب...
      </main>
    );
  }

  if (!userData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        لم يتم العثور على بيانات الحساب
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-3xl font-black">
                {(userData.firstName || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-3xl font-black">
                  {userData.firstName || "مستخدم"} {userData.lastName || ""}
                </h1>

                <p className="mt-1 text-slate-300">{userData.email}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {userData.isVerified ? (
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                      ⭐ بائع موثوق
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                      غير موثق
                    </span>
                  )}

                  {userData.isAdmin && (
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                      ⚡ مدير النظام
                    </span>
                  )}

                  {userData.isBlocked && (
                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      🚫 محظور
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/create-post")}
                className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white hover:bg-green-600"
              >
                + نشر إعلان
              </button>

              <button
                onClick={logout}
                className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-slate-900">{postsCount}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">إعلاناتي</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-slate-900">{chatsCount}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">محادثاتي</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-yellow-500">
              {avgRating.toFixed(1)} ⭐
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">
              متوسط التقييم
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-black text-slate-900">
              {ratingsCount}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">عدد التقييمات</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-black">معلومات الحساب</h2>

            <div className="space-y-3 text-slate-700">
              <p>
                <b>الاسم:</b> {userData.firstName} {userData.lastName}
              </p>

              <p>
                <b>البريد:</b> {userData.email}
              </p>

              <p>
                <b>الهاتف:</b> {userData.phone || "غير مضاف"}
              </p>

              <p>
                <b>تاريخ الانضمام:</b>{" "}
                {userData.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString("ar-IQ")
                  : "غير معروف"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-black">إجراءات سريعة</h2>

            <div className="grid gap-3">
              <button
                onClick={() => router.push("/marketplace")}
                className="rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
              >
                تصفح السوق
              </button>

              <button
                onClick={() => router.push("/messages")}
                className="rounded-xl bg-blue-500 py-3 font-bold text-white hover:bg-blue-600"
              >
                الرسائل
              </button>

              <button
                onClick={() => router.push("/favorites")}
                className="rounded-xl bg-red-500 py-3 font-bold text-white hover:bg-red-600"
              >
                المفضلة
              </button>

              <button
                onClick={() => router.push("/create-post")}
                className="rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600"
              >
                نشر إعلان جديد
              </button>
            </div>
          </div>
        </section>

        {userData.isAdmin && (
          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-black">لوحة الإدارة</h2>

            <div className="grid gap-3 md:grid-cols-3">
              <button
                onClick={() => router.push("/admin/posts")}
                className="rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-500"
              >
                📦 إدارة الإعلانات
              </button>

              <button
                onClick={() => router.push("/admin/users")}
                className="rounded-xl bg-blue-500 py-3 font-bold text-white hover:bg-blue-600"
              >
                👥 إدارة المستخدمين
              </button>

              <button
                onClick={() => router.push("/admin/reports")}
                className="rounded-xl bg-red-500 py-3 font-bold text-white hover:bg-red-600"
              >
                🚨 البلاغات
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}