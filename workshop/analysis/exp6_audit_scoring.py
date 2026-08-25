"""
Hostile audit of the scoring layer. verified_target resolves a model's named
memory by substring, which could in principle attribute a credit to the wrong
memory. This checks that it never does.
"""
import json, glob, collections, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "..", "runs/exp6/*.json")) if "ERROR" not in f]
d = [r for r in rows if r["arm"] == "drifted"]
valid = {"reliability": [f"memory_b{i}" for i in range(1, 7)],
         "procurement": [f"memory_c{i}" for i in range(1, 7)]}
multi, zero, tot = collections.Counter(), collections.Counter(), 0
for r in d:
    for x in r["answer"]["verify_memory_ids"][:r.get("budget", 2)]:
        s = str(x).strip().lower(); tot += 1
        hits = [m for m in valid[r["world"]] if m.replace("memory_", "") in s]
        if len(hits) > 1: multi[f"{s[:30]} -> {','.join(hits)}"] += 1
        elif not hits: zero[f"{r['model']}: {s[:34]}"] += 1
print(f"credits examined            {tot}")
print(f"attributed to >1 memory     {sum(multi.values())}   <- must be 0")
print(f"resolving to no memory      {sum(zero.values())} ({sum(zero.values())/tot:.2%})")
for k, v in zero.most_common(6): print(f"    {v}x  {k}")
raise SystemExit(1 if multi else 0)
