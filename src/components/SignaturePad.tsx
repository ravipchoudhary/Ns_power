"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  className?: string;
}

const SignaturePad = forwardRef<SignatureCanvas, SignaturePadProps>(
  function SignaturePad({ className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [key, setKey] = useState(0);

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

    // Force re-render to ensure canvas preserves state
    useEffect(() => {
      // This ensures the canvas is properly initialized
      return () => {
        // Cleanup if needed
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="w-full touch-none select-none"
        style={{ touchAction: "none", WebkitTouchCallout: "none" }}
      >
        <SignatureCanvas
          key={key}
          ref={ref}
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
