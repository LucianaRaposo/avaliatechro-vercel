import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scannerId = "qr-scanner-container";
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      (decodedText) => {
        html5QrCode.stop().catch(() => {});
        onScan(decodedText);
      },
      () => {}
    ).then(() => {
      setStarted(true);
    }).catch((err) => {
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <span className="font-heading font-semibold text-foreground">Escanear QR Code</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scanner */}
        <div className="relative bg-black">
          <div id="qr-scanner-container" className="w-full" style={{ minHeight: 300 }} />
          {!started && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Error or instructions */}
        <div className="p-4">
          {error ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Aponte a câmera para o QR Code do projeto para iniciar a avaliação.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}