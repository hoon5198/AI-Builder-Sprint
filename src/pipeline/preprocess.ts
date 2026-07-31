/**
 * ① 전처리 — 일기 원문을 날짜별·문장별로 분해
 *
 * 실데이터 검증 결과 마침표 기준 분해는 쓸 수 없었다.
 * 한국어 일기는 마침표를 거의 안 쓰고, `!!!!!` `……` `ㅎㅎ` `ㅠㅜ` 로 문장을 끝낸다.
 * 또 공백만으로는 문장 경계를 판단할 수 없다
 * (예: "안본지 꽤 돼서" → '지'를 어미로 보면 "안본지"가 문장이 되어버린다)
 *
 * 그래서 아래 세 가지만 문장 끝으로 인정한다.
 *   1. 종결어미 + 감탄부호/ㅋㅎㅠ  (놀았다ㅎㅎ / 맡았다!!!!!!)
 *   2. 감탄부호 반복의 마지막 글자  (짐!!!!! / 하………)
 *   3. 줄바꿈
 *
 * 과분해보다 미분해가 안전하다. 인용 문장이 조금 길어지는 건 괜찮지만,
 * 문장이 잘못 잘리면 ⑤ 검증 단계의 문자열 대조가 깨진다.
 */

export interface DiaryEntry {
    date: string; // YYYY-MM-DD
    text: string;
}

export interface Sentence {
    date: string;
    text: string;   // 원문 그대로. 한 글자도 수정하지 않는다
    index: number;  // 그 날 일기 안에서의 순서 (0부터)
}

/** 구어체 일기에서 실제로 관찰되는 종결어미 */
const ENDINGS = [
    '다', '까', '요', '네', '음', '함', '임', '군',
    '어', '야', '해', '래', '냐', '죠', '지', '거',
    '걸', '워', '아', '데', '고', '든',
];

/** 종결어미 뒤에 붙어 다니는 꼬리 — 문장에 포함시켜 함께 자른다 */
const TAIL = /^[ㅋㅎㅠㅜㅡ]*[!?.…~♥♡\s]*/;

/** 문장 끝 판정 */
function isEnding(s: string, i: number): boolean {
    const ch = s[i];
    const next = s[i + 1];

    // 규칙 2 — 감탄부호 반복 구간의 마지막 글자
    if (/[!?…]/.test(ch)) {
        return next === undefined || !/[!?….]/.test(next);
    }

    // 규칙 1 — 종결어미 + 감탄부호/ㅋㅎㅠ
    if (!ENDINGS.includes(ch)) return false;
    if (next === undefined) return true;
    return /[!?.…~ㅋㅎㅠㅜㅡ♥♡]/.test(next);
}

/** 일기 한 편을 문장 배열로 분해 */
export function splitSentences(date: string, text: string): Sentence[] {
    const out: Sentence[] = [];

    function push(raw: string) {
        const t = raw.trim();
        if (!t) return;
        // 너무 짧은 조각은 앞 문장에 흡수 (분해 실패 보정)
        if (t.length < 4) {
            if (out.length) out[out.length - 1].text += ' ' + t;
            return;
        }
        out.push({ date, text: t, index: out.length });
    }

    // 규칙 3 — 줄바꿈은 무조건 문장 경계
    for (const line of text.split(/\r?\n+/)) {
        const tr = line.trim();
        if (!tr) continue;

        let buf = '';
        let i = 0;
        while (i < tr.length) {
            buf += tr[i];
            if (isEnding(tr, i)) {
                const tail = tr.slice(i + 1).match(TAIL);
                if (tail && tail[0]) {
                    buf += tail[0];
                    i += tail[0].length;
                }
                push(buf);
                buf = '';
            }
            i++;
        }
        push(buf);
    }

    return out;
}

/** 여러 편의 일기를 날짜순으로 정렬해 한 번에 분해 */
export function preprocess(entries: DiaryEntry[]): Sentence[] {
    return entries
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .flatMap((e) => splitSentences(e.date, e.text));
}

/**
 * 특정 문장의 앞뒤 맥락을 문자열로 가져온다.
 * '말 안 한 노력' 판별에 필요하다 — 그 행동이 어려웠다는 근거는
 * 문장 자체가 아니라 주변 문장에 있다.
 */
export function getContext(
    sentences: Sentence[],
    target: Sentence,
    window = 2
): string {
    const sameDay = sentences.filter((s) => s.date === target.date);
    const from = Math.max(0, target.index - window);
    const to = Math.min(sameDay.length, target.index + window + 1);
    return sameDay.slice(from, to).map((s) => s.text).join(' ');
}

/**
 * 인용 문장이 원본에 실제로 존재하는지 확인.
 * ⑤ 검증(사람 3)에서 쓰지만, 추출 단계에서도 미리 걸러두면
 * LLM이 문장을 살짝 고쳐서 반환한 경우를 조기에 잡을 수 있다.
 */
export function existsInOriginal(quote: string, entries: DiaryEntry[]): boolean {
    return entries.some((e) => e.text.includes(quote.trim()));
}