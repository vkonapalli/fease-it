import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, type HTMLAttributes } from "react";

interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
}

export function Collapsible({ title, defaultOpen = true, className, children, ...props }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-gray-200 rounded-lg", className)} {...props}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-primary hover:bg-gray-50 cursor-pointer"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("h-5 w-5 text-gray-500 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && <div className="border-t border-gray-200 p-4">{children}</div>}
    </div>
  );
}
