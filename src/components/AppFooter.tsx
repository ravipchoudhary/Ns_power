import { ENCOGIX_URL, FOOTER_DEVELOPER } from "@/lib/branding";

export function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500 ${className}`}
    >
      Developed by{" "}
      <a
        href={ENCOGIX_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-gray-800 underline-offset-2 hover:text-[#76B900] hover:underline"
      >
        {FOOTER_DEVELOPER}
      </a>
    </footer>
  );
}
