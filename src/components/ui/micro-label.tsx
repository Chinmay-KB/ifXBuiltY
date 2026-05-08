import { cn } from "@/lib/cn";

type Tone = "ink" | "chrome-on-dark" | "muted" | "remix" | "barrier";

const tones: Record<Tone, string> = {
  ink: "text-ink",
  "chrome-on-dark": "text-chrome",
  muted: "text-muted",
  remix: "text-remix",
  barrier: "text-barrier",
};

type Props = {
  children: React.ReactNode;
  /** Associate with a control id for a11y */
  htmlFor?: string;
  tone?: Tone;
  className?: string;
};

/** Uppercase section label (Builder, Target, …). */
export function MicroLabel({
  children,
  htmlFor,
  tone = "ink",
  className,
}: Props) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <Tag
      htmlFor={htmlFor}
      className={cn(
        "text-xs font-black uppercase leading-4 tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
