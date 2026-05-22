export interface Commercant {
  id: string; // UUID
  nom_enseigne: string;
  identifiant: string;
  mot_de_passe_hash: string;
  seuil_remise_pts: number;
}

export interface CagnotteSaintCyp {
  id_pass_wallet: string;
  commercant_id: string; // UUID
  points_cumules: number;
  remise_dispo: boolean;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  isEnabled: boolean;
  isFromEnv?: boolean;
}

export interface ClientSaintCyp {
  id_pass_wallet: string;
  nom: string;
  email?: string;
  telephone?: string;
  date_creation: string;
}

export interface TransactionHistory {
  id: string;
  id_pass_wallet: string;
  commercant_id: string;
  points_ajoutes: number;
  type: 'addition' | 'remise';
  date: string;
}
