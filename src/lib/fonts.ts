import { Inter, Cinzel, Cormorant_Garamond, DM_Sans, Playfair_Display, Lato, Unbounded } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', display: 'swap', weight: ['400', '600', '700'] });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', display: 'swap', weight: ['400', '600', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', weight: ['400', '600', '700'] });
const lato = Lato({ subsets: ['latin'], variable: '--font-lato', display: 'swap', weight: ['400', '700'] });
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded', display: 'swap', weight: ['400', '600', '700'] });

export type FontPairing = 'cinzel_inter' | 'cormorant_dmsans' | 'playfair_lato' | 'unbounded_inter';

export const ROOT_FONT_VARS = `${inter.variable} ${cinzel.variable}`;

export function pairingClassNames(p: FontPairing): string {
  switch (p) {
    case 'cormorant_dmsans': return `${cormorant.variable} ${dmSans.variable}`;
    case 'playfair_lato':    return `${playfair.variable} ${lato.variable}`;
    case 'unbounded_inter':  return `${unbounded.variable} ${inter.variable}`;
    case 'cinzel_inter':
    default:                 return `${cinzel.variable} ${inter.variable}`;
  }
}

export function pairingCssVars(p: FontPairing): { display: string; body: string } {
  switch (p) {
    case 'cormorant_dmsans': return { display: 'var(--font-cormorant)', body: 'var(--font-dm-sans)' };
    case 'playfair_lato':    return { display: 'var(--font-playfair)', body: 'var(--font-lato)' };
    case 'unbounded_inter':  return { display: 'var(--font-unbounded)', body: 'var(--font-inter)' };
    case 'cinzel_inter':
    default:                 return { display: 'var(--font-cinzel)', body: 'var(--font-inter)' };
  }
}

const VALID_PAIRINGS: FontPairing[] = ['cinzel_inter', 'cormorant_dmsans', 'playfair_lato', 'unbounded_inter'];

export function isFontPairing(s: string | null | undefined): s is FontPairing {
  return !!s && (VALID_PAIRINGS as string[]).includes(s);
}
