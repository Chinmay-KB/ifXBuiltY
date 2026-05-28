import { cn } from "@/lib/cn";
import Image from "next/image";
import appIcon from "@/app/icon.png";

type Size = "sm" | "md";

const sizes: Record<Size, { box: string; img: { width: number; height: number } }> = {
  sm: {
    box: "size-7 rounded-md",
    img: { width: 28, height: 28 },
  },
  md: {
    box: "size-8 rounded-md",
    img: { width: 32, height: 32 },
  },
};

type Props = {
  size?: Size;
  className?: string;
};

/** App icon mark used in the system header. */
export function LogoMark({ size = "md", className }: Props) {
  const s = sizes[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-chrome",
        s.box,
        className,
      )}
      aria-hidden
    >
      <Image
        src={appIcon}
        alt=""
        width={s.img.width}
        height={s.img.height}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
