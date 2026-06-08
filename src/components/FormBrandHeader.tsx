import { BrandLogo } from "@/components/BrandLogo";

export function FormBrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-[#76B900]/25 bg-gradient-to-br from-[#76B900]/8 via-white to-white p-3 sm:p-5 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo className="max-w-[200px] sm:max-w-[240px]" priority />
        <div>
          <h1 className="text-base font-bold text-gray-900 sm:text-lg lg:text-xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
