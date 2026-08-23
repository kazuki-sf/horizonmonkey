"""Does the triage instruction change PHASE-2 behavior through a path other than
verification allocation?  Stratify on what phase 1 actually recovered."""
import json, glob, collections, math
E=[json.load(open(f)) for f in glob.glob("runs/paper-phase2/phase2-v1/**/*.json", recursive=True)]
E=[e for e in E if "scores" in e and e.get("condition") in ("clean","drifted","drifted-triage")]
print(f"episodes loaded: {len(E)}")

def rate(rows):
    n=len(rows); k=sum(1 for e in rows if e["scores"]["p2_action"]=="promotional_pricing")
    return k,n,(100*k/n if n else float('nan'))

print("\n=== Phase-2 pricing rate, STRATIFIED on whether phase 1 recovered memory_73 ===")
print(f"{'arm':<16}{'73 recovered':>14}{'73 NOT recovered':>20}")
for cond in ("drifted","drifted-triage"):
    rows=[e for e in E if e["condition"]==cond]
    v=[e for e in rows if e["scores"]["verified_73"]]
    u=[e for e in rows if not e["scores"]["verified_73"]]
    kv,nv,pv=rate(v); ku,nu,pu=rate(u)
    print(f"{cond:<16}{f'{kv}/{nv} ({pv:.0f}%)':>14}{f'{ku}/{nu} ({pu:.0f}%)':>20}")

# Fisher on the NOT-recovered stratum: if triage still lowers pricing here,
# it is acting through something other than what the budget recovered.
def fisher(a,b,c,d):
    from math import comb
    def p(a,b,c,d): return comb(a+b,a)*comb(c+d,c)/comb(a+b+c+d,a+c)
    obs=p(a,b,c,d); tot=0.0
    for i in range(0,a+b+1):
        j=a+b-i; k=a+c-i; l=c+d-(a+c-i)
        if k<0 or l<0 or j<0: continue
        q=p(i,j,k,l)
        if q<=obs+1e-12: tot+=q
    return min(1.0,tot)

for label,sel in (("73 NOT recovered", lambda e: not e["scores"]["verified_73"]),
                  ("73 recovered",     lambda e: e["scores"]["verified_73"])):
    d=[e for e in E if e["condition"]=="drifted" and sel(e)]
    t=[e for e in E if e["condition"]=="drifted-triage" and sel(e)]
    kd,nd,_=rate(d); kt,nt,_=rate(t)
    if nd and nt:
        p=fisher(kd,nd-kd,kt,nt-kt)
        print(f"\n  stratum [{label}]: drifted {kd}/{nd} vs triage {kt}/{nt}   Fisher p = {p:.4g}")

print("\n=== Does triage change phase-1 ALLOCATION (the mediator)? ===")
for cond in ("drifted","drifted-triage"):
    rows=[e for e in E if e["condition"]==cond]
    k=sum(1 for e in rows if e["scores"]["verified_73"])
    print(f"  {cond:<16} recovered memory_73 in {k}/{len(rows)} ({100*k/len(rows):.0f}%)")
