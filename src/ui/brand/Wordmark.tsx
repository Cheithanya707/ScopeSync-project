type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span aria-hidden="true" className={`brand-wordmark${className ? ` ${className}` : ""}`}>
      <span className="brand-wordmark__scope">Scope</span>
      <span className="brand-wordmark__sync">Sync</span>
    </span>
  );
}
