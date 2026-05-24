-- ============================================================
-- Extension du schéma Cyp-Wallet pour le portail client.
-- À exécuter une fois dans l'éditeur SQL Supabase.
-- Idempotent : peut être rejoué sans casser l'existant.
-- ============================================================

------------------------------------------------------------
-- 1. Extensions
------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

------------------------------------------------------------
-- 2. Lien clients_saint_cyp <-> Supabase Auth
--    auth_user_id reste nullable : les clients déjà créés
--    par l'app commerçant (sans inscription en ligne)
--    continuent d'exister sans compte associé.
------------------------------------------------------------
ALTER TABLE clients_saint_cyp
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_saint_cyp_auth_user_id_idx
  ON clients_saint_cyp(auth_user_id);

------------------------------------------------------------
-- 3. Catalogue produits par commerçant
--    prix_cents : entier en centimes (pas de float)
--    unite : 'pièce', 'kg', 'g', 'L', 'botte', 'tasse'...
--    stock : NULL = stock illimité
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    prix_cents INTEGER NOT NULL CHECK (prix_cents >= 0),
    unite TEXT,
    categorie TEXT,
    image_url TEXT,
    stock INTEGER CHECK (stock IS NULL OR stock >= 0),
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    position INTEGER NOT NULL DEFAULT 0,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (commercant_id, nom)
);

CREATE INDEX IF NOT EXISTS produits_commercant_disponible_idx
  ON produits(commercant_id, disponible);
CREATE INDEX IF NOT EXISTS produits_categorie_idx
  ON produits(categorie);

------------------------------------------------------------
-- 4. Commandes (en-tête)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pass_wallet TEXT NOT NULL REFERENCES clients_saint_cyp(id_pass_wallet) ON DELETE CASCADE,
    commercant_id UUID NOT NULL REFERENCES commercants(id) ON DELETE RESTRICT,
    statut TEXT NOT NULL DEFAULT 'en_attente'
      CHECK (statut IN ('en_attente','confirmee','prete','retiree','annulee')),
    creneau_retrait TIMESTAMP WITH TIME ZONE,
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    note_client TEXT,
    date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commandes_id_pass_wallet_idx
  ON commandes(id_pass_wallet);
CREATE INDEX IF NOT EXISTS commandes_commercant_statut_idx
  ON commandes(commercant_id, statut);
CREATE INDEX IF NOT EXISTS commandes_date_creation_idx
  ON commandes(date_creation DESC);

------------------------------------------------------------
-- 5. Lignes de commande
--    produit_nom / prix_unitaire_cents / unite : snapshot
--    pour conserver l'historique même si le produit est
--    modifié ou supprimé ensuite.
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commande_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id UUID NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produits(id) ON DELETE SET NULL,
    produit_nom TEXT NOT NULL,
    quantite NUMERIC(10, 3) NOT NULL CHECK (quantite > 0),
    prix_unitaire_cents INTEGER NOT NULL CHECK (prix_unitaire_cents >= 0),
    unite TEXT
);

CREATE INDEX IF NOT EXISTS commande_items_commande_id_idx
  ON commande_items(commande_id);

------------------------------------------------------------
-- 6. Trigger : mise à jour automatique de date_modification
------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_date_modification()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_produits_modif ON produits;
CREATE TRIGGER trg_produits_modif
  BEFORE UPDATE ON produits
  FOR EACH ROW EXECUTE FUNCTION set_date_modification();

DROP TRIGGER IF EXISTS trg_commandes_modif ON commandes;
CREATE TRIGGER trg_commandes_modif
  BEFORE UPDATE ON commandes
  FOR EACH ROW EXECUTE FUNCTION set_date_modification();

------------------------------------------------------------
-- 7. Row Level Security
--
-- Modèle :
--   - Rôle `anon` (utilisé par l'app commerçant en mode demo) :
--     accès complet, à durcir quand les commerçants migreront
--     vers Supabase Auth.
--   - Rôle `authenticated` (portail client) : un client ne voit
--     et n'écrit que sur ses propres lignes, via auth_user_id.
------------------------------------------------------------
ALTER TABLE produits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE commande_items   ENABLE ROW LEVEL SECURITY;

-- ---------- produits ----------
DROP POLICY IF EXISTS "Produits public select" ON produits;
CREATE POLICY "Produits public select" ON produits
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Produits anon write (wallet)" ON produits;
CREATE POLICY "Produits anon write (wallet)" ON produits
  FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ---------- commandes ----------
DROP POLICY IF EXISTS "Commandes anon full (wallet)" ON commandes;
CREATE POLICY "Commandes anon full (wallet)" ON commandes
  FOR ALL TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Commandes client select own" ON commandes;
CREATE POLICY "Commandes client select own" ON commandes
  FOR SELECT TO authenticated
  USING (id_pass_wallet IN (
    SELECT id_pass_wallet FROM clients_saint_cyp
    WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Commandes client insert own" ON commandes;
CREATE POLICY "Commandes client insert own" ON commandes
  FOR INSERT TO authenticated
  WITH CHECK (id_pass_wallet IN (
    SELECT id_pass_wallet FROM clients_saint_cyp
    WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Commandes client update own pending" ON commandes;
CREATE POLICY "Commandes client update own pending" ON commandes
  FOR UPDATE TO authenticated
  USING (
    id_pass_wallet IN (
      SELECT id_pass_wallet FROM clients_saint_cyp
      WHERE auth_user_id = auth.uid()
    )
    AND statut = 'en_attente'
  )
  WITH CHECK (
    id_pass_wallet IN (
      SELECT id_pass_wallet FROM clients_saint_cyp
      WHERE auth_user_id = auth.uid()
    )
  );

-- ---------- commande_items ----------
DROP POLICY IF EXISTS "Items anon full (wallet)" ON commande_items;
CREATE POLICY "Items anon full (wallet)" ON commande_items
  FOR ALL TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Items client select via commande" ON commande_items;
CREATE POLICY "Items client select via commande" ON commande_items
  FOR SELECT TO authenticated
  USING (commande_id IN (
    SELECT co.id FROM commandes co
    JOIN clients_saint_cyp cl ON cl.id_pass_wallet = co.id_pass_wallet
    WHERE cl.auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Items client insert via commande" ON commande_items;
CREATE POLICY "Items client insert via commande" ON commande_items
  FOR INSERT TO authenticated
  WITH CHECK (commande_id IN (
    SELECT co.id FROM commandes co
    JOIN clients_saint_cyp cl ON cl.id_pass_wallet = co.id_pass_wallet
    WHERE cl.auth_user_id = auth.uid()
  ));

-- ---------- clients_saint_cyp : ajout d'un accès self-service authentifié ----------
DROP POLICY IF EXISTS "Clients self select" ON clients_saint_cyp;
CREATE POLICY "Clients self select" ON clients_saint_cyp
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Clients self insert" ON clients_saint_cyp;
CREATE POLICY "Clients self insert" ON clients_saint_cyp
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Clients self update" ON clients_saint_cyp;
CREATE POLICY "Clients self update" ON clients_saint_cyp
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ---------- cagnottes_saint_cyp : ajout d'un accès lecture authentifié ----------
DROP POLICY IF EXISTS "Cagnottes self select" ON cagnottes_saint_cyp;
CREATE POLICY "Cagnottes self select" ON cagnottes_saint_cyp
  FOR SELECT TO authenticated
  USING (id_pass_wallet IN (
    SELECT id_pass_wallet FROM clients_saint_cyp
    WHERE auth_user_id = auth.uid()
  ));

------------------------------------------------------------
-- 8. Données de démonstration : catalogue de produits
--    UNIQUE(commercant_id, nom) → ON CONFLICT DO NOTHING
--    rend le seed idempotent.
------------------------------------------------------------
INSERT INTO produits (commercant_id, nom, description, prix_cents, unite, categorie, position) VALUES
  -- Boulangerie L'Épi d'Or
  ('a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Baguette tradition', 'Cuite au feu de bois, pétrie à la main', 120, 'pièce', 'Pain', 1),
  ('a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Pain de campagne', 'Levain naturel · pain de 500g', 480, 'pièce', 'Pain', 2),
  ('a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Croissant beurre AOP', 'Pur beurre Charentes-Poitou', 120, 'pièce', 'Viennoiserie', 3),
  ('a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Pain aux céréales bio', '6 céréales · farine bio locale', 380, 'pièce', 'Pain', 4),
  ('a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Brioche tressée maison', 'Au beurre, recette familiale', 750, 'pièce', 'Viennoiserie', 5),
  -- Boucherie Catalane
  ('b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Côte de bœuf Bazadaise', 'Race bouchère, vieillie 3 semaines', 4200, 'kg', 'Bœuf', 1),
  ('b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Saucisse catalane', 'Recette traditionnelle, à l''ail rose', 1850, 'kg', 'Charcuterie', 2),
  ('b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Boudin noir maison', 'Préparé chaque mardi', 1600, 'kg', 'Charcuterie', 3),
  ('b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Magret de canard du Sud-Ouest', 'IGP, élevage en plein air', 2950, 'kg', 'Volaille', 4),
  -- Café de l'Ancre
  ('c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'Café espresso', 'Mélange maison, torréfié à Perpignan', 180, 'tasse', 'Boisson', 1),
  ('c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'Formule petit-déj marin', 'Café + jus + viennoiserie', 580, 'formule', 'Petit-déj', 2),
  ('c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'Jus d''orange pressé', 'Oranges de Murcie, pressées minute', 350, 'verre', 'Boisson', 3),
  ('c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'Chocolat chaud à l''ancienne', 'Chocolat noir 70%, lait entier', 320, 'tasse', 'Boisson', 4),
  -- Le Comptoir de Saint-Cyp
  ('d6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', 'Tomme des Pyrénées', 'Lait de brebis, affinage 4 mois', 2800, 'kg', 'Fromage', 1),
  ('d6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', 'Anchois de Collioure', 'Bocal 200g, salaison artisanale', 980, 'pièce', 'Conserve', 2),
  ('d6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', 'Miel de garrigue', 'Pot 250g, récolte d''été', 750, 'pièce', 'Épicerie', 3),
  ('d6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', 'Huile d''olive Vallespir', 'Première pression à froid, 500ml', 1450, 'pièce', 'Épicerie', 4),
  -- Aux Saveurs du Port
  ('e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', 'Anchoïade traditionnelle', 'Recette Saint-Cyp, bocal 180g', 720, 'pièce', 'Tartinable', 1),
  ('e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', 'Tielle sétoise', 'Tourte au poulpe, cuite du jour', 480, 'pièce', 'Plat', 2),
  ('e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', 'Rouille catalane', 'Aïoli au safran, pour bouillabaisse', 580, 'pièce', 'Sauce', 3),
  ('e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', 'Sardines marinées au citron', 'Pêche locale, marinade 24h', 890, 'pièce', 'Poisson', 4)
ON CONFLICT (commercant_id, nom) DO NOTHING;

-- ============================================================
-- Fin de la migration.
-- Pour ré-exécuter : sans risque, toutes les opérations sont
-- protégées par IF NOT EXISTS, DROP+CREATE, ou ON CONFLICT.
-- ============================================================
