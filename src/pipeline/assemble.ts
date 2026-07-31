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
- 조언·제안: ~해보자, ~하면 좋겠다, 다음 달엔 ~하길, ~하길 바라, ~하기를
- 집계 어투: N번 썼다, N일 중 N일, 빈도가 높다
- 진단·분석 어투: ~로 보인다, ~한 경향이 있다, 패턴이 나타난다
- 자기비판: 왜 이것밖에, 또, 여전히, 항상(부정 맥락)

# 좋은 예시 (형식과 톤만 참고. 이 예시의 문장이나 표현을 절대 그대로 가져다 쓰지 마세요)
아래는 톤과 구조를 보여주는 예시일 뿐, 이 안의 구체적인 내용(고양이, 벤치 등)은
지금 편지와 아무 상관없습니다. 절대 복사하지 마세요.

형식 예시:
"잘 지내고 있으려나.
[인용 하나를 자연스럽게 녹인 회상 한두 문장. 담담하게.]
[다른 인용을 녹인 회상. 앞 문단과 다른 화제.]
다음 달의 너는 이걸 잊고 있을 텐데, 그래도 한 번은 읽어줬으면 좋겠다."

마지막 문장이 조언이 아니라 담담한 바람으로 끝나는 구조만 참고하세요.

# 인용 규칙 (매우 중요, 반드시 지킬 것)
- 신호 목록에 있는 quote 문장을 절대로 당신의 말로 풀어쓰거나 바꿔 쓰지 마세요
- 그 문장이 들어갈 자리엔 반드시 {{Q1}}, {{Q2}}... 표시만 넣으세요. 절대로 원문을 직접 타이핑하지 마세요
- 신호 목록에 있는 항목은 전부 실제로 그 사람이 일기에 쓴 문장입니다. "적지 않았다", "말하지 않았다" 같은 표현을 절대 쓰지 마세요 — 전부 그 사람이 실제로 쓴 것들입니다
- 출력하기 전에 스스로 확인하세요: 신호가 3개면 {{Q1}}, {{Q2}}, {{Q3}}이 문단들 안에 정확히 한 번씩 다 들어가 있어야 합니다. 하나라도 빠지면 안 됩니다
- 인용된 문장은 그 사람이 실제로 일기에 적은 것입니다. "기록에 남지 않았다", "적어두지 않았다", "말하지 않았다" 같이 그 인용의 존재 자체를 부정하는 서술을 쓰지 마세요
- {{Q1}}, {{Q2}}... 표시 앞뒤에 그 인용 문장의 원문 단어를 다시 쓰지 마세요. 표시 하나로 그 인용 전체를 대신합니다. 예를 들어 "잠을 못 잤다{{Q1}}"처럼 쓰지 말고, 그냥 "{{Q1}}"만 쓰세요

# 인용 연결 방식
- 한 문장에 인용을 2개 이상 억지로 이어붙이지 마세요. 특히 서로 다른 신호(반복된 감정/사라진 걱정/말 안 한 노력)의 인용은 각자 다른 문단이나 다른 문장에서 다루세요
- 인용 문장 뒤에 조사·어미를 붙일 땐, 그 인용의 원래 문장 형태와 자연스럽게 이어지는지 먼저 확인하세요. 안 이어지면 "~라고 적어놨더라", "~라는 말을 봤어" 처럼 자연스러운 연결 표현을 쓰세요
- 특히 "말 안 한 노력" 카테고리 인용은 이 편지에서 가장 중요한 문장입니다. 다른 인용과 한 문장에 섞지 말고, 그 인용에만 집중하는 문단을 따로 주세요

# 출력 형식
반드시 JSON만 출력하세요. 다른 텍스트, 설명, 코드블록 표시(\`\`\`) 없이 순수 JSON만 출력합니다.
{
  "paragraphs": ["문단1 텍스트, {{Q1}} 표시 포함 가능", "문단2 텍스트..."]
}`;

function buildUserPrompt(signals: ExtractedSignal[], monthLabel: string): string {
  const categoryLabel: Record<string, string> = {
    repeated: '반복해서 나온 감정',
    faded: '전반부엔 있었는데 후반부에 사라진 얘기',
    good_day: '좋았던 날, 웃겼던 날, 별거 없던 평범한 날 (힘든 얘기만 나열되지 않게 균형을 맞추는 용도)',
    unspoken_effort: '실제로 일기에 적혀 있는, 담담하게 쓴 노력·성취 (이 사람이 대수롭지 않게 여겼을 뿐, 분명히 일기에 쓴 문장임)',
  };
  const signalList = signals
    .map((s, i) => `Q${i + 1} [${categoryLabel[s.category] ?? s.category}] (${s.date}): "${s.quote}"`)
    .join('\n');
  return `${monthLabel}의 신호 목록:\n${signalList}\n\n이 신호들로 편지를 조립해줘. 반드시 JSON으로만 답해줘.`;
}

function stripDuplicatedQuoteText(text: string, signals: ExtractedSignal[]): string {
  let result = text;
  signals.forEach((signal, i) => {
    const placeholder = `{{Q${i + 1}}}`;
    // "원문{{Q1}}" 패턴 제거 → "{{Q1}}"만 남김
    const beforePattern = new RegExp(
      signal.quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*' + placeholder.replace(/[{}]/g, '\\$&'),
      'g'
    );
    result = result.replace(beforePattern, placeholder);
  });
  return result;
}

function parseParagraph(text: string, signals: ExtractedSignal[]): LetterSegment[] {
  const segments: LetterSegment[] = [];
  const regex = /\{\{Q(\d+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const signalIndex = parseInt(match[1], 10) - 1;
    const signal = signals[signalIndex];
    if (signal) {
      segments.push({ type: 'quote', content: signal.quote, date: signal.date });
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
  if (!UPSTAGE_API_KEY) {
    throw new Error('EXPO_PUBLIC_UPSTAGE_API_KEY가 .env에 설정되어 있지 않습니다.');
  }

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
        { role: 'user', content: buildUserPrompt(signals, monthLabel) },
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

  const monthNumber = monthLabel.match(/(\d+)월/)?.[1];
  const signature = monthNumber ? `— ${monthNumber}월의 나로부터` : '— 지난달의 나로부터';

  const paragraphs = parsed.paragraphs.map((text) => ({
    segments: parseParagraph(stripDuplicatedQuoteText(text, signals), signals),
  }));

  console.log(`--- 시도 ${attempt} 원본 응답 ---`);
  console.log(rawText);
  console.log('---');

  // 검증: 인용이 신호 개수만큼 정확히 들어갔는지 확인 (순수 코드)

  // 검증: 인용이 신호 개수만큼 정확히 들어갔는지 확인 (순수 코드)
  const quoteCount = paragraphs
    .flatMap((p) => p.segments)
    .filter((s) => s.type === 'quote').length;

  const hasDuplicatedQuoteText = paragraphs.some((p) =>
    p.segments.some(
      (seg) => seg.type === 'text' && signals.some((s) => seg.content.includes(s.quote))
    )
  );

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

  if (quoteCount !== signals.length || hasDuplicatedQuoteText) {
    if (attempt >= 3) {
      throw new Error(
        `조립 검증 실패 (인용 개수: 기대 ${signals.length}/실제 ${quoteCount}, 중복 텍스트 있음: ${hasDuplicatedQuoteText}). 3번 시도 후 실패.`
      );
    }
    console.warn(
      `검증 실패 감지 (인용 개수 ${quoteCount}/${signals.length}, 중복 텍스트: ${hasDuplicatedQuoteText}) — 재시도 ${attempt + 1}번째`
    );
    return assembleLetter(signals, monthLabel, attempt + 1);
  }

  return { paragraphs, signature };
}