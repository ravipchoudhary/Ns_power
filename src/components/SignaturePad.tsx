"use client";

import { forwardRef, useEffect, useRef, useState, useImperativeHandle, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

export interface SignaturePadProps {
  className?: string;
}

export type SignaturePadHandle = {
  clear: () => void;
  toDataURL: () => string | undefined;
  isEmpty: () => boolean | undefined;
  fromDataURL: (d: string) => void;
};

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigRef = useRef<any>(null);
    const [savedData, setSavedData] = useState<string | null>(null);
    const isDrawingRef = useRef(false);
    const scrollLockRef = useRef(false);

    // storage key per pathname so multiple forms don't clash
    const storageKey = typeof window !== "undefined" ? `signature:${window.location.pathname}` : "signature:global";
    const lastKey = "signature:last";

    // expose internal ref methods to parent via forwarded ref
    useImperativeHandle(ref, () => ({
      clear: () => {
        try {
          sigRef.current?.clear();
          isDrawingRef.current = false;
        } catch {}
        try {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(lastKey);
        } catch {}
      },
      toDataURL: () => sigRef.current?.toDataURL(),
      isEmpty: () => sigRef.current?.isEmpty?.(),
      fromDataURL: (d: string) => sigRef.current?.fromDataURL(d),
    }));

    // Prevent all scroll interference during drawing and after signing
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Prevent touchmove on the signature pad container
      const preventTouchMove = (e: TouchEvent) => {
        if (container.contains(e.target as Node)) {
          e.preventDefault();
        }
      };

      // Prevent page scroll while drawing (touch)
      const handleTouchStart = () => {
        isDrawingRef.current = true;
        scrollLockRef.current = true;
        document.body.style.overflow = "hidden";
      };

      const handleTouchEnd = () => {
        isDrawingRef.current = false;
        setTimeout(() => {
          scrollLockRef.current = false;
          document.body.style.overflow = "auto";
        }, 100);
      };

      // Prevent page scroll while drawing (mouse)
      const handleMouseDown = () => {
        isDrawingRef.current = true;
        scrollLockRef.current = true;
        document.body.style.overflow = "hidden";
      };

      const handleMouseUp = () => {
        isDrawingRef.current = false;
        setTimeout(() => {
          scrollLockRef.current = false;
          document.body.style.overflow = "auto";
        }, 100);
      };

      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
      container.addEventListener("touchmove", preventTouchMove, { passive: false });
      container.addEventListener("mousedown", handleMouseDown);
      container.addEventListener("mouseup", handleMouseUp);

      return () => {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("touchmove", preventTouchMove);
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("mouseup", handleMouseUp);
        document.body.style.overflow = "auto";
      };
    }, []);

    // Load saved signature from localStorage on mount (try per-path then fallback)
    useEffect(() => {
      try {
        const raw = localStorage.getItem(storageKey) || localStorage.getItem(lastKey);
        if (raw && sigRef.current) {
          // Delay restore to ensure canvas is ready
          const timer = setTimeout(() => {
            try {
              sigRef.current?.fromDataURL(raw);
              setSavedData(raw);
            } catch (e) {
              // ignore
            }
          }, 50);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        // ignore storage errors
      }
    }, [storageKey]);

    const handleEnd = useCallback(() => {
      try {
        if (!sigRef.current) return;
        const data = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
        try {
          localStorage.setItem(storageKey, data);
          localStorage.setItem(lastKey, data);
        } catch {}
        setSavedData(data);
        isDrawingRef.current = false;
      } catch (e) {
        // ignore
      }
    }, [storageKey]);

    return (
      <div
        ref={containerRef}
        className="w-full touch-none select-none"
        style={{
          touchAction: "none",
          WebkitTouchCallout: "none",
          position: "relative",
          isolation: "isolate",
        }}
      >
        <SignatureCanvas
          ref={sigRef}
          onEnd={handleEnd}
          canvasProps={{
            className:
              className ?? "w-full h-32 sm:h-40 border border-gray-200 rounded bg-white",
            style: {
              touchAction: "none",
              WebkitTouchCallout: "none",
              userSelect: "none",
              willChange: "contents",
              display: "block",
              margin: "0",
              padding: "0",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            } as React.CSSProperties,
          }}
          velocityFilterWeight={0.7}
          minWidth={1}
          maxWidth={2}
        />
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
