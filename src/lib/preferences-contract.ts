export type Voice = "editorial" | "notebook" | "studio";
export type Imagery = "photographic" | "filmic" | "mono";
export type Paper = "smooth" | "linen" | "newsprint";
export type Palette = "paper" | "bone & sage" | "ink" | "terra wash";

export interface Preferences {
  voice: Voice;
  imagery: Imagery;
  paper: Paper;
  palette: Palette;
}

export const DEFAULT_PREFERENCES: Preferences = {
  voice: "editorial",
  imagery: "photographic",
  paper: "smooth",
  palette: "paper",
};

export const VOICE_VALUES: readonly Voice[] = [
  "editorial",
  "notebook",
  "studio",
] as const;

export const IMAGERY_VALUES: readonly Imagery[] = [
  "photographic",
  "filmic",
  "mono",
] as const;

export const PAPER_VALUES: readonly Paper[] = [
  "smooth",
  "linen",
  "newsprint",
] as const;

export const PALETTE_VALUES: readonly Palette[] = [
  "paper",
  "bone & sage",
  "ink",
  "terra wash",
] as const;
