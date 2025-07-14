import * as React from "react";

import { cn } from "~/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "-mb-[5px] origin-[right_top] scale-[0.875] text-base sm:mb-0 sm:scale-100 sm:text-sm w-full bg-sky-500/10 text-right caret-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 col-span-2 h-fit",
        className
      )}
      dir="rtl"
      {...props}
    />
  );
}
