"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setHasUser(!!user);
    });

    return () => unsub();
  }, []);

  return (
    <>
      <Header />

      {hasUser && (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

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