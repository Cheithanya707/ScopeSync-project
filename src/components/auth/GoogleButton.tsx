import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/src/ui/InlineLoader";

type GoogleButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function GoogleButton({ label, onClick, disabled = false }: GoogleButtonProps) {
  const isLoading = label.startsWith("Connecting");
  return (
    <Button type="button" variant="outline" className="h-11 w-full" onClick={onClick} disabled={disabled} aria-label={label}>
      {isLoading ? (
        <InlineLoader label="Connecting to Google" size={18} />
      ) : (
        <svg
          aria-hidden="true"
          className="mr-2 size-5 shrink-0"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303A12 12 0 0 1 24 36a12 12 0 1 1 8.31-20.656l5.657-5.657A19.93 19.93 0 0 0 24 4a20 20 0 1 0 19.611 16.083Z" />
          <path fill="#34A853" d="M6.306 14.691 12.88 19.51A12 12 0 0 1 32.31 15.344l5.657-5.657A19.94 19.94 0 0 0 24 4c-7.385 0-13.79 4.004-17.694 10.691Z" />
          <path fill="#FBBC05" d="M24 44c5.34 0 10.14-2.044 13.784-5.37l-6.36-5.386A11.96 11.96 0 0 1 24 36c-5.202 0-9.62-3.32-11.287-7.96l-6.62 5.1C9.98 39.58 16.476 44 24 44Z" />
          <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303a12.03 12.03 0 0 1-3.88 6.244l6.36 5.386C42.018 35.987 44 30.346 44 24c0-1.34-.14-2.64-.389-3.917Z" />
        </svg>
      )}
      {label}
    </Button>
  );
}
