import Image from "next/image";

export function MemberAvatar({ name, photoURL, size = "md" }: { name: string; photoURL?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-10 text-sm";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  return photoURL ? (
    <Image src={photoURL} alt="" width={56} height={56} unoptimized className={`${sizeClass} shrink-0 rounded-full object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-brand`}>{initials}</span>
  );
}
