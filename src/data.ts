import { Commercant, CagnotteSaintCyp, Produit } from './types';

export const INITIAL_MERCHANTS: Commercant[] = [
  {
    id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
    nom_enseigne: "Boulangerie L'Épi d'Or",
    identifiant: 'boulangerie_epi',
    mot_de_passe_hash: 'cyp', // Simple password for demo
    seuil_remise_pts: 50,
  },
  {
    id: 'b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e',
    nom_enseigne: 'Boucherie Catalane',
    identifiant: 'boucherie_cat',
    mot_de_passe_hash: 'cyp',
    seuil_remise_pts: 100,
  },
  {
    id: 'c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f',
    nom_enseigne: "Café de l'Ancre",
    identifiant: 'cafe_ancre',
    mot_de_passe_hash: 'cyp',
    seuil_remise_pts: 40,
  },
  {
    id: 'd6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a',
    nom_enseigne: 'Le Comptoir de Saint-Cyp',
    identifiant: 'comptoir_cyp',
    mot_de_passe_hash: 'cyp',
    seuil_remise_pts: 60,
  },
  {
    id: 'e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b',
    nom_enseigne: 'Aux Saveurs du Port',
    identifiant: 'saveurs_port',
    mot_de_passe_hash: 'cyp',
    seuil_remise_pts: 50,
  },
];

export const INITIAL_CAGNOTTES: CagnotteSaintCyp[] = [
  // Jean Dupont (Close to discount in his favorite bakery)
  {
    id_pass_wallet: 'PASS-CYP-7391',
    commercant_id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', // Boulangerie
    points_cumules: 42,
    remise_dispo: false,
  },
  {
    id_pass_wallet: 'PASS-CYP-7391',
    commercant_id: 'b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', // Boucherie
    points_cumules: 15,
    remise_dispo: false,
  },
  // Marie Lambert (Starts with available points)
  {
    id_pass_wallet: 'PASS-CYP-8824',
    commercant_id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', // Boulangerie
    points_cumules: 52,
    remise_dispo: true,
  },
  {
    id_pass_wallet: 'PASS-CYP-8824',
    commercant_id: 'c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', // Café
    points_cumules: 12,
    remise_dispo: false,
  },
  // Pierre Martin
  {
    id_pass_wallet: 'PASS-CYP-1092',
    commercant_id: 'c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', // Café
    points_cumules: 35,
    remise_dispo: false,
  },
  {
    id_pass_wallet: 'PASS-CYP-1092',
    commercant_id: 'd6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', // Comptoir
    points_cumules: 58,
    remise_dispo: false,
  },
  // Sophie Durand (Close to discount in Boucherie)
  {
    id_pass_wallet: 'PASS-CYP-9921',
    commercant_id: 'b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', // Boucherie
    points_cumules: 95,
    remise_dispo: false,
  },
];

const nowIso = () => new Date().toISOString();
const baseProduit = (overrides: Partial<Produit>): Produit => ({
  id: crypto.randomUUID(),
  commercant_id: overrides.commercant_id!,
  nom: overrides.nom!,
  description: overrides.description ?? null,
  prix_cents: overrides.prix_cents!,
  unite: overrides.unite ?? null,
  categorie: overrides.categorie ?? null,
  image_url: overrides.image_url ?? null,
  stock: overrides.stock ?? null,
  disponible: overrides.disponible ?? true,
  position: overrides.position ?? 0,
  date_creation: nowIso(),
  date_modification: nowIso(),
});

export const INITIAL_PRODUITS: Produit[] = [
  // Boulangerie L'Épi d'Or
  baseProduit({ commercant_id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', nom: 'Baguette tradition', description: 'Cuite au feu de bois, pétrie à la main', prix_cents: 120, unite: 'pièce', categorie: 'Pain', position: 1 }),
  baseProduit({ commercant_id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', nom: 'Pain de campagne', description: 'Levain naturel · pain de 500g', prix_cents: 480, unite: 'pièce', categorie: 'Pain', position: 2 }),
  baseProduit({ commercant_id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', nom: 'Croissant beurre AOP', description: 'Pur beurre Charentes-Poitou', prix_cents: 120, unite: 'pièce', categorie: 'Viennoiserie', position: 3 }),
  baseProduit({ commercant_id: 'a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', nom: 'Pain aux céréales bio', description: '6 céréales · farine bio locale', prix_cents: 380, unite: 'pièce', categorie: 'Pain', position: 4 }),
  // Boucherie Catalane
  baseProduit({ commercant_id: 'b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', nom: 'Côte de bœuf Bazadaise', description: 'Race bouchère, vieillie 3 semaines', prix_cents: 4200, unite: 'kg', categorie: 'Bœuf', position: 1 }),
  baseProduit({ commercant_id: 'b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', nom: 'Saucisse catalane', description: 'Recette traditionnelle, à l\'ail rose', prix_cents: 1850, unite: 'kg', categorie: 'Charcuterie', position: 2 }),
  baseProduit({ commercant_id: 'b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', nom: 'Boudin noir maison', description: 'Préparé chaque mardi', prix_cents: 1600, unite: 'kg', categorie: 'Charcuterie', position: 3, disponible: false }),
  // Café de l'Ancre
  baseProduit({ commercant_id: 'c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', nom: 'Café espresso', description: 'Mélange maison, torréfié à Perpignan', prix_cents: 180, unite: 'tasse', categorie: 'Boisson', position: 1 }),
  baseProduit({ commercant_id: 'c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', nom: 'Formule petit-déj marin', description: 'Café + jus + viennoiserie', prix_cents: 580, unite: 'formule', categorie: 'Petit-déj', position: 2 }),
  // Le Comptoir de Saint-Cyp
  baseProduit({ commercant_id: 'd6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', nom: 'Tomme des Pyrénées', description: 'Lait de brebis, affinage 4 mois', prix_cents: 2800, unite: 'kg', categorie: 'Fromage', position: 1 }),
  baseProduit({ commercant_id: 'd6e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', nom: 'Anchois de Collioure', description: 'Bocal 200g, salaison artisanale', prix_cents: 980, unite: 'pièce', categorie: 'Conserve', position: 2 }),
  // Aux Saveurs du Port
  baseProduit({ commercant_id: 'e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', nom: 'Anchoïade traditionnelle', description: 'Recette Saint-Cyp, bocal 180g', prix_cents: 720, unite: 'pièce', categorie: 'Tartinable', position: 1 }),
  baseProduit({ commercant_id: 'e7f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', nom: 'Tielle sétoise', description: 'Tourte au poulpe, cuite du jour', prix_cents: 480, unite: 'pièce', categorie: 'Plat', position: 2 }),
];

export const MOCK_CUSTOMERS = [
  { id: 'PASS-CYP-7391', name: 'Jean Dupont' },
  { id: 'PASS-CYP-8824', name: 'Marie Lambert' },
  { id: 'PASS-CYP-1092', name: 'Pierre Martin' },
  { id: 'PASS-CYP-9921', name: 'Sophie Durand' },
];

export const SUPABASE_SETUP_SQL = `-- 1. Activez l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Créez la table des commerçants
CREATE TABLE IF NOT EXISTS commercants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_enseigne TEXT NOT NULL,
    identifiant TEXT UNIQUE NOT NULL,
    mot_de_passe_hash TEXT NOT NULL,
    seuil_remise_pts INT NOT NULL DEFAULT 50
);

-- 3. Créez la table des cagnottes des clients (StCyp'Wallet)
CREATE TABLE IF NOT EXISTS cagnottes_saint_cyp (
    id_pass_wallet TEXT NOT NULL,
    commercant_id UUID REFERENCES commercants(id) ON DELETE CASCADE,
    points_cumules INT DEFAULT 0,
    remise_dispo BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_pass_wallet, commercant_id)
);

-- 4. Créez la table de profil/coordonnées des clients
CREATE TABLE IF NOT EXISTS clients_saint_cyp (
    id_pass_wallet TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Insérer des commerçants de test dans Supabase pour s'y connecter :
INSERT INTO commercants (id, nom_enseigne, identifiant, mot_de_passe_hash, seuil_remise_pts)
VALUES 
('a3b1c2d3-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Boulangerie L''Épi d''Or', 'boulangerie_epi', 'cyp', 50),
('b4c2d3e4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Boucherie Catalane', 'boucherie_cat', 'cyp', 100),
('c5d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', 'Café de l''Ancre', 'cafe_ancre', 'cyp', 40)
ON CONFLICT (identifiant) DO NOTHING;

-- 6. Activez RLS ou configurez les politiques de sécurité appropriées
ALTER TABLE commercants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cagnottes_saint_cyp ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_saint_cyp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on commercants" ON commercants FOR SELECT USING (true);
CREATE POLICY "Allow public all on cagnottes" ON cagnottes_saint_cyp FOR ALL USING (true);
CREATE POLICY "Allow public select on cagnottes" ON cagnottes_saint_cyp FOR SELECT USING (true);
CREATE POLICY "Allow public all on clients" ON clients_saint_cyp FOR ALL USING (true);
`;
