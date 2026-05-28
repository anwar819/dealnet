"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const setUserOnline = async (userId: string) => {
    await supabase
      .from("users")
      .update({
        isOnline: true,
        lastSeen: Date.now(),
        updatedAt: Date.now(),
      })
      .eq("id", userId);
  };

  const setUserOffline = async (userId: string) => {
    await supabase
      .from("users")
      .update({
        isOnline: false,
        lastSeen: Date.now(),
        updatedAt: Date.now(),
      })
      .eq("id", userId);
  };

  useEffect(() => {
    let currentUserId = "";

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (user) {
        currentUserId = user.id;
        setHasUser(true);
        await setUserOnline(user.id);
      } else {
        currentUserId = "";
        setHasUser(false);
      }

      setAuthReady(true);
    };

    initAuth();

    const heartbeat = setInterval(async () => {
      if (currentUserId) {
        await setUserOnline(currentUserId);
      }
    }, 30000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;

      if (event === "SIGNED_OUT" || !user) {
        if (currentUserId) {
          await setUserOffline(currentUserId);
        }

        currentUserId = "";
        setHasUser(false);
        setAuthReady(true);
        return;
      }

      currentUserId = user.id;
      setHasUser(true);
      setAuthReady(true);
      await setUserOnline(user.id);
    });

    return () => {
      clearInterval(heartbeat);
      subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <>
        <Header />
        <main className="pt-4">{children}</main>
      </>
    );
  }

  return (
    <>
      <Header />

      {hasUser && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}

      <main
  key={hasUser ? "with-sidebar" : "without-sidebar"}
  className={`pt-4 transition-all duration-300 ${
    hasUser && sidebarOpen ? "md:pr-72" : "md:pr-0"
  }`}
>
  {children}
</main>
    </>
  );
}