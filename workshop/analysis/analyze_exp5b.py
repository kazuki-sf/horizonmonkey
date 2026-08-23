"""Exploratory: does intent-aligned allocation survive a realistically drifted
memory -- one that keeps the number and loses the prohibition?  Not H15."""
import json, glob, sys, os, collections
sys.path.insert(0, os.path.dirname(__file__))
from stats import cmh_str, fisher, pct

E = [json.load(open(f)) for f in glob.glob("workshop/runs/exp5b-v1/**/*.json", recursive=True)]
print(f"episodes: {len(E)} / 150" + ("  (PARTIAL)" if len(E) < 150 else ""))
if not E: sys.exit()
MOD = sorted({e["model"] for e in E})

al = [e for e in E if e["scores"]["intent_aligned"]]
mis = [e for e in E if not e["scores"]["intent_aligned"]]
v = lambda r: (sum(1 for e in r if e["scores"]["verified_73"]), len(r))
print(f"\nintent-aligned  (agent plans to price): {pct(*v(al))}")
print(f"intent-misaligned                      : {pct(*v(mis))}")
if al and mis:
    st = []
    for m in MOD:
        k1, n1 = v([e for e in al if e["model"] == m]); k2, n2 = v([e for e in mis if e["model"] == m])
        if n1 and n2: st.append((k1, n1, k2, n2))
    k1, n1 = v(al); k2, n2 = v(mis)
    print(f"  CMH {cmh_str(st) if st else 'n/a'}   pooled Fisher p = {fisher(k1,n1-k1,k2,n2-k2):.3g}")
    if k1 == n1: print(f"  -> complete separation again: {k1}/{n1}")

print("\nper model")
for m in MOD:
    r = [e for e in E if e["model"] == m]
    a2 = [e for e in r if e["scores"]["intent_aligned"]]
    print(f"  {m:<20} verified {pct(*v(r)):<22} pricing-intent {len(a2)}/{len(r)}")

print("\nfor comparison, the hand-constructed drift (Experiment 4, same protocol)")
C = [json.load(open(f)) for f in glob.glob("workshop/runs/exp4-v1/**/*.json", recursive=True)]
d = [e for e in C if e["arm"] == "drifted"]
print(f"  hand-drifted  verified {pct(*[sum(1 for e in d if e['scores']['verified_73']), len(d)])}"
      f"   pricing-intent {sum(1 for e in d if e['scores']['intent_is_pricing'])}/{len(d)}")
print(f"  naturally drifted verified {pct(*v(E))}   pricing-intent {len(al)}/{len(E)}")
print("\nbody lengths used:", sorted({e["natural_body_len"] for e in E}))
print("distinct source chains sampled:", len({e["natural_source"] for e in E}))
