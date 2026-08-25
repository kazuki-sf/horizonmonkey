"""
Experiment 8. Written before the data existed. Estimands and thresholds come
from workshop/PREREGISTRATION-EXP8.md and are not adjustable here.

  H36 primary: P(verify | hedge) - P(verify | padded) >= +10 pts
               fails -> "silence is stealthier than qualification" is withdrawn
  H37 padding alone must not reproduce the whole hedge effect
  H38 the true caveat still suppresses, at fixed length
  H39 H36's sign positive in >= 4 of 6 models
  H40 the marginal contrast governs; the intent-stratified view is descriptive
"""
import json, glob, os, math, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
rows = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs/exp8/*.json")) if "ERROR" not in f]
errs = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs/exp8/*.ERROR.json"))]
if not rows: raise SystemExit("no episodes yet")
ARMS = ["drift", "padded", "hedge", "positive", "true-caveat"]

def wilson(k, n, z=1.96):
    if n == 0: return (0.0, 0.0)
    p = k/n; d = 1 + z*z/n; c = (p + z*z/(2*n))/d
    h = z*((p*(1-p)/n + z*z/(4*n*n))**.5)/d
    return (max(0, c-h), min(1, c+h))

arm = lambda a, **kw: [r for r in rows if r["arm"] == a and all(r[k] == v for k, v in kw.items())]
def rate(R, f="verified_target"):
    k = sum(r["scored"][f] for r in R); return k, len(R), (k/len(R) if R else 0.0)

print(f"episodes {len(rows)} | errors {len(errs)}")
if errs:
    for m, c in collections.Counter(e["model"] for e in errs).most_common():
        ok = len([r for r in rows if r["model"] == m]); print(f"    {m:20} {c}/{c+ok} = {c/(c+ok):.1%}")

print("\n" + "="*74)
print("VERIFICATION OF THE TARGET, by arm (randomised marginal, the primary view)\n")
print(f"  {'arm':13}{'append':>8}{'hedges':>8}{'negative':>10}      verified")
P = {}
for a in ARMS:
    R = arm(a); k, n, p = rate(R); P[a] = p
    lo, hi = wilson(k, n)
    L = R[0]["append_len"] if R else 0
    hedges = "yes" if a == "hedge" or a == "true-caveat" else "no"
    neg = "yes" if a == "true-caveat" else ("positive" if a == "positive" else "no")
    print(f"  {a:13}{L:>8}{hedges:>8}{neg:>10}   {k:3}/{n:3} = {p:5.1%}  [{lo:.0%}, {hi:.0%}]")

print("\n" + "="*74)
d36 = 100*(P["hedge"] - P["padded"])
print(f"\nH36  PRIMARY. hedge minus padded, at equal length = {d36:+.1f} points")
print(f"     registered threshold +10 -> {'SUPPORTED' if d36 >= 10 else 'FAILED'}")
if d36 < 10:
    print("     -> Hedging does not draw more scrutiny than a same-length neutral clause.")
    print("        Per the pre-registration: 'silence is stealthier than qualification'")
    print("        comes out of the abstract, the introduction and the conclusion.")

d_pad = 100*(P["padded"] - P["drift"])
d_hed = 100*(P["hedge"] - P["drift"])
print(f"\nH37  padded minus drift = {d_pad:+.1f}   hedge minus drift = {d_hed:+.1f}")
print(f"     -> {'SUPPORTED: padding alone does not reproduce the hedge effect' if d_pad < d_hed else 'FAILED: length and a second clause account for it'}")
print(f"     of the {d_hed:+.1f} point hedge-vs-drift gap, {d_pad:+.1f} is length and clause existence"
      f" and {d_hed-d_pad:+.1f} is hedging")

print(f"\nH38  true-caveat {100*P['true-caveat']:.1f}%  vs hedge {100*P['hedge']:.1f}%  vs padded {100*P['padded']:.1f}%")
ok38 = P["true-caveat"] < P["hedge"] and P["true-caveat"] < P["padded"]
print(f"     -> {'SUPPORTED: the true caveat suppresses at fixed length' if ok38 else 'FAILED'}")

print("\nH39  per model, hedge minus padded")
pos = 0
for m in sorted({r["model"] for r in rows}):
    _, _, a1 = rate(arm("hedge", model=m)); _, _, a2 = rate(arm("padded", model=m))
    d = 100*(a1-a2); pos += d > 0
    print(f"     {m:20} {100*a1:5.0f}% vs {100*a2:5.0f}%   {d:+6.1f}")
print(f"     positive in {pos} of 6 -> {'SUPPORTED' if pos >= 4 else 'FAILED'}")

print("\nH40  intent by arm (a mediator; the marginal contrast above governs)")
for a in ARMS:
    k, n, p = rate(arm(a), "intent_target")
    print(f"     {a:13} intends pricing {k:3}/{n:3} = {p:5.1%}")

num = den = 0.0
for m in sorted({r["model"] for r in rows}):
    A = arm("hedge", model=m); B = arm("padded", model=m)
    a = sum(r["scored"]["verified_target"] for r in A); b = len(A)-a
    c = sum(r["scored"]["verified_target"] for r in B); d2 = len(B)-c
    n = a+b+c+d2
    if n < 2 or (a+b) == 0 or (c+d2) == 0: continue
    num += a - (a+b)*(a+c)/n
    den += (a+b)*(c+d2)*(a+c)*(b+d2)/(n*n*(n-1))
if den > 0:
    chi = (abs(num)-0.5)**2/den
    print(f"\n     CMH on H36 stratified by model: chi2 = {chi:.1f}, p = {math.erfc(math.sqrt(chi/2)):.2e}")
