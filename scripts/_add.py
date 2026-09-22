# 임시 도우미: JSON 배열 파일을 rumors.json(또는 지정 파일)에 append (id 중복 시 교체)
import json, sys, io
target = sys.argv[2] if len(sys.argv) > 2 else 'src/content/rumors.json'
cur = json.load(io.open(target, encoding='utf-8'))
new = json.load(io.open(sys.argv[1], encoding='utf-8'))
byid = {c['id']: c for c in cur}
for c in new: byid[c['id']] = c
out = sorted(byid.values(), key=lambda c: c['id'])
io.open(target, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(len(out), 'cases in', target)
