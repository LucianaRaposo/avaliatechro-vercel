import React from "react";

export default function QRCodeGenerator({ value, size = 200, className = "" }) {
  if (!value) return null;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=2&format=png`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}