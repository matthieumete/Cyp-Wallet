import { supabase } from './supabase';
import type {
  Commercant,
  Produit,
  Commande,
  CommandeItem,
  CommandeAvecItems,
} from '@shared/types';

export async function listMerchants(): Promise<Commercant[]> {
  const { data, error } = await supabase
    .from('commercants')
    .select('*')
    .order('nom_enseigne', { ascending: true });
  if (error) throw error;
  return (data as Commercant[]) ?? [];
}

export async function getMerchant(id: string): Promise<Commercant | null> {
  const { data, error } = await supabase
    .from('commercants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Commercant | null;
}

export async function listProduitsAvailable(
  commercantId: string
): Promise<Produit[]> {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('commercant_id', commercantId)
    .eq('disponible', true)
    .order('position', { ascending: true })
    .order('nom', { ascending: true });
  if (error) throw error;
  return (data as Produit[]) ?? [];
}

export async function listCategoriesByMerchant(): Promise<
  Record<string, string[]>
> {
  const { data, error } = await supabase
    .from('produits')
    .select('commercant_id, categorie')
    .eq('disponible', true);
  if (error) throw error;
  const out: Record<string, Set<string>> = {};
  (data ?? []).forEach((row: any) => {
    if (!row.categorie) return;
    if (!out[row.commercant_id]) out[row.commercant_id] = new Set();
    out[row.commercant_id].add(row.categorie);
  });
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, Array.from(v).sort()])
  );
}

export interface PlaceOrderInput {
  passId: string;
  commercantId: string;
  items: { produit: Produit; quantite: number }[];
  creneauRetrait: string;
  noteClient?: string;
}

export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ commande?: Commande; error?: string }> {
  const total = input.items.reduce(
    (sum, it) => sum + it.produit.prix_cents * it.quantite,
    0
  );

  const { data: commande, error: commandeError } = await supabase
    .from('commandes')
    .insert({
      id_pass_wallet: input.passId,
      commercant_id: input.commercantId,
      statut: 'en_attente',
      creneau_retrait: input.creneauRetrait,
      total_cents: total,
      note_client: input.noteClient || null,
    })
    .select()
    .single();

  if (commandeError) return { error: commandeError.message };

  const itemsRows = input.items.map((it) => ({
    commande_id: (commande as Commande).id,
    produit_id: it.produit.id,
    produit_nom: it.produit.nom,
    quantite: it.quantite,
    prix_unitaire_cents: it.produit.prix_cents,
    unite: it.produit.unite,
  }));

  const { error: itemsError } = await supabase
    .from('commande_items')
    .insert(itemsRows);
  if (itemsError) return { error: itemsError.message };

  return { commande: commande as Commande };
}

export async function listOrdersForClient(
  passId: string
): Promise<Array<Commande & { commercant?: Pick<Commercant, 'id' | 'nom_enseigne'> }>> {
  const { data, error } = await supabase
    .from('commandes')
    .select('*, commercants(id, nom_enseigne)')
    .eq('id_pass_wallet', passId)
    .order('date_creation', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    commercant: row.commercants ?? undefined,
  }));
}

export async function getOrderDetail(
  id: string
): Promise<CommandeAvecItems | null> {
  const { data: cmd, error: cErr } = await supabase
    .from('commandes')
    .select('*, commercants(id, nom_enseigne)')
    .eq('id', id)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!cmd) return null;

  const { data: items, error: iErr } = await supabase
    .from('commande_items')
    .select('*')
    .eq('commande_id', id);
  if (iErr) throw iErr;

  const row = cmd as any;
  return {
    ...row,
    commercant: row.commercants ?? undefined,
    items: (items as CommandeItem[]) ?? [],
  };
}

export async function cancelOrder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('commandes')
    .update({ statut: 'annulee' })
    .eq('id', id)
    .eq('statut', 'en_attente');
  if (error) return { success: false, error: error.message };
  return { success: true };
}
