"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui";

export default function ForgotPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#76B900]/10 to-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo className="max-w-[220px]" priority />
          <h1 className="text-lg font-medium">Forgot your password?</h1>
          <p className="text-center text-sm text-gray-600">
            If you forgot your password, please contact your administrator to reset it.
          </p>
          <div className="w-full pt-4">
            <Link href="/login">
              <Button className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
