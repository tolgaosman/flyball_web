import clubsJson from '@/shared/clubs.json';
import competitionsJson from '@/shared/competitions.json';
import countriesJson from '@/shared/countries.json';

export interface Club {
  name: string;
  league: string;
  sportsDbName: string;
  aliases: string[];
}

export interface Country {
  name: string;
  iso2: string;
  nameTr: string;
}

export interface Competition {
  name: string;
  sportsDbLeagueId: number | null;
}

export const leagues: string[] = clubsJson.leagues;
export const clubs: Club[] = clubsJson.clubs;
export const clubNames: string[] = clubs.map((c) => c.name);
export const countries: Country[] = countriesJson.countries;
export const countryNames: string[] = countries.map((c) => c.name);

const clubIndex = new Map(clubs.map((c) => [c.name, c]));
const countryIndex = new Map(countries.map((c) => [c.name, c]));
const competitionIndex = new Map<string, Competition>(
  [...competitionsJson.leagues, ...competitionsJson.internationalTournaments].map((c) => [c.name, c]),
);

export const clubByName = (name: string) => clubIndex.get(name);
export const countryByName = (name: string) => countryIndex.get(name);
export const competitionByName = (name: string) => competitionIndex.get(name);

export function flagUrl(countryName: string, width = 160): string | null {
  const iso = countryIndex.get(countryName)?.iso2;
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null;
}

/** Country names are canonical English in the AI contract; show the Turkish form in tr. */
export function countryLabel(name: string, locale: string): string {
  return locale === 'tr' ? (countryIndex.get(name)?.nameTr ?? name) : name;
}
