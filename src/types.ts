export * from '../shared/types';

import type { Commande, CommandeItem } from '../shared/types';

export interface MerchantOrder extends Commande {
  client_nom?: string;
  client_telephone?: string | null;
  items: CommandeItem[];
}

export interface SupabaseConfig {
  url: string;
  key: string;
  isEnabled: boolean;
  isFromEnv?: boolean;
}
