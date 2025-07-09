import reshaper from 'arabic-persian-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

// This utility was updated to better handle mixed Arabic and Latin text. When a
// string contains both Arabic and English words we only shape and reorder the
// Arabic portions, leaving any Latin characters untouched so their order does
// not change in the generated PDF.
export function formatArabicText(text: string): string {
  return text.replace(/[\u0600-\u06FF]+/g, segment => {
    const shaped = reshaper.ArabicShaper.convertArabic(segment);
    const embedding = bidi.getEmbeddingLevels(shaped, 'rtl');
    return bidi.getReorderedString(shaped, embedding);
  });
}
