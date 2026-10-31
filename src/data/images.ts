import type { TownId } from '../types/game';

const TOWN_IMAGES: Record<TownId, string> = {
  valley_farm: '/images/towns/valley_farm.jpg',
  mountain_forge: '/images/towns/mountain_forge.jpg',
  desert_bazaar: '/images/towns/desert_bazaar.jpg',
  deepwood_camp: '/images/towns/deepwood_camp.jpg',
  capital_city: '/images/towns/capital_city.jpg',
};

export function getTownImage(townId: TownId): string {
  return TOWN_IMAGES[townId] ?? '';
}

