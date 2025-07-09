import reshaper from 'arabic-persian-reshaper';

// Format Arabic segments without altering any Latin text. jsPDF renders
// characters in the order they appear, so we simply apply Arabic shaping to
// ensure proper glyph forms and leave the text direction untouched.
export function formatArabicText(text: string): string {
  return text.replace(/[\u0600-\u06FF]+/g, segment => {
    return reshaper.ArabicShaper.convertArabic(segment);
  });
}
