import React, { useState } from 'react';
import { Server, CheckCircle2, AlertTriangle, RefreshCw, X, Globe, Radio } from 'lucide-react';
import { checkServerHealth, setServerUrl } from '../services/api';

export default function ServerConfigModal({ isOpen, onClose, currentUrl, onSaved }) {
  const [inputUrl, setInputUrl] = useState(currentUrl || 'http://localhost:5000/api');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const normalizeServerUrl = (rawInput) => {
    let trimmed = (rawInput || '').trim();
    if (!trimmed) return 'http://localhost:5000/api';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `http://${trimmed}`;
    }
    try {
      const urlObj = new URL(trimmed);
      if (!urlObj.port && !rawInput.includes(':')) {
        urlObj.port = '5000';
      }
      let finalUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}${urlObj.pathname}`;
      finalUrl = finalUrl.replace(/\/+$/, '');
      if (!finalUrl.endsWith('/api')) {
        finalUrl = `${finalUrl}/api`;
      }
      return finalUrl;
    } catch (e) {
      if (!trimmed.endsWith('/api')) {
        trimmed = `${trimmed}/api`;
      }
      return trimmed;
    }
  };

  const handleTestConnection = async (urlToTest = inputUrl) => {
    setIsTesting(true);
    setTestResult(null);

    const formatted = normalizeServerUrl(urlToTest);
    setInputUrl(formatted);

    const result = await checkServerHealth(formatted);
    setIsTesting(false);
    setTestResult(result);
  };

  const isFirstLaunch = !localStorage.getItem('justlens_ip_configured');

  const handleSave = () => {
    const formatted = normalizeServerUrl(inputUrl);
    localStorage.setItem('justlens_ip_configured', 'true');
    const saved = setServerUrl(formatted);
    if (onSaved) onSaved(saved);
    onClose();
  };

  const setPreset = (presetUrl) => {
    setInputUrl(presetUrl);
    handleTestConnection(presetUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-lg">
            <Server className="w-5 h-5" />
            <span>Pengaturan Alamat IP Server</span>
          </div>
          {!isFirstLaunch && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isFirstLaunch && (
            <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-xs text-cyan-200 flex items-start space-x-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-cyan-300">Pengaturan IP Server Pertama Kali</p>
                <p className="text-[11px] text-cyan-200/90 mt-0.5">
                  Masukkan IP Server Lokal Komputer Pusat Kasir (misal: <code className="font-mono text-yellow-300">192.168.100.100</code> atau <code className="font-mono text-yellow-300">http://192.168.100.100:5000/api</code>).
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-300">
            Masukkan alamat IP dan Port API Server Justlens yang terhubung di jaringan LAN kasir Anda.
          </p>

          {/* Form Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              URL Endpoint API Server
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://192.168.1.100:5000/api"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => handleTestConnection()}
                disabled={isTesting}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4 text-cyan-400" />
                )}
                <span>Tes</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Pilihan Cepat (Presets):</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPreset('http://localhost:5000/api')}
                className="px-2.5 py-1 bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
              >
                localhost:5000
              </button>
              <button
                onClick={() => setPreset('http://127.0.0.1:5000/api')}
                className="px-2.5 py-1 bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
              >
                127.0.0.1:5000
              </button>
              <button
                onClick={() => setPreset('http://192.168.1.100:5000/api')}
                className="px-2.5 py-1 bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
              >
                192.168.1.100:5000
              </button>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {testResult.success
                    ? `Terhubung dengan server Justlens API.`
                    : testResult.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 bg-slate-950/50 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
          >
            Simpan Alamat IP
          </button>
        </div>

      </div>
    </div>
  );
}
