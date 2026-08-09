import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export default function CameraScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraError, setCameraError] = useState('');
  const html5QrcodeScanner = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setCameraError('');
    let isSubscribed = true;

    const timer = setTimeout(() => {
      if (!isSubscribed) return;

      const element = document.getElementById('camera-reader');
      if (!element) return;

      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778
        };

        const scanner = new Html5Qrcode('camera-reader');
        html5QrcodeScanner.current = scanner;

        scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (navigator.vibrate) {
              try { navigator.vibrate(100); } catch (e) {}
            }
            onScanSuccess(decodedText);
            stopScanner();
            onClose();
          },
          () => {}
        ).catch(err => {
          console.warn('Camera start error caught:', err);
          if (isSubscribed) {
            setCameraError(err.message || 'Izin kamera ditolak atau kamera tidak ditemukan.');
          }
        });
      } catch (err) {
        console.warn('CameraScanner instance error caught:', err);
        if (isSubscribed) {
          setCameraError('Gagal menginisialisasi kamera HP.');
        }
      }
    }, 200);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    try {
      if (html5QrcodeScanner.current) {
        if (html5QrcodeScanner.current.isScanning) {
          html5QrcodeScanner.current.stop().catch(() => {}).finally(() => {
            try { html5QrcodeScanner.current.clear(); } catch (e) {}
            html5QrcodeScanner.current = null;
          });
        } else {
          try { html5QrcodeScanner.current.clear(); } catch (e) {}
          html5QrcodeScanner.current = null;
        }
      }
    } catch (e) {
      console.warn('stopScanner error caught silently:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        
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
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center relative min-h-[280px]">
          {cameraError ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2 max-w-xs">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs font-semibold text-amber-200">Gagal Mengakses Kamera</p>
              <p className="text-[11px] text-slate-400 leading-snug">{cameraError}</p>
            </div>
          ) : (
            <div id="camera-reader" className="w-full overflow-hidden rounded-xl border-2 border-cyan-500/50 shadow-inner"></div>
          )}

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
            Tutup Scanner
          </button>
        </div>

      </div>
    </div>
  );
}
