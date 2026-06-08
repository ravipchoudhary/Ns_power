"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AppFooter } from "@/components/AppFooter";

export function AppLayoutClient({
  children,
  role,
  userName,
}: {
  children: React.ReactNode;
  role: string;
  userName: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={role}
        userName={userName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex w-full flex-col">
        {/* Mobile header with hamburger menu */}
        <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">NS Power</h1>
        </div>

        <main className="flex-1 overflow-auto px-3 py-4 sm:px-6 sm:py-6 md:p-8">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
