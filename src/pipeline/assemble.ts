// src/pipeline/assemble.ts
import { ExtractedSignal } from './types';
import { LetterParagraph, LetterSegment } from '../types';

const UPSTAGE_API_KEY = process.env.EXPO_PUBLIC_UPSTAGE_API_KEY;

const SYSTEM_PROMPT = `당신은 지난달의 "나"가 되어 다음 달의 나에게 편지를 씁니다.
이 편지는 AI가 분석해서 알려주는 리포트가 아니라, 그 사람이 직접 쓴 편지처럼 읽혀야 합니다.

# 형식
- 반말. 존댓말 절대 금지
- 인사로 시작 → 회상 → 다음 달의 나에게 한마디로 끝
- 문단은 3~6개, 자연스럽게 이어지는 글

# 절대 쓰면 안 되는 표현
- 평가·칭찬: 대단하다, 훌륭하다, 잘했다, 자랑스럽다
- 조언·제안: ~해보자, ~하면 좋겠다, 다음 달엔 ~하길, ~하길 바라, ~하기를, ~기억해 두면, ~잊지 않았으면
- 집계 어투: N번 썼다, N일 중 N일, 빈도가 높다
- 진단·분석 어투: ~로 보인다, ~한 경향이 있다, 패턴이 나타난다
- 자기비판: 왜 이것밖에, 또, 여전히, 항상(부정 맥락)
- 마지막 문단 외에는 "~좋겠다", "~바란다" 계열 문장을 쓰지 마세요. 이런 문장은 편지 전체에서 마지막 한 번만 허용됩니다

# resolved 카테고리 특별 규칙
- resolved 카테고리 신호는 quote(해결된 순간의 문장)와 context(처음 걱정하던 문장)를 함께 받습니다
- 반드시 두 문장을 대비시켜서 쓰세요: 먼저 처음에 걱정했다는 사실을 당신의 말로 요약해서 언급하고, 그 다음 quote로 해결을 보여주세요
- context에 있는 문장을 그대로 인용하지 마세요. "~한 일로 며칠을 걱정했는데" 처럼 당신의 말로 요약만 하세요. 원문 그대로 옮기면 안 됩니다
- "해결됐다", "다행이다" 같은 감상은 담담하게, 절대 "잘됐다", "다행이야 정말" 같은 과한 감탄으로 쓰지 마세요

# 인용 규칙 (매우 중요, 반드시 지킬 것)
아래 신호 목록의 각 항목에는 고유 ID가 붙어 있습니다 (예: ID:07-06a). 그 신호를 인용할 자리에는
반드시 그 ID를 그대로 써서 **{{Q:ID}}** 형태로 표시하세요.
예: 신호의 ID가 07-06a라면, 그 자리엔 정확히 {{Q:07-06a}} 라고만 쓰세요.

- 절대로 quote 문장을 직접 타이핑하지 마세요. {{Q:ID}} 표시 하나로 대신합니다
- {{Q:ID}} 앞뒤에 그 인용의 원문 단어를 다시 쓰지 마세요
- "적지 않았다", "말하지 않았다", "기록에 남지 않았다" 같이 인용의 존재를 부정하는 서술 금지 — 전부 실제로 그 사람이 쓴 문장입니다
- ID는 신호 목록에 적힌 그대로 정확히 복사해서 쓰세요. 같은 날짜라도 ID가 다르면(예: 07-06a와 07-06b) 완전히 다른 신호이니 절대 헷갈리지 마세요 — 반드시 그 신호의 내용과 어울리는 문장에 맞는 ID를 쓰세요
- 출력하기 직전에 신호 목록의 ID를 하나씩 확인하며, 각 ID가 편지 안에 정확히 한 번씩 있는지, 그리고 그 ID가 등장하는 문단의 내용이 그 신호의 quote 내용과 실제로 어울리는지 스스로 검토하세요

# 인용 연결 방식
- 한 문장에 인용을 2개 이상 억지로 이어붙이지 마세요
- {{Q:ID}} 뒤에 조사·어미를 붙일 땐 자연스럽게 이어지는지 확인하고, 안 이어지면 "~라고 적어놨더라" 처럼 연결 표현을 쓰세요
- "말 안 한 노력" 카테고리 인용은 다른 인용과 한 문장에 섞지 말고 독립된 문단으로 다루세요

# 출력 형식
반드시 JSON만 출력하세요. 다른 텍스트, 설명, 코드블록 표시 없이 순수 JSON만.
{
  "paragraphs": ["문단1 텍스트, {{Q:07-06a}} 표시 포함 가능", "문단2 텍스트..."]
}`;

interface SignalWithId {
  id: string;
  signal: ExtractedSignal;
}

function assignSignalIds(signals: ExtractedSignal[]): SignalWithId[] {
  const dateCounts: Record<string, number> = {};
  return signals.map((signal) => {
    const shortDate = signal.date.slice(5); // 'MM-DD'
    const idx = dateCounts[signal.date] ?? 0;
    dateCounts[signal.date] = idx + 1;
    const suffix = String.fromCharCode(97 + idx); // a, b, c...
    return { id: `${shortDate}${suffix}`, signal };
  });
}

function buildUserPrompt(signalsWithId: SignalWithId[], monthLabel: string): string {
  const categoryLabel: Record<string, string> = {
    repeated: '반복해서 나온 감정',
    faded: '전반부엔 있었는데 후반부에 그냥 사라진 얘기 (해결됐다는 언급 없이 그냥 안 씀)',
    resolved: '전반부에 걱정하던 게 후반부에 실제로 해결되는 문장이 있는 경우',
    good_day: '좋았던 날, 웃겼던 날, 별거 없던 평범한 날 (힘든 얘기만 나열되지 않게 균형을 맞추는 용도)',
    unspoken_effort: '실제로 일기에 적혀 있는, 담담하게 쓴 노력·성취 (이 사람이 대수롭지 않게 여겼을 뿐, 분명히 일기에 쓴 문장임)',
  };
  const signalList = signalsWithId
    .map(({ id, signal }) => {
      const contextNote = signal.context ? ` [참고 맥락: "${signal.context}"]` : '';
      return `ID:${id} [${categoryLabel[signal.category] ?? signal.category}] (${signal.date}): "${signal.quote}"${contextNote}`;
    })
    .join('\n');
  return `${monthLabel}의 신호 목록:\n${signalList}\n\n이 신호들로 편지를 조립해줘. 인용 자리엔 반드시 {{Q:ID}} 형태로, 위에 적힌 ID 그대로 써줘. 반드시 JSON으로만 답해줘.`;
}

function stripDuplicatedQuoteText(segments: LetterSegment[]): LetterSegment[] {
  const result: LetterSegment[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type !== 'quote') {
      result.push({ ...seg });
      continue;
    }
    const prev = result[result.length - 1];
    if (prev && prev.type === 'text') {
      const trimmed = prev.content.trimEnd();
      if (trimmed.endsWith(seg.content)) {
        prev.content = trimmed.slice(0, trimmed.length - seg.content.length);
      }
    }
    result.push({ ...seg });
    const next = segments[i + 1];
    if (next && next.type === 'text') {
      const trimmed = next.content.trimStart();
      if (trimmed.startsWith(seg.content)) {
        segments[i + 1] = { ...next, content: trimmed.slice(seg.content.length) };
      }
    }
  }
  return result;
}

function parseParagraph(text: string, signalsWithId: SignalWithId[]): LetterSegment[] {
  const segments: LetterSegment[] = [];
  const regex = /\{\{Q:([\w-]+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const id = match[1];
    const found = signalsWithId.find((s) => s.id === id);
    if (found) {
      segments.push({ type: 'quote', content: found.signal.quote, date: found.signal.date });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments;
}

export async function assembleLetter(
  signals: ExtractedSignal[],
  monthLabel: string,
  attempt: number = 1
): Promise<{ paragraphs: LetterParagraph[]; signature: string }> {
  console.log(`[assembleLetter 시작] attempt=${attempt}`);
  if (!UPSTAGE_API_KEY) {
    throw new Error('EXPO_PUBLIC_UPSTAGE_API_KEY가 .env에 설정되어 있지 않습니다.');
  }

  const signalsWithId = assignSignalIds(signals);

  const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${UPSTAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'solar-pro3',
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(signalsWithId, monthLabel) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Upstage API 호출 실패: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content ?? '';
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const parsed: { paragraphs: string[] } = JSON.parse(cleaned);

  console.log(`--- 시도 ${attempt} 원본 응답 ---`);
  console.log(rawText);
  console.log('---');

  const monthNumber = monthLabel.match(/(\d+)월/)?.[1];
  const signature = monthNumber ? `— ${monthNumber}월의 나로부터` : '— 지난달의 나로부터';

  const paragraphs = parsed.paragraphs.map((text) => ({
    segments: stripDuplicatedQuoteText(parseParagraph(text, signalsWithId)),
  }));

  // 검증 1: 모든 신호(quote)가 정확히 한 번씩 편지에 등장하는가 (고유 ID 매칭이라 순서 혼동 문제 자체가 사라짐)
  const usedQuotes = paragraphs.flatMap((p) =>
    p.segments.filter((s) => s.type === 'quote').map((s) => s.content)
  );
  const missingQuotes = signals.filter((s) => !usedQuotes.includes(s.quote)).map((s) => s.quote);
  const extraQuoteCount = usedQuotes.length !== signals.length;

  // 검증 2: 원문이 표시 앞뒤에 중복으로 남아있는가
  const hasDuplicatedQuoteText = paragraphs.some((p) =>
    p.segments.some(
      (seg) => seg.type === 'text' && signals.some((s) => seg.content.includes(s.quote))
    )
  );

  // 검증 3: 문단끼리 이어주는 텍스트가 통째로 똑같은가
  const paragraphTexts = paragraphs.map((p) =>
    p.segments
      .filter((s) => s.type === 'text')
      .map((s) => s.content)
      .join('')
      .trim()
  );
  const hasDuplicatedParagraphText = paragraphTexts.some(
    (text, i) => text.length > 5 && paragraphTexts.indexOf(text) !== i
  );

  // 검증 4: 마지막 문단 외에 조언성 표현이 있는가
  const bannedPhrases = ['하면 좋겠다', '좋았으면', '잊지 않았으면', '기억해 두면', '해보자'];
  const paragraphFullTexts = paragraphs.map((p) => p.segments.map((s) => s.content).join(''));
  const hasBannedPhraseOutsideLastParagraph = paragraphFullTexts
    .slice(0, -1)
    .some((text) => bannedPhrases.some((phrase) => text.includes(phrase)));

  const isValid =
    missingQuotes.length === 0 &&
    !extraQuoteCount &&
    !hasDuplicatedQuoteText &&
    !hasDuplicatedParagraphText &&
    !hasBannedPhraseOutsideLastParagraph;

  if (!isValid) {
    if (attempt >= 8) {
      throw new Error(
        `조립 검증 실패 (누락된 인용: ${missingQuotes.join(' / ') || '없음'}, 개수불일치: ${extraQuoteCount}, 중복텍스트: ${hasDuplicatedQuoteText}, 문단중복: ${hasDuplicatedParagraphText}, 금지표현: ${hasBannedPhraseOutsideLastParagraph}). 8번 시도 후 실패.`
      );
    }
    console.warn(
      `검증 실패 감지 (누락된 인용: ${missingQuotes.length}개, 개수불일치: ${extraQuoteCount}, 중복텍스트: ${hasDuplicatedQuoteText}, 문단중복: ${hasDuplicatedParagraphText}, 금지표현: ${hasBannedPhraseOutsideLastParagraph}) — 재시도 ${attempt + 1}번째`
    );
    return assembleLetter(signals, monthLabel, attempt + 1);
  }

  return { paragraphs, signature };
}