import { err, ok, type Result } from "./result";

export interface LabelColorScheme {
  backgroundHex: string;
  textHex: string;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

const BACKGROUND_LIGHTNESS = 0.94;
const TEXT_LIGHTNESS = 0.25;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h / 6, s, l];
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToHex(h: number, s: number, l: number): string {
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgbChannel(p, q, h + 1 / 3);
    g = hueToRgbChannel(p, q, h);
    b = hueToRgbChannel(p, q, h - 1 / 3);
  }
  const toByte = (c: number) => Math.round(c * 255);
  return (
    "#" + [toByte(r), toByte(g), toByte(b)].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

export function deriveLabelColorScheme(colorHex: string): Result<LabelColorScheme, "invalid-hex"> {
  if (!HEX_PATTERN.test(colorHex)) return err("invalid-hex");

  const [r, g, b] = hexToRgb(colorHex);
  const [h, s] = rgbToHsl(r, g, b);

  return ok({
    backgroundHex: hslToHex(h, s, BACKGROUND_LIGHTNESS),
    textHex: hslToHex(h, s, TEXT_LIGHTNESS),
  });
}
