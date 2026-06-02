import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-[#76B900] text-white hover:bg-[#5f9400]",
    secondary: "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#76B900] focus:outline-none focus:ring-1 focus:ring-[#76B900]",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <textarea
        className={cn(
          "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#76B900] focus:outline-none focus:ring-1 focus:ring-[#76B900]",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Card({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      {title && (
        <h2 className="mb-4 border-b border-gray-100 pb-2 text-lg font-semibold text-gray-900">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <select
        className={cn(
          "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#76B900] focus:outline-none focus:ring-1 focus:ring-[#76B900]",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-[#76B900]/20 bg-gradient-to-r from-[#76B900]/10 to-white px-5 py-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function OptionGroup({
  label,
  name,
  value,
  options,
  onChange,
  disabled,
  columns = 2,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  columns?: number;
}) {
  return (
    <fieldset className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <legend className="text-sm font-medium text-gray-800">{label}</legend>
      <div
        className={cn(
          "mt-2 grid gap-2",
          columns === 3 && "sm:grid-cols-3",
          columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
          columns === 2 && "sm:grid-cols-2"
        )}
      >
        {options.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition",
              value === opt
                ? "border-[#76B900] bg-[#76B900]/10 text-[#3d5f00]"
                : "border-transparent bg-white hover:border-gray-200"
            )}
          >
            <input
              type="radio"
              name={name}
              checked={value === opt}
              onChange={() => onChange(opt)}
              disabled={disabled}
              className="accent-[#76B900]"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "gray" | "blue";
}) {
  const tones = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
