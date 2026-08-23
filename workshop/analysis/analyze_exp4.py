"""Experiment 4 — matched-qualifier controls. H12, H12b, H13.

The four arms turn out to differ in first-pass INTENT (the positive elaboration
makes pricing more attractive; the true caveat removes it entirely). Intent is
the dominant driver of verification, so the marginal contrast is confounded and
the intent-misaligned stratum is the contrast that isolates the qualifier.
"""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from stats import cmh, cmh_str, cmh_chi2, fisher, pct

MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]
SHORT = {m: m.replace("claude-","").replace("gpt-5.6-","") for m in MODELS}
ARMS = ["clean-negative","drifted","clean-neutral","clean-positive"]
DESC = {"drifted":"no qualifier (129ch)","clean-positive":"positive elaboration (220ch)",
        "clean-neutral":"confidence-weakening note (221ch)","clean-negative":"true caveat (221ch)"}

E = [json.load(open(f)) for f in glob.glob("workshop/runs/exp4-v1/**/*.json", recursive=True)]
print(f"episodes: {len(E)} / 600" + ("  (PARTIAL)" if len(E) < 600 else ""))
v = lambda r: (sum(1 for e in r if e["scores"]["verified_73"]), len(r))

print("\n### The arms are not intent-matched — this is why the marginal contrast fails")
print(f"  {'arm':<18}{'pricing intent':>16}{'verification (all)':>22}")
for a in ARMS:
    r = [e for e in E if e["arm"]==a]
    pi = sum(1 for e in r if e["scores"]["intent_is_pricing"])
    print(f"  {a:<18}{f'{pi}/{len(r)}':>16}{pct(*v(r)):>22}")
print("  Appending a positive elaboration makes pricing more attractive; the true")
print("  caveat removes it. Intent alignment is the dominant driver of verification")
print("  (236/236 in Study 1), so the marginal comparison is confounded by it.")

print("\n### Restricted to intent-MISALIGNED episodes (agent does not plan to price)")
print(f"  {'model':<10}" + "".join(f"{a:>22}" for a in ARMS))
mis = lambda a, m=None: [e for e in E if e["arm"]==a and not e["scores"]["intent_is_pricing"] and (m is None or e["model"]==m)]
for m in MODELS:
    print(f"  {SHORT[m]:<10}" + "".join(f"{pct(*v(mis(a,m))):>22}" for a in ARMS))
print(f"  {'pooled':<10}" + "".join(f"{pct(*v(mis(a))):>22}" for a in ARMS))
print()
for a in ARMS: print(f"    {a:<16} {DESC[a]}")

def contrast(a1, a2, hyp, note):
    st = []
    for m in MODELS:
        k1,n1 = v(mis(a1,m)); k2,n2 = v(mis(a2,m))
        if n1 and n2: st.append((k1,n1,k2,n2))
    k1,n1 = v(mis(a1)); k2,n2 = v(mis(a2))
    if not (n1 and n2): return
    print(f"\n{hyp}  {a1} {k1}/{n1} vs {a2} {k2}/{n2}   {note}")
    print(f"      difference = {100*(k1/n1 - k2/n2):+.0f} pp")
    print(f"      CMH stratified by model: {cmh_str(st)}")
    print(f"      pooled Fisher p = {fisher(k1,n1-k1,k2,n2-k2):.3g}")

contrast("clean-neutral","clean-negative","H12 ","(does an irrelevant hedge match the true caveat?)")
contrast("clean-positive","clean-negative","H12b","(does a positive elaboration match the true caveat?)")
contrast("clean-neutral","drifted","H13 ","(does an irrelevant hedge differ from silence?)")
contrast("clean-positive","drifted","(x) ","(does a positive elaboration differ from silence?)")
contrast("drifted","clean-negative","(y) ","(the published clean-vs-drifted contrast, intent-matched)")
