import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide";
};

const sizeStyles = {
  narrow: "max-w-[768px]",
  default: "max-w-[1280px]",
  wide: "max-w-[1536px]",
};

export function Container({ children, className, size = "default" }: Props) {
  return (
    <div className={cn("mx-auto w-full px-4 md:px-6", sizeStyles[size], className)}>
      {children}
    </div>
  );
}

