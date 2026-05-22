import { useState, useEffect, startTransition, FormEvent, useRef } from 'react';
import { Commercant, CagnotteSaintCyp, TransactionHistory, ClientSaintCyp } from '../types';
import { DbManager } from '../db';
import { Award, CreditCard, ChevronRight, CheckCircle2, Ticket, ArrowUpRight, History, Coins, Undo, UserCheck, User, Mail, Phone, ShieldCheck, Download, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShinyButton } from './ui/shiny-button';
import QRCode from 'qrcode';

interface LoyaltyHubProps {
  idPassWallet: string;
  merchant: Commercant;
  onClear: () => void;
  onTransactionComplete: () => void;
}

export default function LoyaltyHub({ idPassWallet, merchant, onClear, onTransactionComplete }: LoyaltyHubProps) {
  const [cagnotte, setCagnotte] = useState<CagnotteSaintCyp | null>(null);
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState('');
  const [pointsInput, setPointsInput] = useState('');
  const [useAmountFormula, setUseAmountFormula] = useState(true); // default true: 1€ = 1pt
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentMerchantTxs, setRecentMerchantTxs] = useState<TransactionHistory[]>([]);
  const [celebrateDiscount, setCelebrateDiscount] = useState(false);
  const [client, setClient] = useState<ClientSaintCyp | null>(null);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  
  // QR Modal States
  const [createdClientPass, setCreatedClientPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchCagnotte();
    fetchHistory();
    fetchClient();
  }, [idPassWallet, merchant.id]);

  useEffect(() => {
    if (createdClientPass && qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        createdClientPass,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [createdClientPass]);

  const handleDownloadQr = () => {
    if (!qrCanvasRef.current || !createdClientPass) return;
    try {
      const link = document.createElement('a');
      link.download = `pass-${createdClientPass.toLowerCase()}.png`;
      link.href = qrCanvasRef.current.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error downloading QR code:', e);
    }
  };

  const handleCopyText = () => {
    if (!createdClientPass) return;
    navigator.clipboard.writeText(createdClientPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareQr = async () => {
    if (!createdClientPass) return;
    const shareData = {
      title: "Mon Pass Saint-Cyp Fidélité",
      text: `Voici mon Pass Fidélité Commerçant Saint-Cyprien. Mon identifiant : ${createdClientPass}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  const fetchCagnotte = async () => {
    setLoading(true);
    const res = await DbManager.getCagnotte(idPassWallet, merchant.id);
    setCagnotte(res.data);
    setLoading(false);
  };

  const fetchClient = async () => {
    const res = await DbManager.getClient(idPassWallet);
    setClient(res.data);
    if (res.data) {
      setRegisterName(res.data.nom);
      setRegisterEmail(res.data.email || '');
      setRegisterPhone(res.data.telephone || '');
    } else {
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPhone('');
    }
  };

  const handleRegisterClientSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) {
      alert('Veuillez spécifier le nom du client.');
      return;
    }

    setIsSubmitting(true);
    const res = await DbManager.registerClient({
      id_pass_wallet: idPassWallet,
      nom: registerName.trim(),
      email: registerEmail.trim() || undefined,
      telephone: registerPhone.trim() || undefined
    });
    setIsSubmitting(false);

    if (res.success && res.data) {
      setClient(res.data);
      setCreatedClientPass(idPassWallet);
      onTransactionComplete();
    } else {
      alert("Erreur lors de l'enregistrement de la fiche client: " + (res.error || 'Erreur inconnue'));
    }
  };

  const fetchHistory = () => {
    const allHistory = DbManager.getTransactionHistory();
    const merchantHistory = allHistory.filter(h => h.commercant_id === merchant.id);
    setRecentMerchantTxs(merchantHistory);
  };

  const handleAddPointsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let pts = 0;

    if (useAmountFormula) {
      const amt = parseFloat(amountInput);
      if (isNaN(amt) || amt <= 0) {
        alert('Veuillez saisir un montant valide supérieur à 0.');
        return;
      }
      // Simple formula: 1 Euro = 1 Point (rounded down or standard)
      pts = Math.floor(amt);
    } else {
      const p = parseInt(pointsInput);
      if (isNaN(p) || p <= 0) {
        alert('Veuillez saisir un nombre de points valide supérieur à 0.');
        return;
      }
      pts = p;
    }

    setIsSubmitting(true);
    const res = await DbManager.addPoints(idPassWallet, merchant, pts);
    setIsSubmitting(false);

    if (res.success && res.data) {
      const prevCagnotte = cagnotte;
      setCagnotte(res.data);
      setAmountInput('');
      setPointsInput('');

      // Check if they newly crossed the threshold to celebrate
      if (res.data.remise_dispo && prevCagnotte && !prevCagnotte.remise_dispo) {
        setCelebrateDiscount(true);
      }

      fetchHistory();
      onTransactionComplete();
    } else {
      alert("Erreur lors de l'attribution des points: " + (res.error || 'Erreur inconnue'));
    }
  };

  const handleRedeemDiscount = async () => {
    if (!cagnotte || !cagnotte.remise_dispo) return;

    if (
      window.confirm(
        `Confirmez-vous l'utilisation de la remise ?\nCela déduira ${merchant.seuil_remise_pts} points de la cagnotte du client.`
      )
    ) {
      setIsSubmitting(true);
      const res = await DbManager.redeemDiscount(idPassWallet, merchant);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setCagnotte(res.data);
        setCelebrateDiscount(false);
        fetchHistory();
        onTransactionComplete();
      } else {
        alert("Erreur lors de la validation de la remise: " + (res.error || 'Erreur inconnue'));
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-850 rounded-3xl shadow-xl p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Chargement de la cagnotte client...</p>
        </div>
      </div>
    );
  }

  const points = cagnotte ? cagnotte.points_cumules : 0;
  const threshold = merchant.seuil_remise_pts;
  const progressPercent = Math.min(100, (points / threshold) * 100);
  const isEligible = points >= threshold;

  const headerProfileInfo = (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shadow-sm shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              {client ? `PASS DE FIDÉLITÉ • ${client.nom.toUpperCase()}` : 'PASS DE FIDÉLITÉ WALLET'}
            </p>
            <h3 className="text-sm md:text-base font-display font-extrabold text-white tracking-tight font-mono uppercase">
              {idPassWallet}
            </h3>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1 px-3 text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-200 rounded-full transition-all outline-none cursor-pointer"
        >
          Scanner un autre pass
        </button>
      </div>

      {/* Progress Arc and state stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Visual indicators */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solde Actuel</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl font-display font-extrabold text-white tracking-tight font-mono">{points}</span>
                <span className="text-[10px] text-white font-bold uppercase font-mono">pts</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seuil De Remise</span>
              <div className="flex items-baseline gap-1 mt-1 justify-end">
                <span className="text-xl font-display font-extrabold text-slate-200">{threshold}</span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase font-mono">pts</span>
              </div>
            </div>
          </div>

          {/* Custom styled Progress bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800/65">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isEligible ? 'bg-white shadow-[0_0_8px_1px_rgba(255,255,255,0.4)]' : 'bg-slate-700'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 font-mono">
              <span>0 PT</span>
              <span>{progressPercent.toFixed(0)}% DU SEUIL</span>
              <span>{threshold} PTS</span>
            </div>
          </div>
        </div>

        {/* Dynamic Action Trigger/Reward Banner */}
        <div className="h-full flex">
          {isEligible ? (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  REMISE DISPONIBLE !
                </h4>
                <p className="text-[11px] text-emerald-350/80 mt-1 lines-relaxed leading-snug">
                  Le client a atteint le seuil requis de <strong>{threshold} points</strong>. Encaisser ou déduire l'offre de récompense en boutique.
                </p>
              </div>
              <ShinyButton
                type="button"
                onClick={handleRedeemDiscount}
                disabled={isSubmitting}
                className="mt-4 w-full"
              >
                <Ticket className="w-3.5 h-3.5 text-white" />
                Consommer la remise (-{threshold} pts)
              </ShinyButton>
            </div>
          ) : (
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center text-center">
              <Award className="w-7 h-7 text-slate-500 mx-auto mb-2.5" />
              <p className="text-xs font-semibold text-slate-350">Progression en cours</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[190px] mx-auto leading-relaxed">
                Il reste encore <strong className="text-white font-mono text-[11px]">{threshold - points} points</strong> avant la remise chez vous.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const clientProfileSection = (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-medium text-slate-100 tracking-tight flex items-center gap-2 uppercase">
          <UserCheck className="w-4 h-4 text-slate-300" />
          Fiche Client Coordonnées
        </h3>
        {client ? (
          <span className="text-[9px] font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-full uppercase font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-white" />
            Compte Enregistré
          </span>
        ) : (
          <span className="text-[9px] font-bold text-slate-400 bg-slate-808/60 border border-slate-700 px-2.5 py-1 rounded-full uppercase font-mono">
            Non Renseigné
          </span>
        )}
      </div>

      {client ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-850">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Nom Complet
            </span>
            <p className="text-xs text-white font-semibold mt-1">{client.nom}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Adresse Email
            </span>
            <p className="text-xs text-white font-semibold mt-1 truncate">{client.email || '— Non renseigné'}</p>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Téléphone
            </span>
            <p className="text-xs text-white font-semibold mt-1 font-mono">{client.telephone || '— Non renseigné'}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Ce pass d'identification n'est pas encore associé à une fiche client. Enregistrez les coordonnées ci-dessous pour mieux le fidéliser.
          </p>

          <form onSubmit={handleRegisterClientSubmit} className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Nom Complet du client <span className="text-white font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-xl text-xs font-semibold outline-none text-slate-100 placeholder-slate-650"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Numéro de Téléphone
                </label>
                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="Ex: 06 12 34 56 78"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-xl text-xs font-semibold font-mono outline-none text-slate-100 placeholder-slate-650"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Adresse Email
              </label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="Ex: jean.dupont@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-xl text-xs font-semibold outline-none text-slate-100 placeholder-slate-650"
              />
            </div>

            <ShinyButton
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              Créer la Fiche Client Coordonnées
            </ShinyButton>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6" id="loyalty-hub-container">
      {/* QR Code Creation Modal */}
      <AnimatePresence>
        {createdClientPass && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 via-white to-white/30" />
              
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-base font-display font-extrabold text-white tracking-tight uppercase">
                Fiche Client Créée !
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 px-2 leading-relaxed">
                Le pass de fidélité a été rattaché avec succès. Présentez ou téléchargez ce QR code pour l'ajouter au smartphone du client.
              </p>

              {/* QR Code Render Area */}
              <div className="my-6 bg-white p-3 rounded-2xl inline-block shadow-inner border border-slate-705 mx-auto">
                <canvas ref={qrCanvasRef} className="w-[180px] h-[180px] block" />
              </div>

              <div className="mb-4">
                <p className="text-xs font-mono font-bold text-slate-200 tracking-wider bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
                  {createdClientPass}
                </p>
              </div>

              {/* Operations row */}
              <div className="grid grid-cols-2 gap-2.5 mt-5 mb-5">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
                <button
                  type="button"
                  onClick={handleShareQr}
                  className="px-3 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Partager
                    </>
                  )}
                </button>
              </div>

              <ShinyButton
                type="button"
                onClick={() => setCreatedClientPass(null)}
                className="w-full"
              >
                Fermer & Continuer
              </ShinyButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Celebration Popup */}
      <AnimatePresence>
        {celebrateDiscount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-950 border border-white/20 text-white rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-xl font-display font-extrabold tracking-tight">Coup de poing ! Remise Disponible !</h3>
            <p className="text-xs text-white/90 mt-1.5 max-w-[280px] leading-relaxed">
              Le client bénéficie maintenant d'une remise chez {merchant.nom_enseigne} ! Présentez-lui sa réduction !
            </p>

            <div className="flex gap-2.5 mt-5 w-full justify-center">
              <button
                onClick={handleRedeemDiscount}
                className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Valider la remise
              </button>
              <button
                onClick={() => setCelebrateDiscount(false)}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {client ? headerProfileInfo : clientProfileSection}
      {client ? clientProfileSection : headerProfileInfo}

      {/* Credit transaction amount section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6">
        <h3 className="text-sm font-display font-medium text-slate-100 tracking-tight flex items-center gap-2 mb-5 uppercase">
          <Coins className="w-4 h-4 text-slate-300" />
          Ajouter une transaction
        </h3>

        {/* Amount VS points formula toggle tabs */}
        <div className="grid grid-cols-2 gap-2 mb-5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => startTransition(() => setUseAmountFormula(true))}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all outline-none text-center cursor-pointer ${
              useAmountFormula
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            type="button"
          >
            Par Montant Encaissé (€)
          </button>
          <button
            onClick={() => startTransition(() => setUseAmountFormula(false))}
            className={`py-2 text-[10px] font-bold rounded-lg transition-all outline-none text-center cursor-pointer ${
              !useAmountFormula
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            type="button"
          >
            Saisie de Points Directs
          </button>
        </div>

        <form onSubmit={handleAddPointsSubmit} className="space-y-4">
          {useAmountFormula ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Montant de l'achat (€)
                </label>
                <span className="text-[9px] text-white bg-white/10 border border-white/10 px-2 py-0.5 rounded font-mono font-bold">
                  Rule: 1€ = 1 Point
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Ex: 14.50"
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-2xl text-sm font-semibold font-mono outline-none text-slate-100 placeholder-slate-650"
                  required
                  id="transaction-amount-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 font-mono">€</span>
              </div>
              {amountInput && parseFloat(amountInput) > 0 && (
                <p className="text-[11px] text-slate-400 mt-2 italic flex items-center gap-1 font-mono">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/50" />
                  Cette transaction va créditer{' '}
                  <strong className="text-white font-mono text-xs">{Math.floor(parseFloat(amountInput))} points</strong>.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nombre de points à ajouter (Direct)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  placeholder="Ex: 15"
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-850 focus:border-slate-400 focus:bg-slate-900 rounded-2xl text-sm font-semibold font-mono outline-none text-slate-100 placeholder-slate-650"
                  required
                  id="transaction-points-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">PTS</span>
              </div>
            </div>
          )}

          <ShinyButton
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4"
            id="credit-points-btn"
          >
            {isSubmitting ? 'Crédit en cours...' : 'Créditer les points au client'}
          </ShinyButton>
        </form>
      </div>

      {/* Recent History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6">
        <h3 className="text-sm font-display font-medium text-slate-100 tracking-tight flex items-center gap-2 mb-4 uppercase">
          <History className="w-4 h-4 text-slate-400" />
          Historique récent de l'enseigne
        </h3>

        {recentMerchantTxs.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-slate-500 font-mono">
            Aucun crédit enregistré aujourd’hui sur votre enseigne.
          </div>
        ) : (
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {recentMerchantTxs.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-mono font-semibold text-slate-200 uppercase">{tx.id_pass_wallet}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    {new Date(tx.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-[10px] font-bold font-mono px-2 py-0.5 rounded text-white bg-white/10">
                  {tx.type === 'addition' ? `+${tx.points_ajoutes} pts` : `-${Math.abs(tx.points_ajoutes)} pts (REMISE)`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
