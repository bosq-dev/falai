import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type BottomSheetProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function BottomSheet({ open, title, children, onClose, className }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3 sm:px-6 sm:pb-6">
          <motion.button
            aria-label="Fechar"
            className="absolute inset-0 bg-ink/28 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.section
            aria-modal="true"
            className={cn(
              "relative max-h-[88dvh] w-full max-w-xl overflow-hidden rounded-[28px] bg-cream shadow-sheet",
              className,
            )}
            initial={{ y: "102%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "102%", scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <div className="sticky top-0 z-10 border-b border-cocoa/10 bg-cream/92 px-5 pb-3 pt-4 backdrop-blur-xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cocoa/20" />
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                <button
                  aria-label="Fechar"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-cocoa shadow-sm"
                  onClick={onClose}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-[calc(88dvh-84px)] overflow-y-auto px-5 pb-6 pt-4">{children}</div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
