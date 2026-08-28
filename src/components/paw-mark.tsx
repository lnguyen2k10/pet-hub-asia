export function PawMark({ className = "size-9" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-terra ${className}`}>
      <svg viewBox="0 0 24 24" className="size-1/2 fill-primary-foreground" aria-hidden="true">
        <circle cx="7" cy="7" r="2.6" />
        <circle cx="12" cy="5" r="2.6" />
        <circle cx="17" cy="7" r="2.6" />
        <ellipse cx="12" cy="15.5" rx="5.6" ry="4.6" />
      </svg>
    </span>
  );
}
