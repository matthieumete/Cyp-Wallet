// Types partagés entre l'app commerçant (src/) et le portail client (client-portal/).
// Reflètent le schéma défini dans supabase/migrations/.

export interface Commercant {
  id: string;
  nom_enseigne: string;
  identifiant: string;
  mot_de_passe_hash: string;
  seuil_remise_pts: number;
}

export interface ClientSaintCyp {
  id_pass_wallet: string;
  nom: string;
  email?: string;
  telephone?: string;
  date_creation: string;
  auth_user_id?: string | null;
}

export interface CagnotteSaintCyp {
  id_pass_wallet: string;
  commercant_id: string;
  points_cumules: number;
  remise_dispo: boolean;
}

export interface TransactionHistory {
  id: string;
  id_pass_wallet: string;
  commercant_id: string;
  points_ajoutes: number;
  type: 'addition' | 'remise';
  date: string;
}

export interface Produit {
  id: string;
  commercant_id: string;
  nom: string;
  description?: string | null;
  prix_cents: number;
  unite?: string | null;
  categorie?: string | null;
  image_url?: string | null;
  stock?: number | null;
  disponible: boolean;
  position: number;
  date_creation: string;
  date_modification: string;
}

export type StatutCommande =
  | 'en_attente'
  | 'confirmee'
  | 'prete'
  | 'retiree'
  | 'annulee';

export interface Commande {
  id: string;
  id_pass_wallet: string;
  commercant_id: string;
  statut: StatutCommande;
  creneau_retrait?: string | null;
  total_cents: number;
  note_client?: string | null;
  date_creation: string;
  date_modification: string;
}

export interface CommandeItem {
  id: string;
  commande_id: string;
  produit_id?: string | null;
  produit_nom: string;
  quantite: number;
  prix_unitaire_cents: number;
  unite?: string | null;
}

export interface CommandeAvecItems extends Commande {
  items: CommandeItem[];
  commercant?: Pick<Commercant, 'id' | 'nom_enseigne'>;
}

export const STATUT_LABELS: Record<StatutCommande, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  prete: 'Prête à retirer',
  retiree: 'Retirée',
  annulee: 'Annulée',
};

export function formatPrixCents(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
}
