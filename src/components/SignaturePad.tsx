"use client";

import { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = forwardRef<SignatureCanvas, { className?: string }>(
  function SignaturePad({ className }, ref) {
    return (
      <SignatureCanvas
        ref={ref}
        canvasProps={{ className: className ?? "w-full h-32" }}
      />
    );
  }
);

export default SignaturePad;
