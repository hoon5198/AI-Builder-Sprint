/**
 * LLM 호출부 — Upstage Solar (OpenAI 호환 형식)
 *
 * 키는 .env에 넣는다:
 *   EXPO_PUBLIC_UPSTAGE_API_KEY=up_...
 *
 * ⚠️ EXPO_PUBLIC_ 접두사가 붙은 값은 앱 번들에 그대로 포함된다.
 *    해커톤 데모용으로는 괜찮지만, 실서비스라면 서버를 거쳐야 한다.
 */

const ENDPOINT = 'https://api.upstage.ai/v1/chat/completions';
const MODEL = 'solar-pro3';

export type LLMCaller = (system: string, user: string) => Promise<string>;

export class LLMError extends Error {
    constructor(message: string, readonly status?: number) {
        super(message);
        this.name = 'LLMError';
    }
}

/**
 * Solar 호출. 실패 시 한 번 재시도한다.
 */
export const callSolar: LLMCaller = async (system, user) => {
    const key = process.env.EXPO_PUBLIC_UPSTAGE_API_KEY;
    if (!key) {
        throw new LLMError('EXPO_PUBLIC_UPSTAGE_API_KEY가 없습니다. .env를 확인하세요.');
    }

    const body = JSON.stringify({
        model: MODEL,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
        // 추출은 창작이 아니라 선별이다. 낮을수록 원문을 덜 바꾼다.
        temperature: 0.1,
        // 이게 없으면 응답이 중간에 잘려서 JSON 파싱이 실패한다.
        max_tokens: 2000,
    });

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`,
                },
                body,
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                if (res.status < 500) {
                    throw new LLMError(`Solar ${res.status}: ${text.slice(0, 200)}`, res.status);
                }
                throw new LLMError(`Solar ${res.status} (재시도 대상)`, res.status);
            }

            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            if (typeof content !== 'string') {
                throw new LLMError('응답에 content가 없습니다: ' + JSON.stringify(data).slice(0, 200));
            }
            return content;
        } catch (e) {
            const isLast = attempt === 1;
            const noRetry = e instanceof LLMError && e.status !== undefined && e.status < 500;
            if (isLast || noRetry) throw e;
            await new Promise((r) => setTimeout(r, 800));
        }
    }

    throw new LLMError('도달 불가');
};

/**
 * 개발용 목 — 키 없이 파이프라인 흐름만 확인할 때 쓴다.
 */
export const mockLLM: LLMCaller = async (system) => {
    if (system.includes('쉽지 않았던')) {
        return '[{"date":"2026-07-12","quote":"동아리 면접 봤음.","reason":"앞 문장에 사람 만나는 게 부담이라는 서술이 있음"}]';
    }
    return '[{"date":"2026-07-15","quote":"메챠카멜레온 했다 이거 정말정말 재밌었다 레전드로 너무 웃기고 즐거웠다ㅠㅜ"}]';
};