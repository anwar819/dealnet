"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const loggedIn = !!session?.user;

      setHasUser(loggedIn);
      setSidebarOpen(loggedIn);
      setReady(true);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user;

      setHasUser(loggedIn);
      setSidebarOpen(loggedIn);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Header />

      {hasUser && (
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />
      )}

      <main
        className={`transition-all duration-300 ${
          hasUser && sidebarOpen ? "md:pr-72" : "md:pr-0"
        }`}
      >
        {children}
      </main>
    </>
  );
}