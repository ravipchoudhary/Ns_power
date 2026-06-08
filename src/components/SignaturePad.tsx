"use client";

import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  className?: string;
}

const SignaturePad = forwardRef<SignatureCanvas, SignaturePadProps>(
  function SignaturePad({ className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigRef = useRef<any>(null);
    const [savedData, setSavedData] = useState<string | null>(null);

    // expose internal ref methods to parent via forwarded ref
    useImperativeHandle(ref, () => sigRef.current);

    // storage key per pathname so multiple forms don't clash
    const storageKey = typeof window !== "undefined" ? `signature:${window.location.pathname}` : "signature:global";

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Prevent scrolling while drawing on the signature pad
      const preventScroll = (e: TouchEvent) => {
        if (container.contains(e.target as Node)) {
          e.preventDefault();
        }
      };

      container.addEventListener("touchmove", preventScroll, { passive: false });

      return () => {
        container.removeEventListener("touchmove", preventScroll);
      };
    }, []);

    // Load saved signature from localStorage on mount
    useEffect(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw && sigRef.current) {
          sigRef.current.fromDataURL(raw);
          setSavedData(raw);
        }
      } catch (e) {
        // ignore storage errors
      }
    }, [storageKey]);

    // called when user finishes drawing
    const handleEnd = () => {
      try {
        if (!sigRef.current) return;
        const data = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
        localStorage.setItem(storageKey, data);
        setSavedData(data);
      } catch (e) {
        // ignore
      }
    };

    return (
      <div
        ref={containerRef}
        className="w-full touch-none select-none"
        style={{ touchAction: "none", WebkitTouchCallout: "none" }}
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
            },
          }}
          velocityFilterWeight={0.7}
          minWidth={1}
          maxWidth={2}
        />
      </div>
    );
  }
);

export default SignaturePad;
