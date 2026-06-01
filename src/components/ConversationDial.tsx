import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue, type Variants } from "framer-motion";
import { Mic, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { hapticTap } from "../lib/haptics";
import type { Language } from "../types/language";
import type { DialState } from "../types/realtime";
import { AudioWaveIndicator } from "./AudioWaveIndicator";

type ConversationDialProps = {
  activeLanguage: Language;
  otherLanguage: Language;
  dialState: DialState;
  disabled?: boolean;
  onSwitch: () => void;
  onToggle: () => void;
  onRetry: () => void;
};

const DRAG_INTENT_PX = 3;
const SWITCH_THRESHOLD_PX = 8;
const NAME_DRAG_LIMIT_PX = 28;

const languageNameVariants: Variants = {
  initial: (direction: 1 | -1) => ({
    opacity: 0,
    scale: 0.82,
    x: direction * 26,
  }),
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    scale: 0.9,
    x: direction * -18,
  }),
};

export function ConversationDial({
  activeLanguage,
  otherLanguage,
  dialState,
  disabled,
  onSwitch,
  onToggle,
  onRetry,
}: ConversationDialProps) {
  const dragOffset = useMotionValue(0);
  const springDragOffset = useSpring(dragOffset, { stiffness: 360, damping: 26, mass: 0.58 });
  const glowOpacity = useTransform(springDragOffset, [-NAME_DRAG_LIMIT_PX, 0, NAME_DRAG_LIMIT_PX], [0.38, 0.24, 0.38]);
  const nameX = useTransform(springDragOffset, [-NAME_DRAG_LIMIT_PX, 0, NAME_DRAG_LIMIT_PX], [-10, 0, 10]);
  const nameScale = useTransform(springDragOffset, [-NAME_DRAG_LIMIT_PX, 0, NAME_DRAG_LIMIT_PX], [0.96, 1, 0.96]);

  const pointerStart = useRef({ x: 0, y: 0 });
  const pointerCurrent = useRef({ x: 0, y: 0 });
  const isPointerDown = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [switchDirection, setSwitchDirection] = useState<1 | -1>(1);

  const isLive =
    dialState === "listening" ||
    dialState === "finishingTranslation" ||
    dialState === "translating";
  const isError = dialState === "error";

  function updateDragOffset(deltaX: number) {
    const clampedDeltaX = Math.max(-NAME_DRAG_LIMIT_PX, Math.min(NAME_DRAG_LIMIT_PX, deltaX));
    dragOffset.set(clampedDeltaX);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || isError) return;

    pointerStart.current = { x: event.clientX, y: event.clientY };
    pointerCurrent.current = { x: event.clientX, y: event.clientY };
    isPointerDown.current = true;
    setDragging(false);
    dragOffset.set(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPointerDown.current || disabled || isError) return;

    pointerCurrent.current = { x: event.clientX, y: event.clientY };

    // Dragging to switch languages is only available when not in a live session.
    if (isLive) return;

    const deltaX = event.clientX - pointerStart.current.x;
    const dx = Math.abs(deltaX);
    const dy = Math.abs(event.clientY - pointerStart.current.y);
    if ((dragging || dx > DRAG_INTENT_PX) && dx > dy) {
      setDragging(true);
      updateDragOffset(deltaX);
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;

    const deltaX = pointerCurrent.current.x - pointerStart.current.x;
    if (dragging && Math.abs(deltaX) >= SWITCH_THRESHOLD_PX) {
      const direction = deltaX > 0 ? 1 : -1;
      setSwitchDirection(direction);
      hapticTap([10, 28, 10]);
      updateDragOffset(direction * NAME_DRAG_LIMIT_PX);
      window.setTimeout(() => {
        onSwitch();
        dragOffset.set(0);
      }, 90);
    } else if (!dragging) {
      // A plain tap toggles listening on/off.
      hapticTap(8);
      onToggle();
    } else {
      dragOffset.set(0);
    }

    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLDivElement>) {
    isPointerDown.current = false;
    dragOffset.set(0);
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="relative mx-auto mt-8 flex w-full max-w-xl items-center justify-center px-5">
      <motion.div
        className="absolute h-72 w-72 rounded-full blur-3xl sm:h-80 sm:w-80"
        style={{ opacity: glowOpacity }}
        aria-hidden="true"
      />
      <motion.div
        className="relative h-[min(76vw,19rem)] w-[min(76vw,19rem)] touch-pan-y select-none rounded-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        animate={
          isLive
            ? {
                scale: [1, 1.035, 1],
              }
            : { scale: 1 }
        }
        transition={{
          duration: 1.2,
          repeat: isLive ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <DialFace
          active={isLive}
          error={isError}
          language={activeLanguage}
          nameScale={nameScale}
          nameX={nameX}
          otherLanguage={otherLanguage}
          onRetry={onRetry}
          switchDirection={switchDirection}
        />
      </motion.div>
    </div>
  );
}

function DialFace({
  active,
  error,
  language,
  nameScale,
  nameX,
  otherLanguage,
  onRetry,
  switchDirection,
}: {
  active: boolean;
  error: boolean;
  language: Language;
  nameScale: MotionValue<number>;
  nameX: MotionValue<number>;
  otherLanguage: Language;
  onRetry?: () => void;
  switchDirection: 1 | -1;
}) {
  return (
    <motion.div
      className="absolute inset-0 grid h-full w-full place-items-center overflow-hidden rounded-full shadow-dial"
      style={{
        background: error ? "#f46f5d" : "#e5e6fe",
        filter: error ? "saturate(0.35) brightness(0.92)" : "saturate(1)",
      }}
    >
      <div className={`absolute inset-[7%] rounded-full border ${error ? "border-white/26" : "border-indigo-950/15"}`} />
      <div className={`absolute inset-[16%] rounded-full ${error ? "bg-white/10" : "bg-indigo-950/[0.04]"}`} />
      <div className={`relative flex h-full w-full flex-col items-center justify-center px-8 text-center ${error ? "text-white" : "text-indigo-950"}`}>
        <div className={`mb-3 grid h-14 w-14 place-items-center rounded-full shadow-inner backdrop-blur ${error ? "bg-white/20" : "bg-indigo-950/10"}`}>
          {error ? <RotateCcw size={28} /> : <Mic size={30} />}
        </div>
        <div className="min-h-[5.4rem]">
          <motion.div style={{ scale: nameScale, x: nameX }}>
            <AnimatePresence custom={switchDirection} initial={false} mode="wait">
              <motion.p
                key={error ? "error" : language.id}
                className="text-[clamp(1.7rem,8vw,2.55rem)] font-bold leading-tight tracking-normal"
                custom={switchDirection}
                variants={languageNameVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 8,
                  mass: 0.2,
                }}
              >
                {error ? "Algo deu errado" : language.label}
              </motion.p>
            </AnimatePresence>
          </motion.div>
          <p className={`mt-2 text-sm font-semibold ${error ? "text-white/88" : "text-indigo-950/80"}`}>
            {error
              ? "Tentar novamente"
              : active
                ? `Ouvindo ${language.label}...`
                : "Toque para falar"}
          </p>
          <p className={`mt-1 text-xs font-medium ${error ? "text-white/76" : "text-indigo-950/60"}`}>
            {`Traduzindo para ${otherLanguage.label}...`}
          </p>
        </div>
        <div className="mt-2">
          <AudioWaveIndicator active={active} />
        </div>
      </div>
      {error && onRetry ? (
        <button
          aria-label="Tentar novamente"
          className="absolute inset-0 rounded-full"
          onClick={onRetry}
          type="button"
        />
      ) : null}
    </motion.div>
  );
}
