import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Flashlight } from 'lucide-react';

export default function CameraScannerModal({ isOpen, onClose, onScanSuccess }) {
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 160 },
      aspectRatio: 1.777778
    };

    const scanner = new Html5Qrcode('camera-reader');
    html5QrcodeScanner.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      config,
      (decodedText) => {
        // Play haptic feedback if supported
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
        onScanSuccess(decodedText);
        stopScanner();
        onClose();
      },
      (errorMessage) => {
        // Ignore parse errors per frame
      }
    ).catch(err => {
      console.warn('Gagal membuka kamera hp:', err);
    });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (html5QrcodeScanner.current && html5QrcodeScanner.current.isScanning) {
      html5QrcodeScanner.current.stop().then(() => {
        html5QrcodeScanner.current.clear();
      }).catch(err => console.error(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in">
        
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Scan Barcode Kamera HP</h3>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center relative min-h-[300px]">
          <div id="camera-reader" className="w-full overflow-hidden rounded-xl border-2 border-cyan-500/50 shadow-inner"></div>

          <p className="text-xs text-slate-400 text-center mt-3">
            Arahkan kamera ke <span className="text-cyan-400 font-semibold">Barcode Produk / Stiker Label</span> untuk menginput ke keranjang
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-850 border-t border-slate-800 text-center">
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
}
