// Génère les prochains créneaux de retrait du marché.
// Le marché de Saint-Cyprien ouvre Mardi, Jeudi, Samedi.

export interface MarketSlot {
  iso: string;
  label: string;
}

const MARKET_DAYS = [2, 4, 6]; // Tue, Thu, Sat (0 = Dimanche)
const PICKUP_HOUR = 10;
const PICKUP_MINUTE = 0;

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function getNextMarketSlots(count = 6, from: Date = new Date()): MarketSlot[] {
  const slots: MarketSlot[] = [];
  const cursor = new Date(from);
  cursor.setHours(PICKUP_HOUR, PICKUP_MINUTE, 0, 0);

  // If today is a market day and we're past pickup time, start tomorrow
  if (MARKET_DAYS.includes(from.getDay()) && from.getHours() >= 13) {
    cursor.setDate(cursor.getDate() + 1);
  }

  for (let i = 0; i < 60 && slots.length < count; i++) {
    if (MARKET_DAYS.includes(cursor.getDay())) {
      slots.push({
        iso: cursor.toISOString(),
        label: formatSlotLabel(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

function formatSlotLabel(date: Date): string {
  const jour = JOURS[date.getDay()];
  const numero = date.getDate();
  const mois = MOIS[date.getMonth()];
  return `${jour} ${numero} ${mois} · matin (8h - 13h)`;
}

export function formatSlotShort(iso: string): string {
  const date = new Date(iso);
  const jour = JOURS[date.getDay()];
  const numero = date.getDate();
  const mois = MOIS[date.getMonth()];
  return `${jour} ${numero} ${mois}`;
}
