"""Experiment 4 — matched-qualifier controls. H12, H12b, H13.

Does the elevated clean-arm verification reflect the *content* of a
consequential negative, or just the presence of a longer qualified sentence?
"""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from stats import cmh, fisher, pct

MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]
SHORT = {m: m.replace("claude-","").replace("gpt-5.6-","") for m in MODELS}
ARMS = ["drifted","clean-positive","clean-neutral","clean-negative"]
DESC = {"drifted":"no qualifier (129ch)","clean-positive":"positive elaboration (220ch)",
        "clean-neutral":"confidence-weakening note (221ch)","clean-negative":"true caveat (221ch)"}

E = [json.load(open(f)) for f in glob.glob("workshop/runs/exp4-v1/**/*.json", recursive=True)]
print(f"episodes: {len(E)} / 600" + ("  (PARTIAL)" if len(E) < 600 else ""))
cell = lambda r: (sum(1 for e in r if e["scores"]["verified_73"]), len(r))

print("\nVerification of memory_73, first pass, budget 2")
print(f"  {'model':<10}" + "".join(f"{a:>26}" for a in ARMS))
for m in MODELS:
    print(f"  {SHORT[m]:<10}" + "".join(f"{pct(*cell([e for e in E if e['model']==m and e['arm']==a])):>26}" for a in ARMS))
print(f"  {'pooled':<10}" + "".join(f"{pct(*cell([e for e in E if e['arm']==a])):>26}" for a in ARMS))
print()
for a in ARMS: print(f"    {a:<16} {DESC[a]}")

def contrast(a1, a2, label, hyp):
    st = []
    for m in MODELS:
        k1,n1 = cell([e for e in E if e["model"]==m and e["arm"]==a1])
        k2,n2 = cell([e for e in E if e["model"]==m and e["arm"]==a2])
        if n1 and n2: st.append((k1,n1,k2,n2))
    k1,n1 = cell([e for e in E if e["arm"]==a1]); k2,n2 = cell([e for e in E if e["arm"]==a2])
    if not (n1 and n2): return
    p = cmh(st)
    print(f"\n{hyp} {label}")
    print(f"    {a1} {k1}/{n1} vs {a2} {k2}/{n2}"
          f"    CMH p = {p:.3g}" if p else "")
    print(f"    difference = {100*(k1/n1 - k2/n2):+.0f} pp   pooled Fisher p = {fisher(k1,n1-k1,k2,n2-k2):.3g}")

contrast("clean-neutral","clean-negative","— does a confidence-weakening note match the true caveat?","H12 ")
contrast("clean-positive","clean-negative","— does a positive elaboration match the true caveat?","H12b")
contrast("clean-neutral","drifted","— does a confidence-weakening note differ from no qualifier?","H13 ")
contrast("clean-positive","drifted","— does a positive elaboration differ from no qualifier?","(x) ")

print("\nIntent composition (guards against arms differing by what models plan to do)")
for a in ARMS:
    r = [e for e in E if e["arm"]==a]
    if r: print(f"  {a:<16} pricing-intent {sum(1 for e in r if e['scores']['intent_is_pricing'])}/{len(r)}")
