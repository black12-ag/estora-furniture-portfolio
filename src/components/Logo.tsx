import iconUrl from "@/assets/estora-icon.png";

export function Logo({ variant = "dark", size = "md" }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg" }) {
  const textColor = variant === "light" ? "text-footer-foreground" : "text-foreground";
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <div className="flex items-center gap-2">
      <img
        src={iconUrl}
        alt=""
        width={40}
        height={40}
        className={`${dim} shrink-0 object-contain`}
        draggable={false}
      />
      <span className={`${text} font-extrabold tracking-tight ${textColor}`}>estora</span>
    </div>
  );
}
