"""Experiments 3A and 3B — workshop/PREREGISTRATION.md H9, H10, H11.

3A replays phase 2 with the triage text and the conversation history removed;
triage assignment stays randomized upstream, so it is an instrument for
recovering the corrupted memory's provenance.
3B randomizes the carry-forward directly.
"""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from stats import wilson, cmh, cmh_str, fisher, pct, wald_iv_bootstrap

MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]
SHORT = {m: m.replace("claude-","").replace("gpt-5.6-","") for m in MODELS}

def load(pat):
    return [json.load(open(f)) for f in glob.glob(pat, recursive=True)]

# ---------------------------------------------------------------- 3A
A = load("workshop/runs/exp3a-v1/**/*.json")
print(f"=== Experiment 3A — randomized-instrument replay ===")
print(f"episodes: {len(A)} / 450")
if len(A) < 450: print("  (PARTIAL — numbers below are interim)")

def cell(rows): return sum(1 for e in rows if e["scores"]["p2_pricing"]), len(rows)

print("\nPhase-2 promotional-pricing rate, replayed (no triage text, no history)")
print(f"  {'model':<10}{'drifted':>22}{'drifted+triage':>24}{'clean':>22}")
strata_out, strata_med, bym = [], [], {}
for m in MODELS:
    r = {c: [e for e in A if e["model"]==m and e["condition"]==c] for c in ("drifted","drifted-triage","clean")}
    cells = {c: cell(v) for c, v in r.items()}
    print(f"  {SHORT[m]:<10}" + "".join(f"{pct(*cells[c]):>22}" if c!='drifted-triage' else f"{pct(*cells[c]):>24}"
                                       for c in ("drifted","drifted-triage","clean")))
    kd,nd = cells["drifted"]; kt,nt = cells["drifted-triage"]
    if nd and nt:
        strata_out.append((kt,nt,kd,nd))
        md = sum(1 for e in r["drifted"] if e["verified_73_in_phase1"])
        mt = sum(1 for e in r["drifted-triage"] if e["verified_73_in_phase1"])
        strata_med.append((mt,nt,md,nd)); bym[m]=(kt,nt,kd,nd,mt,md)

tot = lambda c: cell([e for e in A if e["condition"]==c])
print(f"\n  pooled drifted        {pct(*tot('drifted'))}")
print(f"  pooled drifted+triage {pct(*tot('drifted-triage'))}")
print(f"  pooled clean          {pct(*tot('clean'))}")

print(f"\nH9  triage lowers replayed phase-2 pricing:  CMH {cmh_str(strata_out)}")
kt,nt = tot("drifted-triage"); kd,nd = tot("drifted")
print(f"    {kt}/{nt} vs {kd}/{nd}   pooled Fisher p = {fisher(kt,nt-kt,kd,nd-kd):.3g}")

# H10 exclusion-restriction check: matched on the mediator, arms should agree
print("\nH10 exclusion restriction — arms matched on what phase 1 recovered")
for lab, f_ in (("recovered memory_73", lambda e: e["verified_73_in_phase1"]),
                ("did not recover it",  lambda e: not e["verified_73_in_phase1"])):
    st=[]
    for m in MODELS:
        d=[e for e in A if e["model"]==m and e["condition"]=="drifted" and f_(e)]
        t=[e for e in A if e["model"]==m and e["condition"]=="drifted-triage" and f_(e)]
        if d and t:
            kd2,nd2=cell(d); kt2,nt2=cell(t); st.append((kt2,nt2,kd2,nd2))
    d=[e for e in A if e["condition"]=="drifted" and f_(e)]; t=[e for e in A if e["condition"]=="drifted-triage" and f_(e)]
    p = cmh(st) if st else None
    print(f"  {lab:<22} drifted {pct(*cell(d))}   triage {pct(*cell(t))}" + (f"   CMH p = {p:.3g}" if p else ""))

if len(bym)==len(MODELS):
    est, lo, hi, dY, dM = wald_iv_bootstrap(bym)
    print(f"\nWald IV — effect of recovering memory_73 on phase-2 pricing")
    print(f"  dY = {dY:+.3f}   dM = {dM:+.3f}   ratio = {est:+.3f}  95% CI [{lo:+.3f}, {hi:+.3f}]")

# contamination: replay vs original, same episodes
o = sum(1 for e in A if e["original_p2_action"]=="promotional_pricing")
r = sum(1 for e in A if e["scores"]["p2_pricing"])
print(f"\nreplay vs original on the same {len(A)} episodes: original {o} ({100*o/len(A):.0f}%) -> replay {r} ({100*r/len(A):.0f}%)")

# ---------------------------------------------------------------- 3B
B = load("workshop/runs/exp3b-v1/**/*.json")
print(f"\n\n=== Experiment 3B — randomized provenance carry-forward ===")
print(f"episodes: {len(B)} / 300" + ("  (PARTIAL)" if len(B)<300 else ""))
print(f"\n  {'model':<10}{'carry-target':>24}{'carry-other':>24}")
st=[]
for m in MODELS:
    ct=[e for e in B if e["model"]==m and e["arm"]=="carry-target"]
    co=[e for e in B if e["model"]==m and e["arm"]=="carry-other"]
    if not ct or not co: continue
    kt2,nt2=cell(ct); kc,nc=cell(co); st.append((kt2,nt2,kc,nc))
    print(f"  {SHORT[m]:<10}{pct(kt2,nt2):>24}{pct(kc,nc):>24}")
at=[e for e in B if e["arm"]=="carry-target"]; ao=[e for e in B if e["arm"]=="carry-other"]
if at and ao:
    kt2,nt2=cell(at); kc,nc=cell(ao)
    print(f"\n  pooled     {pct(kt2,nt2):>24}{pct(kc,nc):>24}")
    print(f"\nH11 carrying the corrupted memory's source lowers phase-2 pricing")
    print(f"    CMH stratified by model: {cmh_str(st)}")
    print(f"    pooled Fisher p = {fisher(kt2,nt2-kt2,kc,nc-kc):.3g}")
    print(f"    absolute risk difference = {100*(kt2/nt2 - kc/nc):+.0f} percentage points")
