"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Sidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setFirstName("");
        setIsAdmin(false);
        setReady(true);
        return;
      }

      await loadUser(session.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initialize = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setReady(true);
      return;
    }

    await loadUser(session.user);
  };

  const loadUser = async (authUser: any) => {
    try {
      setUser(authUser);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error(error);
      }

      if (data) {
        setFirstName(data.firstName || "مستخدم");
        setIsAdmin(data.isAdmin === true);
      }

      setReady(true);
    } catch (error) {
      console.error(error);
      setReady(true);
    }
  };

 const logout = async () => {
  try {
    setOpen(false);
    setUser(null);
    setFirstName("");
    setIsAdmin(false);

    await supabase.auth.signOut({ scope: "local" });

    window.location.href = `/?logout=${Date.now()}`;
  } catch (error) {
    console.error(error);
    alert("فشل تسجيل الخروج");
  }
};

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin")) return "لوحة الإدارة";
    if (pathname.startsWith("/marketplace")) return "السوق";
    if (pathname.startsWith("/create-post")) return "نشر إعلان";
    if (pathname.startsWith("/messages")) return "الرسائل";
    if (pathname.startsWith("/favorites")) return "المفضلة";
    if (pathname.startsWith("/account")) return "الحساب";
    return "DealNet";
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkClass = (href: string) =>
    `block rounded-xl px-4 py-3 font-bold transition ${
      isActive(href)
        ? "bg-green-500 text-white"
        : "hover:bg-slate-900 hover:text-green-400"
    }`;

  if (!ready) return null;

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-20 z-[70] flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white shadow-lg"
      >
        {open ? "×" : "☰"}
      </button>

      <aside
        className={`fixed right-0 top-16 z-[60] h-[calc(100%-4rem)] w-72 bg-black/95 text-white shadow-2xl transition-all duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto p-5">
          <div>
            <div className="mb-5 rounded-2xl bg-slate-900 p-4 text-center">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-lg font-black">
                  {firstName?.charAt(0) || "م"}
                </div>
              </div>

              <div className="font-bold">
                {firstName || "مستخدم"}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {isAdmin ? "⚡ مدير النظام" : "مستخدم"}
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-green-400">
              {pageTitle}
            </div>

            <nav className="space-y-2 text-sm">
              {!pathname.startsWith("/admin") ? (
                <>
                  <Link href="/marketplace" className={linkClass("/marketplace")}>
                    🏪 السوق
                  </Link>

                  <Link href="/create-post" className={linkClass("/create-post")}>
                    ➕ نشر إعلان
                  </Link>

                  <Link href="/my-posts" className={linkClass("/my-posts")}>
                    📦 إعلاناتي
                  </Link>

                  <Link href="/favorites" className={linkClass("/favorites")}>
                    ❤️ المفضلة
                  </Link>

                  <Link href="/messages" className={linkClass("/messages")}>
                    📩 الرسائل
                  </Link>

                  <Link href="/notifications" className={linkClass("/notifications")}>
                    🔔 الإشعارات
                  </Link>

                  <Link href="/account" className={linkClass("/account")}>
                    👤 حسابي
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/admin/posts" className={linkClass("/admin/posts")}>
                    📦 إدارة الإعلانات
                  </Link>

                  <Link href="/admin/users" className={linkClass("/admin/users")}>
                    👥 المستخدمين
                  </Link>

                  <Link href="/admin/reports" className={linkClass("/admin/reports")}>
                    🚨 البلاغات
                  </Link>

                  <Link href="/marketplace" className={linkClass("/marketplace")}>
                    🏪 العودة للسوق
                  </Link>
                </>
              )}

              {isAdmin && !pathname.startsWith("/admin") && (
                <>
                  <hr className="my-4 border-slate-800" />

                  <Link
                    href="/admin/posts"
                    className="block rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black"
                  >
                    ⚡ لوحة الإدارة
                  </Link>
                </>
              )}
            </nav>
          </div>

          <button
            onClick={logout}
            className="mt-6 w-full rounded-xl bg-red-500 py-3 text-sm font-bold hover:bg-red-600"
          >
            تسجيل خروج
          </button>
        </div>
      </aside>
    </>
  );
}