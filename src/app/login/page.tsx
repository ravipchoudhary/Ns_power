"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { AppFooter } from "@/components/AppFooter";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    setLoading(false);
    if (!res.ok) {
      setError((data && data.error) || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#76B900]/10 to-white">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="hidden md:flex flex-col items-center justify-center gap-4 rounded-l-2xl bg-gradient-to-b from-white to-[#f7fbf2] p-8">
              <BrandLogo className="max-w-[320px]" priority />
              <p className="max-w-sm text-center text-sm text-gray-500">
                Inspection Management System — secure access for inspectors and administrators. Use your company credentials to sign in.
              </p>
            </div>

            <div className="flex items-center justify-center p-6">
              <div className="w-full max-w-md mt-2 md:mt-0">
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  <div className="mb-6 flex flex-col items-center gap-3 md:hidden">
                    <BrandLogo className="max-w-[260px]" priority />
                    <p className="text-sm text-gray-500">Inspection Management System</p>
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div />
                    <a href="/login/forgot" className="text-sm text-gray-500 hover:text-gray-700">
                      Forgot password?
                    </a>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
