/// <reference types="node" />
/**
 * 추출 파이프라인 수동 실행 스크립트
 *
 *   npx tsx -r dotenv/config src/pipeline/runextract.ts
 *
 * 키 없이 흐름만 볼 때는 아래 CALLER를 mockLLM으로 바꾼다.
 *
 * 입력: src/pipeline/fixtures/july-diary.json
 * 출력: src/pipeline/fixtures/july-signals.json  ← 사람 3이 이 파일을 쓰면 됨
 */

import * as fs from 'fs';
import * as path from 'path';
import { preprocess, DiaryEntry } from './preprocess';
import { extract } from './extract';
import { callSolar, mockLLM } from './llm';

const CALLER = callSolar; // 키 없으면 mockLLM

const FIXTURES = path.join(__dirname, 'fixtures');
const INPUT = path.join(FIXTURES, 'july-diary.json');
const OUTPUT = path.join(FIXTURES, 'july-signals.json');

function loadEntries(): DiaryEntry[] {
    if (!fs.existsSync(INPUT)) {
        console.error(`일기 파일이 없습니다: ${INPUT}`);
        console.error('july-diary.json을 src/pipeline/fixtures/ 에 넣어주세요.');
        process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
    if (!Array.isArray(raw)) {
        console.error('JSON 최상위가 배열이 아닙니다.');
        process.exit(1);
    }
    // 앱 쪽 DiaryEntry는 body 필드를 쓰므로 둘 다 받아준다
    return raw.map((e: { date: string; text?: string; body?: string }) => ({
        date: e.date,
        text: e.text ?? e.body ?? '',
    }));
}

async function main() {
    const entries = loadEntries();
    console.log(
        `일기 ${entries.length}편 (${entries[0].date} ~ ${entries[entries.length - 1].date})`
    );

    console.log('\n─── ① 전처리 ───');
    const sentences = preprocess(entries);
    console.log(`문장 ${sentences.length}개로 분해됨\n`);
    for (const s of sentences) {
        console.log(`  ${s.date} [${s.index}] ${s.text}`);
    }

    console.log('\n─── ③ 추출 ───');
    const signals = await extract(entries, CALLER);

    console.log('\n─── 결과 ───');
    if (signals.length === 0) {
        console.log('  (뽑힌 신호 없음)');
    }
    for (const sig of signals) {
        console.log(`\n  [${sig.category}] ${sig.date}`);
        console.log(`    "${sig.quote}"`);
        if (sig.context) console.log(`    맥락: ${sig.context.slice(0, 70)}…`);
    }

    fs.writeFileSync(OUTPUT, JSON.stringify(signals, null, 2), 'utf-8');
    console.log(`\n저장 완료 → ${OUTPUT}`);
    console.log('사람 3에게 이 파일을 넘기면 됩니다.');
}

main().catch((e: Error) => {
    console.error('실패:', e.message);
    process.exit(1);
});