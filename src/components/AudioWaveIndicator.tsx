import { motion } from "framer-motion";

type AudioWaveIndicatorProps = {
  active: boolean;
};

export function AudioWaveIndicator({ active }: AudioWaveIndicatorProps) {
  const bars = [0.45, 0.72, 1, 0.58, 0.86];

  return (
    <div className="flex h-8 items-center justify-center gap-1.5" aria-hidden="true">
      {bars.map((scale, index) => (
        <motion.span
          className="block w-1.5 rounded-full bg-white/86"
          initial={{ height: 10 }}
          animate={
            active
              ? {
                  height: [10, 26 * scale, 12, 22 * scale],
                  opacity: [0.58, 1, 0.68, 1],
                }
              : { height: 10, opacity: 0.48 }
          }
          transition={{
            duration: 0.82,
            repeat: active ? Infinity : 0,
            delay: index * 0.08,
            ease: "easeInOut",
          }}
          key={scale}
        />
      ))}
    </div>
  );
}
