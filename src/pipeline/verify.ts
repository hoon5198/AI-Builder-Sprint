import { DiaryEntry, LetterParagraph, LetterSegment } from '../types';

export async function verifyLetter(
  paragraphs: LetterParagraph[],
  getEntryByDate: (date: string) => Promise<DiaryEntry | null>
): Promise<{ paragraphs: LetterParagraph[]; removedCount: number }> {
  let removedCount = 0;
  const verifiedParagraphs: LetterParagraph[] = [];

  for (const para of paragraphs) {
    let paragraphIsValid = true;

    for (const seg of para.segments) {
      if (seg.type === 'quote') {
        const entry = await getEntryByDate(seg.date);
        const existsInDiary = entry?.body.includes(seg.content) ?? false;

        if (!existsInDiary) {
          paragraphIsValid = false;
          removedCount++;
          console.warn(`검증 실패로 문단 전체 제거: "${seg.content}" (${seg.date})`);
        }
      }
    }

    if (paragraphIsValid) {
      verifiedParagraphs.push(para);
    }
  }

  return { paragraphs: verifiedParagraphs, removedCount };
}