import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-6", className)}>{children}</div>;
}

