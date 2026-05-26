"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setHasUser(!!data.user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasUser(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
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