/**
 * ③ 추출 — 편지에 넣을 "재료" 찾기
 *
 * 이 파일이 담당하는 신호 (LLM 사용):
 *   - unspoken_effort : 말 안 한 노력  ← 킬러 로직
 *   - good_day        : 좋았던 날·평범한 날
 *
 * repeated(반복된 감정) / faded(사라진 걱정)는 코드로 집계하는 신호이고
 * ② 태깅에 의존하므로 아직 미구현.
 *
 * ⚠️ 설계 원칙: LLM은 개수 제한·형식·톤을 잘 지키지 않는다.
 *    프롬프트로 부탁하되, 실제 강제는 전부 코드에서 한다.
 */

import { DiaryEntry, Sentence, preprocess, getContext } from './preprocess';

/**
 * TODO: 사람 3의 src/pipeline/types.ts가 main에 올라오면
 *       아래 정의를 지우고 `import { ExtractedSignal } from './types';`로 교체.
 */
export interface ExtractedSignal {
    category: 'repeated' | 'faded' | 'unspoken_effort' | 'good_day';
    quote: string;   // 원문 그대로, 한 글자도 수정 없음
    date: string;    // YYYY-MM-DD
    context?: string; // 편지 조립 때 참고용 힌트 (인용 자체는 quote를 쓴다)
}

export type LLMCaller = (system: string, user: string) => Promise<string>;

/** 코드로 강제하는 상한 */
const MAX_EFFORT = 3;
const MAX_GOOD_DAY = 4;
const EFFORT_MAX_LEN = 45;

/**
 * good_day에 들어오면 안 되는 표현.
 * plan.md §10 안전 설계 — 부정 감정 문장은 단독으로 인용하지 않는다.
 * LLM이 "좋았던 날"에 힘든 문장을 섞어 넣는 일이 실제로 있었다.
 */
const NEGATIVE_HINTS =
    /우울|짜증|힘들|멘탈|잃어버|못 찾|안 온다|잠이 안|새벽 (세|네|다섯)시|죽을뻔|눈물|싫다|막막|누워서|하는 것도 없이/;

// ─────────────────────────────────────────────
// 프롬프트
// ─────────────────────────────────────────────

const EFFORT_SYSTEM = `너는 일기에서 "본인은 대수롭지 않게 적었지만 실제로는 쉽지 않았던 일"을 찾아내는 역할이다.
문장을 새로 쓰지 않는다. 주어진 문장 중에서 고르기만 한다.

[무엇을 찾는가]
사람은 힘든 시기에 뭔가를 해내도 그걸 한 줄로 툭 적고 넘어간다.
자랑도 안 하고, 감탄도 안 하고, 그냥 사실만 적는다.
그런 문장을 찾는 것이다.

[좋은 예 — 이런 걸 찾아라]
✅ "아침에 좀 걸었다." — 앞뒤에 우울하다는 서술이 있으면, 이건 큰일이다
✅ "일단 자료 폴더만 만들어놨다" — 막막한 일을 어쨌든 시작한 것
✅ "두 장 봤다 뭐 시작은 시작이지" — 본인은 별거 아니라는 듯 적었지만 다시 시작한 것
✅ "보고서 초안 다 썼다" — 며칠 잠 못 잤다는 기록 뒤라면 의미가 다르다

[고르지 말 것]
❌ 감탄부호가 여러 개 붙어 신나 있는 문장 ("제출!!!!!!!!", "지갑 찾았다!!!!!!!!!")
   → 본인이 이미 기뻐한 일은 '말 안 한' 게 아니다
❌ 감정만 서술하고 행동이 없는 문장 ("너무 우울해", "기분이 좋았다")
❌ 놀거나 먹은 일 — 그건 좋았던 날이지 노력이 아니다

[판단 방법]
그 문장 자체만 보지 말고 **주변 날짜의 기록**을 함께 봐라.
앞뒤에 힘들다·막막하다·못 자겠다 같은 서술이 있는데
그 사이에 조용히 뭔가를 한 기록이 있으면 그게 답이다.

1~${MAX_EFFORT}개를 고른다. 한 달치 일기라면 보통 2~3개는 있다.

[출력 형식]
JSON 배열만. 설명·머리말·코드블록 금지.
[{"date":"YYYY-MM-DD","quote":"원문 그대로"}]

quote는 입력 문장을 한 글자도 바꾸지 않고 그대로 옮긴다.
여러 문장을 합치거나 줄바꿈으로 이어붙이지 마라. 반드시 한 문장씩 따로 넣는다.`;

const GOOD_DAY_SYSTEM = `너는 일기에서 "그 달의 좋았던 순간"을 골라내는 역할이다.
문장을 새로 쓰지 않는다. 주어진 문장 중에서 고르기만 한다.

[반드시 지킬 것]
1. 한 날짜에서는 **한 문장만** 고른다. 그 날을 가장 잘 보여주는 하나를 고른다.
2. **한 달 전체에 고루 퍼지게** 고른다. 초순·중순·하순에서 각각 골라라.
   앞쪽 날짜만 고르면 실패다.
3. 힘들었던 문장은 절대 고르지 않는다.
   ("우울해", "잠이 안 온다", "지갑을 잃어버렸다", "새벽 세시에 잠들었다" 같은 것)
   같은 날에 좋은 문장이 따로 있으면 그쪽을 골라라.

[우선순위 — 위쪽이 더 좋다]
1. 구체적인 장면·사물·행동이 담긴 문장
   ("좋았다"보다 "벤치에 고양이 두 마리 앉아있는 거 봄"이 좋다)
2. 함께 있었던 사람이나 장소가 나오는 문장
3. 본인이 들떠서 쓴 문장 (감탄부호가 많아도 좋다)

[출력 형식]
JSON 배열만. 설명·머리말·코드블록 금지.
[{"date":"YYYY-MM-DD","quote":"원문 그대로"}]

quote는 입력 문장을 한 글자도 바꾸지 않고 그대로 옮긴다.
이모티콘, 느낌표, 오타까지 전부 유지한다.
여러 문장을 합치거나 줄바꿈으로 이어붙이지 마라. 반드시 한 문장씩 따로 넣는다.`;

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

/**
 * 공백 차이를 무시하고 대조하기 위한 정규화.
 * LLM이 인용에 공백을 하나 더 넣거나 빼는 일이 흔해서,
 * 멀쩡한 인용이 통째로 버려지는 걸 막는다.
 */
function normalize(s: string): string {
    return s.replace(/\s+/g, '').trim();
}

function existsInOriginalLoose(quote: string, entries: DiaryEntry[]): boolean {
    const q = normalize(quote);
    if (!q) return false;
    return entries.some((e) => normalize(e.text).includes(q));
}

function buildUserInput(sentences: Sentence[]): string {
    const byDate = new Map<string, Sentence[]>();
    for (const s of sentences) {
        if (!byDate.has(s.date)) byDate.set(s.date, []);
        byDate.get(s.date)!.push(s);
    }
    return [...byDate.entries()]
        .map(([date, list]) => `[${date}]\n` + list.map((s) => `- ${s.text}`).join('\n'))
        .join('\n\n');
}

/**
 * LLM 응답에서 항목을 뽑는다.
 * 배열로 안 감싼 경우, 중간에 잘린 경우 모두 살려낸다.
 */
function parseJSON<T>(raw: string, label: string): T[] {
    const cleaned = raw.replace(/```json|```/g, '').trim();

    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end > start) {
        try {
            const parsed = JSON.parse(cleaned.slice(start, end + 1));
            if (Array.isArray(parsed) && parsed.length) return parsed;
        } catch {
            /* 아래로 */
        }
    }

    const objects = cleaned.match(/\{[^{}]*\}/g) ?? [];
    const salvaged: T[] = [];
    for (const o of objects) {
        try {
            salvaged.push(JSON.parse(o));
        } catch {
            /* 버림 */
        }
    }
    if (salvaged.length) return salvaged;

    console.warn(`  ⚠️ [${label}] 파싱 실패:`, cleaned.slice(0, 200));
    return [];
}

type RawItem = { date: string; quote: string };

/** LLM이 여러 문장을 줄바꿈으로 이어붙인 경우 첫 줄만 쓴다 */
function firstLineOnly(items: RawItem[]): RawItem[] {
    return items.map((it) => ({
        ...it,
        quote: (it.quote ?? '').split('\n')[0].replace(/^-\s*/, '').trim(),
    }));
}

/** 원본에 실제로 존재하는 인용만 남긴다 */
function keepOnlyReal(items: RawItem[], entries: DiaryEntry[]): RawItem[] {
    return items.filter((it) => {
        if (!it.quote) return false;
        const ok = existsInOriginalLoose(it.quote, entries);
        if (!ok) console.warn('  ⚠️ 원본에 없어서 제거:', it.quote.slice(0, 30));
        return ok;
    });
}

/** 같은 문장 중복 제거 */
function dedupe(items: RawItem[]): RawItem[] {
    const seen = new Set<string>();
    return items.filter((it) => {
        const k = normalize(it.quote);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

/** 한 날짜당 한 문장만 남긴다 */
function onePerDate(items: RawItem[]): RawItem[] {
    const seen = new Set<string>();
    return items.filter((it) => {
        if (seen.has(it.date)) return false;
        seen.add(it.date);
        return true;
    });
}

/**
 * 한 달 전체에 고루 퍼지게 고른다.
 * 그냥 앞에서 n개를 자르면 초순 날짜만 남아서 편지가 한 달을 담지 못한다.
 */
function spreadAcrossMonth(items: RawItem[], count: number): RawItem[] {
    if (items.length <= count) return items;
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const step = (sorted.length - 1) / (count - 1);
    const picked: RawItem[] = [];
    for (let i = 0; i < count; i++) {
        picked.push(sorted[Math.round(i * step)]);
    }
    return picked;
}

/** '말 안 한 노력'의 형식 조건 — 신나서 쓴 문장은 이 카테고리가 아니다 */
function isQuietSentence(quote: string): boolean {
    const t = quote.trim();
    if (t.length > EFFORT_MAX_LEN) {
        console.warn(`  ⚠️ 너무 길어서 제거(${t.length}자):`, t.slice(0, 25) + '…');
        return false;
    }
    if (/!{2,}/.test(t)) {
        console.warn('  ⚠️ 들떠 있어서 제거:', t.slice(0, 25));
        return false;
    }
    return true;
}

/** good_day에 부정적인 문장이 섞이는 것을 막는다 (안전 설계) */
function isPositiveSentence(quote: string): boolean {
    if (NEGATIVE_HINTS.test(quote)) {
        console.warn('  ⚠️ 힘든 문장이라 제외:', quote.slice(0, 30));
        return false;
    }
    return true;
}

/** LLM이 준 인용을 원본 문장으로 되돌린다 (공백·부호 훼손 방지) */
function toSignal(
    it: RawItem,
    sentences: Sentence[],
    category: ExtractedSignal['category'],
    withContext: boolean
): ExtractedSignal {
    const target = sentences.find((s) => normalize(s.text) === normalize(it.quote));
    return {
        category,
        quote: target ? target.text : it.quote,
        date: target ? target.date : it.date,
        ...(withContext && target ? { context: getContext(sentences, target) } : {}),
    };
}

// ─────────────────────────────────────────────
// 추출
// ─────────────────────────────────────────────

/** 말 안 한 노력 */
export async function extractUnspokenEffort(
    entries: DiaryEntry[],
    callLLM: LLMCaller
): Promise<ExtractedSignal[]> {
    const sentences = preprocess(entries);
    console.log('\n[말 안 한 노력]');
    const raw = await callLLM(EFFORT_SYSTEM, buildUserInput(sentences));
    const items = parseJSON<RawItem>(raw, 'effort');

    const kept = spreadAcrossMonth(
        onePerDate(
            dedupe(keepOnlyReal(firstLineOnly(items), entries)).filter((it) =>
                isQuietSentence(it.quote)
            )
        ),
        MAX_EFFORT
    );

    console.log(`  → LLM ${items.length}개 → 통과 ${kept.length}개`);
    return kept.map((it) => toSignal(it, sentences, 'unspoken_effort', true));
}

/** 좋았던 날 */
export async function extractGoodDays(
    entries: DiaryEntry[],
    callLLM: LLMCaller,
    exclude: string[] = []
): Promise<ExtractedSignal[]> {
    const sentences = preprocess(entries);
    console.log('\n[좋았던 날]');
    const raw = await callLLM(GOOD_DAY_SYSTEM, buildUserInput(sentences));
    const items = parseJSON<RawItem>(raw, 'good_day');

    const excludedDates = new Set(exclude);
    const kept = spreadAcrossMonth(
        onePerDate(
            dedupe(keepOnlyReal(firstLineOnly(items), entries))
                .filter((it) => isPositiveSentence(it.quote))
                // effort로 이미 쓴 날짜는 건너뛴다 (편지에 같은 날이 두 번 나오면 어색)
                .filter((it) => !excludedDates.has(it.date))
        ),
        MAX_GOOD_DAY
    );

    console.log(`  → LLM ${items.length}개 → 통과 ${kept.length}개`);
    return kept.map((it) => toSignal(it, sentences, 'good_day', false));
}

/**
 * ③ 전체 — 사람 3에게 넘길 최종 배열
 */
export async function extract(
    entries: DiaryEntry[],
    callLLM: LLMCaller
): Promise<ExtractedSignal[]> {
    const effort = await extractUnspokenEffort(entries, callLLM);
    const good = await extractGoodDays(
        entries,
        callLLM,
        effort.map((e) => e.date)
    );
    return [...effort, ...good].sort((a, b) => a.date.localeCompare(b.date));
}