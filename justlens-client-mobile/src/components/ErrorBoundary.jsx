import React from 'react';
import { AlertTriangle, RefreshCw, Server } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      customIp: localStorage.getItem('justlens_server_url') || 'http://localhost:5000'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled JS Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleSaveServerIp = (e) => {
    e.preventDefault();
    let cleanUrl = this.state.customIp.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'http://' + cleanUrl;
    }
    localStorage.setItem('justlens_server_url', cleanUrl);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-5 text-white font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 animate-in fade-in">
            
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">Aplikasi Mengalami Kendala</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terjadi kesalahan sistem JS. Jangan khawatir, Anda dapat memuat ulang aplikasi atau menyesuaikan IP Server LAN.
              </p>
            </div>

            {/* Error Message Snippet */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-amber-300 max-h-24 overflow-y-auto break-all">
              {this.state.error?.toString() || 'Unknown Runtime Error'}
            </div>

            {/* Action Form for IP */}
            <form onSubmit={this.handleSaveServerIp} className="space-y-3 pt-1 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Alamat IP Server LAN:</span>
              </label>
              <input
                type="text"
                value={this.state.customIp}
                onChange={(e) => this.setState({ customIp: e.target.value })}
                placeholder="http://192.168.1.100:5000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 text-xs rounded-xl transition flex items-center justify-center space-x-2"
              >
                <span>Simpan IP & Muat Ulang</span>
              </button>
            </form>

            <button
              onClick={this.handleReload}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Langsung</span>
            </button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
