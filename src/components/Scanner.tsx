import { useState, useEffect, useRef, FormEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Search, UserCheck, AlertCircle, X, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_CUSTOMERS } from '../data';
import { DbManager } from '../db';
import { ShinyButton } from './ui/shiny-button';

interface ScannerProps {
  onScanSuccess: (idPassWallet: string) => void;
  onManualSelect: (idPassWallet: string) => void;
  refreshTrigger?: number;
}

export default function Scanner({ onScanSuccess, onManualSelect, refreshTrigger = 0 }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Load clients dynamically on mount and on refeshTrigger
  const loadClients = async () => {
    try {
      const all = await DbManager.getAllClients();
      if (all && all.length > 0) {
        setClients(all.map(c => ({
          id: c.id_pass_wallet,
          name: c.nom
        })));
      } else {
        setClients(MOCK_CUSTOMERS);
      }
    } catch (e) {
      console.error('Erreur chargement des clients:', e);
      setClients(MOCK_CUSTOMERS);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [refreshTrigger]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const viewId = 'qr-reader-viewport';

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanner = async () => {
    setScanError(null);
    setIsScanning(true);

    // Wait a tiny bit for the element to mount in standard DOM
    setTimeout(async () => {
      try {
        const qrCode = new Html5Qrcode(viewId);
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: 'environment' }, // Rear camera
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Success callback
            onScanSuccess(decodedText);
            stopScanner();
          },
          () => {
            // Verbose error callback, ignored to prevent console noise
          }
        );
        setHasCameraPermission(true);
      } catch (err: any) {
        console.error('Camera Scanner start failed:', err);
        setScanError(
          "Impossible d'accéder à la caméra. Vérifiez les autorisations du navigateur ou saisissez le code client manuellement."
        );
        setHasCameraPermission(false);
        setIsScanning(false);
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      if (html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          console.error('Error stopping qr stream:', e);
        }
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      onManualSelect(manualId.trim().toUpperCase());
      setManualId('');
    }
  };

  const simulateScan = (id: string) => {
    onScanSuccess(id);
  };

  return (
    <div className="bg-[var(--color-cream)] border border-[var(--color-shell)] rounded-3xl shadow-md p-6" id="scanner-section">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg font-display font-medium text-[var(--color-wood)] tracking-tight flex items-center gap-2 uppercase">
          <Camera className="w-5 h-5 text-[var(--color-wood-soft)]" />
          Scanner le Wallet Client
        </h2>
        <p className="text-xs text-[var(--color-taupe)]">
          Scannez le QR Code de fidélité « StCyp'Wallet » ou entrez le code manuellement.
        </p>
      </div>

      <div className="space-y-6">
        {/* Cam Section Viewport */}
        {!isScanning ? (
          <div className="bg-[var(--color-sand)] border border-dashed border-[var(--color-shell)] rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all">
            <div className="w-14 h-14 rounded-full bg-[var(--color-olive)]/10 border border-[var(--color-olive)]/20 flex items-center justify-center text-[var(--color-wood-soft)] mb-4 shadow-sm">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-wood)]">Utiliser l'appareil photo</p>
            <p className="text-xs text-[var(--color-taupe)] mt-1 max-w-[240px] mx-auto leading-relaxed">
              Scannez directement depuis l'appareil photo de votre smartphone ou tablette.
            </p>
            <button
              onClick={startScanner}
              className="mt-5 px-5 py-2.5 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-xs font-semibold shadow-md shadow-[var(--color-olive)]/20 transition-all cursor-pointer border-none"
              id="start-camera-btn"
            >
              Activer la caméra
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="bg-[var(--color-sand)] rounded-2xl overflow-hidden shadow-inner aspect-square w-full max-w-[320px] mx-auto relative border-4 border-[var(--color-sand)] shadow-md">
              {/* Active camera frame inside DOM */}
              <div id={viewId} className="w-full h-full object-cover" />

              {/* Laser overlay animation */}
              <div className="absolute top-0 left-0 w-full h-[2px] animate-laser z-10" style={{ backgroundColor: 'var(--color-terracotta)', boxShadow: '0 0 10px 2px var(--color-terracotta)' }} />

              {/* Ambient guide bracket frames */}
              <div className="absolute inset-8 border border-[var(--color-olive)]/20 rounded-lg pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-olive)] rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-olive)] rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-olive)] rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-olive)] rounded-br" />
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={stopScanner}
                className="px-4 py-2 bg-[var(--color-paprika)]/10 border border-[var(--color-paprika)]/20 text-[var(--color-paprika)] rounded-xl text-xs font-semibold shadow-sm hover:bg-[var(--color-paprika)]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                id="stop-camera-btn"
              >
                <X className="w-3.5 h-3.5" />
                Désactiver l'appareil photo
              </button>
            </div>
          </div>
        )}

        {/* Scan Error Message */}
        {scanError && (
          <div className="p-4 bg-[var(--color-sand)] border border-[var(--color-shell)] rounded-2xl flex items-start gap-2.5 text-xs text-[var(--color-wood-soft)]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[var(--color-taupe)] mt-0.5" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Manual Input Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[var(--color-shell)]"></div>
          <span className="flex-shrink mx-4 text-[9px] text-[var(--color-taupe-light)] font-bold uppercase tracking-wider font-mono">OU SAISIE MANUELLE</span>
          <div className="flex-grow border-t border-[var(--color-shell)]"></div>
        </div>

        {/* Manual search bar */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-taupe-light)]" />
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Ex: PASS-CYP-7391"
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-sand)] border border-[var(--color-shell)] focus:border-[var(--color-olive)] focus:bg-[var(--color-cream)] rounded-xl text-xs transition-all outline-none uppercase font-mono text-[var(--color-wood)]"
              id="manual-id-input"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-3 bg-[var(--color-olive)] hover:bg-[var(--color-olive-dark)] text-[var(--color-cream)] rounded-full text-xs font-semibold shadow-md shadow-[var(--color-olive)]/20 transition-all flex items-center gap-1 cursor-pointer border-none font-mono"
            id="search-manual-btn"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Saisie
          </button>
        </form>

        {/* Sandbox Simulation tools (Very important for full-scope evaluation and easy testing) */}
        <div className="pt-4 border-t border-[var(--color-shell)]">
          <div className="flex items-center gap-1.5 mb-2.5 text-[var(--color-taupe)] text-[10px] font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-olive)] animate-pulse" />
            <span>Démos de Pass de Simulation :</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {clients.map((cust) => (
              <button
                key={cust.id}
                onClick={() => simulateScan(cust.id)}
                type="button"
                className="text-left px-3 py-2 bg-[var(--color-sand)] hover:bg-[var(--color-sand)] hover:border-[var(--color-olive)]/20 border border-[var(--color-shell)] rounded-xl transition-all flex flex-col cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-[var(--color-wood)]">{cust.name}</span>
                <span className="text-[9px] font-mono text-[var(--color-taupe-light)] mt-0.5">{cust.id}</span>
              </button>
            ))}
          </div>

          <ShinyButton
            type="button"
            onClick={() => {
              const generatedId = 'PASS-CYP-' + Math.floor(1000 + Math.random() * 9000);
              onManualSelect(generatedId);
            }}
            className="w-full mt-4"
            id="scanner-create-new-client-btn"
          >
            <UserPlus className="w-5 h-5 text-[var(--color-cream)]" />
            Créer un Nouveau Client / Pass
          </ShinyButton>
        </div>
      </div>
    </div>
  );
}
