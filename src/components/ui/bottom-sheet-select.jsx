import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// A select that renders as a native-style bottom-sheet drawer on mobile and a
// standard Radix popover on desktop. Pass `options` as [{ value, label }] and
// reuse the app's `ipt` trigger styling via triggerClassName.
export default function BottomSheetSelect({ value, onValueChange, placeholder, options = [], triggerClassName = "" }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      {/* Mobile: bottom-sheet drawer */}
      <div className="md:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button type="button" className={cn("flex items-center justify-between text-left", triggerClassName)}>
              <span className={cn("truncate", !current && "text-muted-foreground")}>{current?.label ?? placeholder}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader className="text-left pb-2">
              <DrawerTitle className="text-base">{placeholder || "Select"}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-2 pb-6 no-scrollbar">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onValueChange(o.value); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors",
                    o.value === value ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: Radix Select popover */}
      <div className="hidden md:block">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={cn("ipt", triggerClassName)}><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}