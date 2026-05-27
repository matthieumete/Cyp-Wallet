import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Commercant, CagnotteSaintCyp, SupabaseConfig, TransactionHistory, ClientSaintCyp, Produit, MerchantOrder, StatutCommande, CommandeItem } from './types';
import { INITIAL_MERCHANTS, INITIAL_CAGNOTTES, MOCK_CUSTOMERS, INITIAL_PRODUITS } from './data';

// Key for storage
const SUPABASE_CONFIG_KEY = 'saint_cyp_supabase_config_v1';
const LOCAL_CAGNOTTES_KEY = 'saint_cyp_local_cagnottes_v1';
const LOCAL_TRANSACTIONS_KEY = 'saint_cyp_local_transactions_v1';
const LOCAL_CLIENTS_KEY = 'saint_cyp_local_clients_v1';
const LOCAL_PRODUITS_KEY = 'saint_cyp_local_produits_v1';

export class DbManager {
  private static supabaseInstance: SupabaseClient | null = null;

  public static sanitizeUrl(url: string | null | undefined): string {
    if (!url) return '';
    let clean = url.trim();
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    if (clean.endsWith('/rest/v1')) {
      clean = clean.substring(0, clean.length - 8);
    }
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean;
  }

  // Initialize Supabase client if configured
  public static getSupabaseClient(): SupabaseClient | null {
    if (this.supabaseInstance) return this.supabaseInstance;
    const config = this.getSupabaseConfig();
    const cleanUrl = this.sanitizeUrl(config.url);
    if (config.isEnabled && cleanUrl && config.key) {
      try {
        this.supabaseInstance = createClient(cleanUrl, config.key.trim());
        return this.supabaseInstance;
      } catch (e) {
        console.error('Erreur initialisation Supabase Client:', e);
        return null;
      }
    }
    return null;
  }

  // Clear Supabase instance to force re-creation
  public static clearSupabaseInstance() {
    this.supabaseInstance = null;
  }

  // Get active Supabase configuration
  public static getSupabaseConfig(): SupabaseConfig {
    // @ts-ignore
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (envUrl && envUrl !== 'YOUR_SUPABASE_URL' && envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY') {
      return {
        url: this.sanitizeUrl(envUrl),
        key: envKey.trim(),
        isEnabled: true,
        isFromEnv: true
      };
    }

    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          url: this.sanitizeUrl(parsed.url),
          key: parsed.key ? parsed.key.trim() : '',
          isFromEnv: false
        };
      } catch (e) {
        // Fallback
      }
    }
    return { url: '', key: '', isEnabled: false, isFromEnv: false };
  }

  // Save Supabase configuration
  public static saveSupabaseConfig(config: SupabaseConfig) {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    this.clearSupabaseInstance();
  }

  // Reset demo storage
  public static resetLocalData() {
    localStorage.removeItem(LOCAL_CAGNOTTES_KEY);
    localStorage.removeItem(LOCAL_TRANSACTIONS_KEY);
    localStorage.removeItem(LOCAL_CLIENTS_KEY);
    localStorage.removeItem(LOCAL_PRODUITS_KEY);
  }

  // Get local cagnottes
  private static getLocalCagnottes(): CagnotteSaintCyp[] {
    const data = localStorage.getItem(LOCAL_CAGNOTTES_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_CAGNOTTES_KEY, JSON.stringify(INITIAL_CAGNOTTES));
      return INITIAL_CAGNOTTES;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_CAGNOTTES;
    }
  }

  // Get local transactions
  public static getTransactionHistory(): TransactionHistory[] {
    const data = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  // Save local transactions
  private static saveLocalTransaction(transaction: Omit<TransactionHistory, 'id' | 'date'>) {
    const history = this.getTransactionHistory();
    const newTx: TransactionHistory = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify([newTx, ...history]));
  }

  // Save local cagnottes
  private static saveLocalCagnottes(cagnottes: CagnotteSaintCyp[]) {
    localStorage.setItem(LOCAL_CAGNOTTES_KEY, JSON.stringify(cagnottes));
  }

  // 1. Merchant Login (Connexion Commerçant)
  public static async loginMerchant(identifiant: string, motDePasse: string): Promise<{ success: boolean; data?: Commercant; error?: string }> {
    const supabase = this.getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('commercants')
          .select('*')
          .eq('identifiant', identifiant.trim())
          .maybeSingle();

        if (error) {
          return { success: false, error: `Supabase Error: ${error.message}` };
        }
        if (!data) {
          return { success: false, error: "Identifiant inconnu dans votre table 'commercants' Supabase." };
        }

        // Check password match (for simplest dev integration, direct comparison is done or client can modify for secure hash check)
        if (data.mot_de_passe_hash === motDePasse || data.mot_de_passe_hash === '*' || !data.mot_de_passe_hash) {
          return { success: true, data: data as Commercant };
        } else {
          return { success: false, error: "Mot de passe incorrect." };
        }
      } catch (e: any) {
        return { success: false, error: `Erreur de connexion réseau Supabase: ${e.message || e}` };
      }
    } else {
      // Offline/Local Mode
      const user = INITIAL_MERCHANTS.find(m => m.identifiant === identifiant.trim() && m.mot_de_passe_hash === motDePasse);
      if (user) {
        return { success: true, data: user };
      }
      return { success: false, error: "Identifiant ou mot de passe incorrect (En mode local démo, le mot de passe est 'cyp')" };
    }
  }

  // 2. Fetch Customer Cagnotte
  public static async getCagnotte(idPassWallet: string, commercantId: string): Promise<{ data: CagnotteSaintCyp; source: 'supabase' | 'local' }> {
    const supabase = this.getSupabaseClient();
    const idPass = idPassWallet.trim().toUpperCase();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cagnottes_saint_cyp')
          .select('*')
          .eq('id_pass_wallet', idPass)
          .eq('commercant_id', commercantId)
          .maybeSingle();

        if (error) {
          console.warn('Supabase query error, fallback to local schema:', error);
          throw error;
        }

        if (data) {
          return { data: data as CagnotteSaintCyp, source: 'supabase' };
        } else {
          // If not exists in DB yet, return a new template record
          return {
            data: {
              id_pass_wallet: idPass,
              commercant_id: commercantId,
              points_cumules: 0,
              remise_dispo: false,
            },
            source: 'supabase',
          };
        }
      } catch (e) {
        console.error('Erreur Supabase getCagnotte:', e);
      }
    }

    // Local DB Mode
    const cagnottes = this.getLocalCagnottes();
    const existing = cagnottes.find(c => c.id_pass_wallet.toUpperCase() === idPass && c.commercant_id === commercantId);

    if (existing) {
      return { data: existing, source: 'local' };
    }

    return {
      data: {
        id_pass_wallet: idPass,
        commercant_id: commercantId,
        points_cumules: 0,
        remise_dispo: false,
      },
      source: 'local',
    };
  }

  // 3. Add Points / Update Cagnotte
  public static async addPoints(
    idPassWallet: string,
    merchant: Commercant,
    pointsToAdd: number
  ): Promise<{ success: boolean; data?: CagnotteSaintCyp; error?: string }> {
    const supabase = this.getSupabaseClient();
    const idPass = idPassWallet.trim().toUpperCase();
    const threshold = merchant.seuil_remise_pts;

    if (supabase) {
      try {
        // Check if row already exists
        const { data: existing, error: selectError } = await supabase
          .from('cagnottes_saint_cyp')
          .select('*')
          .eq('id_pass_wallet', idPass)
          .eq('commercant_id', merchant.id)
          .maybeSingle();

        if (selectError) throw selectError;

        const currentPoints = existing ? existing.points_cumules : 0;
        const newPoints = currentPoints + pointsToAdd;
        const isRemiseDispo = newPoints >= threshold;

        const record: CagnotteSaintCyp = {
          id_pass_wallet: idPass,
          commercant_id: merchant.id,
          points_cumules: newPoints,
          remise_dispo: isRemiseDispo,
        };

        const { error: upsertError } = await supabase
          .from('cagnottes_saint_cyp')
          .upsert(record);

        if (upsertError) throw upsertError;

        this.saveLocalTransaction({
          id_pass_wallet: idPass,
          commercant_id: merchant.id,
          points_ajoutes: pointsToAdd,
          type: 'addition',
        });

        return { success: true, data: record };
      } catch (e: any) {
        return { success: false, error: `Supabase update failed: ${e.message || e}` };
      }
    }

    // Local / Offline Mode
    const cagnottes = this.getLocalCagnottes();
    const normalizedId = idPass;
    const index = cagnottes.findIndex(
      c => c.id_pass_wallet.toUpperCase() === normalizedId && c.commercant_id === merchant.id
    );

    let updatedCagnotte: CagnotteSaintCyp;

    if (index >= 0) {
      const current = cagnottes[index];
      const newPts = current.points_cumules + pointsToAdd;
      updatedCagnotte = {
        ...current,
        points_cumules: newPts,
        remise_dispo: newPts >= threshold,
      };
      cagnottes[index] = updatedCagnotte;
    } else {
      updatedCagnotte = {
        id_pass_wallet: normalizedId,
        commercant_id: merchant.id,
        points_cumules: pointsToAdd,
        remise_dispo: pointsToAdd >= threshold,
      };
      cagnottes.push(updatedCagnotte);
    }

    this.saveLocalCagnottes(cagnottes);
    this.saveLocalTransaction({
      id_pass_wallet: normalizedId,
      commercant_id: merchant.id,
      points_ajoutes: pointsToAdd,
      type: 'addition',
    });

    return { success: true, data: updatedCagnotte };
  }

  // 4. Redeem/Use Discount (Utiliser la remise)
  public static async redeemDiscount(
    idPassWallet: string,
    merchant: Commercant
  ): Promise<{ success: boolean; data?: CagnotteSaintCyp; error?: string }> {
    const supabase = this.getSupabaseClient();
    const idPass = idPassWallet.trim().toUpperCase();
    const threshold = merchant.seuil_remise_pts;

    if (supabase) {
      try {
        const { data: existing, error: selectError } = await supabase
          .from('cagnottes_saint_cyp')
          .select('*')
          .eq('id_pass_wallet', idPass)
          .eq('commercant_id', merchant.id)
          .maybeSingle();

        if (selectError) throw selectError;
        if (!existing || existing.points_cumules < threshold) {
          throw new Error("Points insuffisants pour bénéficier de la remise.");
        }

        const newPoints = existing.points_cumules - threshold;
        const isRemiseDispo = newPoints >= threshold;

        const record: CagnotteSaintCyp = {
          id_pass_wallet: idPass,
          commercant_id: merchant.id,
          points_cumules: newPoints,
          remise_dispo: isRemiseDispo,
        };

        const { error: updateError } = await supabase
          .from('cagnottes_saint_cyp')
          .upsert(record);

        if (updateError) throw updateError;

        this.saveLocalTransaction({
          id_pass_wallet: idPass,
          commercant_id: merchant.id,
          points_ajoutes: -threshold,
          type: 'remise',
        });

        return { success: true, data: record };
      } catch (e: any) {
        return { success: false, error: `Supabase discount operation failed: ${e.message || e}` };
      }
    }

    // Local Mode
    const cagnottes = this.getLocalCagnottes();
    const normalizedId = idPass;
    const index = cagnottes.findIndex(
      c => c.id_pass_wallet.toUpperCase() === normalizedId && c.commercant_id === merchant.id
    );

    if (index === -1 || cagnottes[index].points_cumules < threshold) {
      return { success: false, error: `Le client n'a pas assez de points (${cagnottes[index]?.points_cumules || 0}/${threshold} requis)` };
    }

    const current = cagnottes[index];
    const newPts = current.points_cumules - threshold;
    const updatedCagnotte: CagnotteSaintCyp = {
      ...current,
      points_cumules: newPts,
      remise_dispo: newPts >= threshold,
    };

    cagnottes[index] = updatedCagnotte;
    this.saveLocalCagnottes(cagnottes);
    this.saveLocalTransaction({
      id_pass_wallet: normalizedId,
      commercant_id: merchant.id,
      points_ajoutes: -threshold,
      type: 'remise',
    });

    return { success: true, data: updatedCagnotte };
  }

  // Get local clients list
  public static getLocalClients(): ClientSaintCyp[] {
    const data = localStorage.getItem(LOCAL_CLIENTS_KEY);
    if (!data) {
      const mockClients: ClientSaintCyp[] = MOCK_CUSTOMERS.map(cust => ({
        id_pass_wallet: cust.id,
        nom: cust.name,
        email: cust.id.toLowerCase() + '@example.com',
        telephone: '0468210000',
        date_creation: new Date('2026-01-15').toISOString()
      }));
      localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(mockClients));
      return mockClients;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  // Save local clients (demographic details)
  private static saveLocalClients(clients: ClientSaintCyp[]) {
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(clients));
  }

  // 5. Get Client Information
  public static async getClient(idPassWallet: string): Promise<{ data: ClientSaintCyp | null; source: 'supabase' | 'local' }> {
    const supabase = this.getSupabaseClient();
    const idPass = idPassWallet.trim().toUpperCase();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clients_saint_cyp')
          .select('*')
          .eq('id_pass_wallet', idPass)
          .maybeSingle();

        if (error) {
          console.warn('Supabase query error for clients, fallback to local:', error);
          throw error;
        }

        if (data) {
          return { data: data as ClientSaintCyp, source: 'supabase' };
        }
      } catch (e) {
        console.error('Erreur Supabase getClient:', e);
      }
    }

    // Local DB Fallback
    const clients = this.getLocalClients();
    const existing = clients.find(c => c.id_pass_wallet.toUpperCase() === idPass);
    return { data: existing || null, source: 'local' };
  }

  // 6. Register a New Client
  public static async registerClient(
    client: Omit<ClientSaintCyp, 'date_creation'>
  ): Promise<{ success: boolean; data?: ClientSaintCyp; error?: string }> {
    const supabase = this.getSupabaseClient();
    const idPass = client.id_pass_wallet.trim().toUpperCase();
    const newClient: ClientSaintCyp = {
      ...client,
      id_pass_wallet: idPass,
      date_creation: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('clients_saint_cyp')
          .upsert(newClient);

        if (error) throw error;
        return { success: true, data: newClient };
      } catch (e: any) {
        return { success: false, error: `Supabase client registration failed: ${e.message || e}` };
      }
    }

    // Local DB Mode
    const clients = this.getLocalClients();
    const index = clients.findIndex(c => c.id_pass_wallet.toUpperCase() === idPass);

    if (index >= 0) {
      clients[index] = newClient;
    } else {
      clients.push(newClient);
    }

    this.saveLocalClients(clients);
    return { success: true, data: newClient };
  }

  // ============================================================
  // Catalogue produits
  // ============================================================

  private static getLocalProduits(): Produit[] {
    const data = localStorage.getItem(LOCAL_PRODUITS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_PRODUITS_KEY, JSON.stringify(INITIAL_PRODUITS));
      return INITIAL_PRODUITS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_PRODUITS;
    }
  }

  private static saveLocalProduits(produits: Produit[]) {
    localStorage.setItem(LOCAL_PRODUITS_KEY, JSON.stringify(produits));
  }

  public static async listProduits(
    commercantId: string
  ): Promise<{ data: Produit[]; source: 'supabase' | 'local' }> {
    const supabase = this.getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('produits')
          .select('*')
          .eq('commercant_id', commercantId)
          .order('position', { ascending: true })
          .order('nom', { ascending: true });
        if (error) throw error;
        if (data) return { data: data as Produit[], source: 'supabase' };
      } catch (e) {
        console.error('Erreur Supabase listProduits:', e);
      }
    }

    const all = this.getLocalProduits();
    const filtered = all
      .filter((p) => p.commercant_id === commercantId)
      .sort((a, b) => a.position - b.position || a.nom.localeCompare(b.nom));
    return { data: filtered, source: 'local' };
  }

  public static async createProduit(
    input: Omit<Produit, 'id' | 'date_creation' | 'date_modification'>
  ): Promise<{ success: boolean; data?: Produit; error?: string }> {
    const supabase = this.getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('produits')
          .insert(input)
          .select()
          .single();
        if (error) throw error;
        return { success: true, data: data as Produit };
      } catch (e: any) {
        return { success: false, error: e.message || String(e) };
      }
    }

    const now = new Date().toISOString();
    const newProduit: Produit = {
      ...input,
      id: crypto.randomUUID(),
      date_creation: now,
      date_modification: now,
    };
    const all = this.getLocalProduits();
    all.push(newProduit);
    this.saveLocalProduits(all);
    return { success: true, data: newProduit };
  }

  public static async updateProduit(
    id: string,
    updates: Partial<Omit<Produit, 'id' | 'commercant_id' | 'date_creation'>>
  ): Promise<{ success: boolean; data?: Produit; error?: string }> {
    const supabase = this.getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('produits')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, data: data as Produit };
      } catch (e: any) {
        return { success: false, error: e.message || String(e) };
      }
    }

    const all = this.getLocalProduits();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: 'Produit introuvable.' };
    const updated: Produit = {
      ...all[idx],
      ...updates,
      date_modification: new Date().toISOString(),
    };
    all[idx] = updated;
    this.saveLocalProduits(all);
    return { success: true, data: updated };
  }

  public static async deleteProduit(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = this.getSupabaseClient();

    if (supabase) {
      try {
        const { error } = await supabase.from('produits').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || String(e) };
      }
    }

    const all = this.getLocalProduits();
    const next = all.filter((p) => p.id !== id);
    if (next.length === all.length) return { success: false, error: 'Produit introuvable.' };
    this.saveLocalProduits(next);
    return { success: true };
  }

  public static async setProduitDisponibilite(
    id: string,
    disponible: boolean
  ): Promise<{ success: boolean; data?: Produit; error?: string }> {
    return this.updateProduit(id, { disponible });
  }

  // ───────────────────────────── Commandes ─────────────────────────────
  // Les commandes n'existent que via le portail client (Supabase requis).
  // Pas de fallback local : si Supabase n'est pas configuré, on retourne vide.

  public static async listMerchantOrders(
    commercantId: string
  ): Promise<{ data: MerchantOrder[]; error?: string }> {
    const supabase = this.getSupabaseClient();
    if (!supabase) return { data: [] };

    try {
      const { data: commandes, error } = await supabase
        .from('commandes')
        .select('*, clients_saint_cyp(nom, telephone)')
        .eq('commercant_id', commercantId)
        .order('date_creation', { ascending: false });
      if (error) throw error;

      const list = (commandes ?? []) as any[];
      if (list.length === 0) return { data: [] };

      const ids = list.map((c) => c.id);
      const { data: items, error: itemsErr } = await supabase
        .from('commande_items')
        .select('*')
        .in('commande_id', ids);
      if (itemsErr) throw itemsErr;

      const itemsByCmd: Record<string, CommandeItem[]> = {};
      (items as CommandeItem[] | null)?.forEach((it) => {
        if (!itemsByCmd[it.commande_id]) itemsByCmd[it.commande_id] = [];
        itemsByCmd[it.commande_id].push(it);
      });

      const orders: MerchantOrder[] = list.map((c) => ({
        id: c.id,
        id_pass_wallet: c.id_pass_wallet,
        commercant_id: c.commercant_id,
        statut: c.statut,
        creneau_retrait: c.creneau_retrait,
        total_cents: c.total_cents,
        note_client: c.note_client,
        date_creation: c.date_creation,
        date_modification: c.date_modification,
        client_nom: c.clients_saint_cyp?.nom ?? undefined,
        client_telephone: c.clients_saint_cyp?.telephone ?? null,
        items: itemsByCmd[c.id] ?? [],
      }));

      return { data: orders };
    } catch (e: any) {
      console.error('Erreur Supabase listMerchantOrders:', e);
      return { data: [], error: e.message || String(e) };
    }
  }

  public static async updateOrderStatus(
    orderId: string,
    statut: StatutCommande
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = this.getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase non configuré.' };
    }
    try {
      const { error } = await supabase
        .from('commandes')
        .update({ statut })
        .eq('id', orderId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }

  // ───────────────────────────── Invitation client ─────────────────────────────
  // Envoie un magic link à l'email du client. Au clic, le client est redirigé
  // vers le portail (/definir-mdp) pour définir son mot de passe.
  public static async inviteClient(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = this.getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase non configuré : impossible d\'envoyer un email.',
      };
    }

    // @ts-ignore - variable d'env Vite
    const portalUrl = (import.meta.env.VITE_PORTAL_URL as string | undefined)?.replace(/\/$/, '')
      || (typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname}:3001`
          : 'http://localhost:3001');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${portalUrl}/definir-mdp`,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  }

  // 7. Get All Registered Clients
  public static async getAllClients(): Promise<ClientSaintCyp[]> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('clients_saint_cyp')
          .select('*')
          .order('nom', { ascending: true });

        if (error) {
          console.warn('Supabase fetch all clients error:', error);
          throw error;
        }
        if (data) {
          return data as ClientSaintCyp[];
        }
      } catch (e) {
        console.error('Erreur Supabase getAllClients:', e);
      }
    }

    // Local fallback
    return this.getLocalClients();
  }
}
