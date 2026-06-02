import Image from "next/image";
import { LOGO_PATH } from "@/lib/branding";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_PATH}
      alt="NS Power Solution"
      width={280}
      height={72}
      priority={priority}
      className={cn("h-auto w-full max-w-[280px] object-contain", className)}
    />
  );
}
