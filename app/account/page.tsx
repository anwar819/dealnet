"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AccountPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    const { data: authData } = await supabase.auth.getUser();

    const user = authData.user;

    if (!user) {
      router.push("/login?redirect=/account");
      return;
    }

    let { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      const firstName =
        user.user_metadata?.firstName ||
        user.user_metadata?.first_name ||
        "مستخدم";

      const lastName =
        user.user_metadata?.lastName ||
        user.user_metadata?.last_name ||
        "";

      const phone = user.user_metadata?.phone || "";

      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            id: user.id,
            firstName,
            lastName,
            phone,
            email: user.email,
            isAdmin: false,
            isBlocked: false,
            isVerified: false,
            rating: 0,
            totalSales: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ])
        .select("*")
        .single();

      if (insertError) {
        console.error(insertError);
        setUserData({
          firstName,
          lastName,
          phone,
          email: user.email,
          isAdmin: false,
          isBlocked: false,
          isVerified: false,
          createdAt: Date.now(),
        });
      } else {
        setUserData(newProfile);
      }
    } else {
      setUserData(profile);
    }

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        جاري تحميل الحساب...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-black">
            {userData?.firstName || "مستخدم"} {userData?.lastName || ""}
          </h1>

          <p className="mt-2 text-slate-300">{userData?.email}</p>
          <p className="mt-1 text-slate-300">
            الهاتف: {userData?.phone || "غير مضاف"}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => router.push("/create-post")}
              className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white"
            >
              + نشر إعلان
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white"
            >
              تسجيل خروج
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}