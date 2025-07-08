import reshaper from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

export function formatArabicText(text: string): string {
  const shaped = reshaper.ArabicShaper.convertArabic(text);
  const embedding = bidi.getEmbeddingLevels(shaped);
  return bidi.getReorderedString(shaped, embedding);
}
