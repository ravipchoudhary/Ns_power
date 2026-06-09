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

    // Use a stable session ID instead of pathname (which changes on mobile)
    const [sessionId] = useState(() => {
      if (typeof window === "undefined") return "signature:global";
      // Try to get from sessionStorage (persists for tab lifetime)
      let id = sessionStorage.getItem("__sig_session_id");
      if (!id) {
        id = "signature:session:" + Date.now() + "-" + Math.random().toString(36).slice(2);
        sessionStorage.setItem("__sig_session_id", id);
      }
      return id;
    });

    const storageKey = sessionId;
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

      // Handle visibility change - restore signature if it was cleared
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && sigRef.current?.isEmpty?.()) {
          try {
            const raw = localStorage.getItem(storageKey) || localStorage.getItem(lastKey);
            if (raw) {
              setTimeout(() => {
                sigRef.current?.fromDataURL(raw);
              }, 50);
            }
          } catch (e) {
            // ignore
          }
        }
      };

      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
      container.addEventListener("touchmove", preventTouchMove, { passive: false });
      container.addEventListener("mousedown", handleMouseDown);
      container.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("touchmove", preventTouchMove);
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.body.style.overflow = "auto";
      };
    }, [storageKey]);

    // Load saved signature from localStorage on mount (try session then fallback)
    useEffect(() => {
      const timer = setTimeout(() => {
        try {
          let raw = localStorage.getItem(storageKey);
          if (!raw) {
            raw = localStorage.getItem(lastKey);
          }
          if (raw && sigRef.current) {
            try {
              sigRef.current?.fromDataURL(raw);
              setSavedData(raw);
            } catch (e) {
              console.warn("Failed to restore signature:", e);
            }
          }
        } catch (e) {
          // ignore storage errors
        }
      }, 100);
      return () => clearTimeout(timer);
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
