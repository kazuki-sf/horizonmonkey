"""Experiment 5 — does a real consolidation chain produce the corruption this
threat model assumes?  H14, H14b.  Two scorers must agree, as pre-registered."""
import json, glob, sys, os, collections
sys.path.insert(0, os.path.dirname(__file__))
from stats import pct, fisher

LAB = ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"]
NEG, SCOPE, NONE = {"memory_73"}, {"memory_31","memory_44","memory_57"}, {"memory_86","memory_91"}
KW = {  # keyword rule: the second, independent scorer
 "memory_73":["retention","churn","renewal","not sustain","unsustain","-12","12%","12pp","12 pp"],
 "memory_31":["not replicated","smb","other segment","segment-specific","segment specific","unreplicated"],
 "memory_44":["enterprise"],
 "memory_57":["6","six month","established","older","mature","tenured"],
 "memory_86":[], "memory_91":[]}

S = [json.load(open(f)) for f in glob.glob("workshop/runs/exp5-scores/**/*.json", recursive=True)]
D = {(d["model"], d["rep"]): d for d in (json.load(open(f)) for f in glob.glob("workshop/runs/exp5-v2/**/*.json", recursive=True))}
print(f"chains: {len(D)}   scored (chain,memory) pairs: {len(S)} / {len(D)*6}")
if len(S) < len(D)*6: print("  (PARTIAL)")

print("\nQualifier survival by generation — LLM scorer")
print(f"  {'generation':<16}{'negative outcome':>22}{'scope restriction':>24}{'no qualifier (control)':>26}")
for lab in LAB:
    row = []
    for keys in (NEG, SCOPE, NONE):
        rows = [s for s in S if s["memory"] in keys]
        k = sum(1 for s in rows for j in s["judgments"] if j["version"] == lab and j["states_qualifier"])
        n = sum(1 for s in rows for j in s["judgments"] if j["version"] == lab)
        row.append(pct(k, n) if n else "-")
    print(f"  {lab:<16}{row[0]:>22}{row[1]:>24}{row[2]:>26}")

print("\nAgreement between the two scorers (pre-registered: both must agree)")
dis = collections.Counter(); tot = collections.Counter()
for s in S:
    ch = D.get((s["model"], s["rep"]))
    if not ch: continue
    kws = KW[s["memory"]]
    for i, j in enumerate(s["judgments"]):
        if j["version"] not in LAB: continue
        gi = LAB.index(j["version"])
        txt = ch["generations"][gi].get(s["memory"], "").lower()
        kw = any(w in txt for w in kws) if kws else False
        tot[s["memory"]] += 1
        if kw != j["states_qualifier"]: dis[s["memory"]] += 1
for m in sorted(tot):
    print(f"  {m}: disagree {dis[m]}/{tot[m]} ({100*dis[m]/tot[m]:.0f}%)")
print(f"  overall disagreement {sum(dis.values())}/{sum(tot.values())} ({100*sum(dis.values())/max(1,sum(tot.values())):.0f}%)")

print("\nFalse-positive check — memory_86/91 carry no qualifier in the source")
rows = [s for s in S if s["memory"] in NONE]
fp = sum(1 for s in rows for j in s["judgments"] if j["states_qualifier"])
n = sum(1 for s in rows for j in s["judgments"])
print(f"  LLM scorer reported a qualifier in {fp}/{n} judgments where the source states none")
srcq = collections.Counter("none" if "none" in s["qualifier_in_source"].lower()[:12] else "found" for s in rows)
print(f"  and identified the source qualifier as: {dict(srcq)}")

print("\nThe pre-registered agreement rule is mis-specified, and we report that")
print("  rather than its output. Conditioning on the two scorers agreeing censors")
print("  informatively: disagreements occur precisely where one scorer sees a lost")
print("  qualifier, so the agreeing subset is biased toward survival and returns")
print("  100% at every generation. The correct treatment of scorer disagreement is")
print("  bounds, not deletion.\n")
print(f"  {'generation':<16}{'negative outcome':>26}{'scope restriction':>26}")
print(f"  {'':<16}{'[all-lost, all-kept]':>26}{'[all-lost, all-kept]':>26}")
for lab in LAB:
    out=[]
    for keys in (NEG, SCOPE):
        lo=hi=n=0
        for s_ in S:
            if s_["memory"] not in keys: continue
            ch = D.get((s_["model"], s_["rep"]))
            if not ch: continue
            for j_ in s_["judgments"]:
                if j_["version"] != lab: continue
                gi = LAB.index(lab)
                txt = ch["generations"][gi].get(s_["memory"], "").lower()
                kws = KW[s_["memory"]]
                kw = any(w in txt for w in kws) if kws else False
                n += 1
                agree = (kw == j_["states_qualifier"])
                if agree and j_["states_qualifier"]: lo += 1; hi += 1
                elif not agree:                      hi += 1     # counted kept only in the upper bound
        out.append(f"[{100*lo/n:.0f}%, {100*hi/n:.0f}%]  n={n}" if n else "-")
    print(f"  {lab:<16}{out[0]:>26}{out[1]:>26}")

print("\nWhat erodes: prohibition vs number, on memory_73 finals")
PROH = ["do not","don't","never","avoid","not a growth","not sustainable","unsustainable","not a lever","only for","one-off"]
NUM  = ["retention","churn","renewal","-12","12%","12pp"]
for lab in ("consolidated","resum_70"):
    gi = LAB.index(lab)
    kp = kn = t = 0
    for ch in D.values():
        s = ch["generations"][gi].get("memory_73","").lower()
        t += 1; kp += any(w in s for w in PROH); kn += any(w in s for w in NUM)
    print(f"  {lab:<14} states the negative outcome {kn}/{t}   states a prohibition {kp}/{t}")
