import { spawnSync } from 'node:child_process'

// verify-cases.mjs가 실제로 오류를 잡는지 — 통과만 확인하면 빈 파일에도 통과하므로 반드시 실패 픽스처를 돌린다.
function run(...args: string[]) {
  const r = spawnSync('node', ['scripts/verify-cases.mjs', ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout + r.stderr }
}

describe('verify-cases.mjs', () => {
  it('현재 콘텐츠는 통과', () => {
    const r = run()
    expect(r.out).toContain('✓ verify-cases 통과')
    expect(r.code).toBe(0)
  })

  it('깨진 픽스처는 각 규칙별로 실패', () => {
    const r = run('scripts/fixtures/bad-rumors.json', 'scripts/fixtures/bad-testimonies.json')
    expect(r.code).toBe(1)
    for (const msg of [
      '중복 id',
      '없는 사건철 IV',
      'difficulty 5',
      'verdict maybe',
      'unknown book in "창 1:1"',
      'no verse mat 28:99',
      'evidence 마 27:64 가 scope 밖',
      'hintOrder 마 28:99 가 scope 밖',
      '인용 불일치: "이 문장은 본문에 없는 인용문이다"',
      'absent 판정은 evidence가 비어 있어야 함',
      '증언 카드는 본문과 완전 일치해야 함 (요 9:9)',
      'ref 요 10:1 가 scope 밖',
      '없는 카드 nope',
      'card c4: 어떤 질문에도 쓰이지 않음',
      '해금 조건 8 > I의 사건 수',
    ]) expect(r.out).toContain(msg)
    // 정상 카드는 통과해야 한다 (c1은 요 9:9와 완전 일치)
    expect(r.out).not.toContain('card c1:')
  })
})
