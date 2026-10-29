export type NamedItem = { name: string; slug?: string };
export type Game = {
  id: string;
  type?: string;
  name: string;
  description?: string;
  instructions?: string;
  image?: string;
  hash?: string;
  developer?: { slug?: string | null; public_name?: string | null } | null;
  modes?: NamedItem[];
  languages?: NamedItem[];
  controls?: NamedItem[];
  features?: NamedItem[];
  tags?: NamedItem[];
  categories?: NamedItem[];
  game_url?: string;
  site_url?: string;
};

