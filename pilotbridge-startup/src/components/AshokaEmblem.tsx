import React from "react";

interface AshokaEmblemProps {
  className?: string;
  size?: number;
  watermark?: boolean;
  light?: boolean;
}

export function AshokaEmblem({
  className = "",
  size = 40,
  watermark = false,
  light = false,
}: AshokaEmblemProps) {
  if (watermark) {
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        <img
          src="/emblem.png"
          alt=""
          width={size}
          height={Math.round(size * 1.45)}
          className="object-contain opacity-[0.035] grayscale pointer-events-none select-none max-w-none"
        />
      </div>
    );
  }

  // Official State Emblem of India (Lion Capital of Ashoka with Satyameva Jayate)
  return (
    <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      <img
        src="/emblem.png"
        alt="State Emblem of India"
        width={size}
        height={Math.round(size * 1.45)}
        style={{ width: `${size}px`, height: "auto", maxHeight: `${Math.round(size * 1.45)}px` }}
        className={`object-contain ${light ? "brightness-0 invert opacity-90" : "opacity-95"}`}
        loading="eager"
      />
    </div>
  );
}

