"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasUser, setHasUser] = useState(false);

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

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      const user = data.user;

      setHasUser(!!user);

      if (user) {
        currentUserId = user.id;
        await setUserOnline(user.id);
      }
    };

    checkUser();

    const heartbeat = setInterval(async () => {
      if (currentUserId) {
        await setUserOnline(currentUserId);
      }
    }, 30000);

    const handleBeforeUnload = () => {
      if (currentUserId) {
        navigator.sendBeacon(
          "/api/user-offline",
          JSON.stringify({
            userId: currentUserId,
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user;

      if (!nextUser && currentUserId) {
        await setUserOffline(currentUserId);
        currentUserId = "";
        setHasUser(false);
        return;
      }

      if (nextUser) {
        currentUserId = nextUser.id;
        setHasUser(true);
        await setUserOnline(nextUser.id);
      }
    });

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      subscription.unsubscribe();

      if (currentUserId) {
        setUserOffline(currentUserId);
      }
    };
  }, []);

  return (
    <>
      <Header />

      {hasUser && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}

      <main
        className={`pt-4 transition-all duration-300 ${
          hasUser && sidebarOpen ? "md:pr-72" : "md:pr-0"
        }`}
      >
        {children}
      </main>
    </>
  );
}