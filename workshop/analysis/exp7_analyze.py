"""
Experiment 7. Written before the data existed; the estimands and thresholds come
from workshop/PREREGISTRATION-EXP7.md and are not adjustable here.

  H31  primary. Delta = P(verify 73 | pricing, verifyonly) - P(... | onboarding, verifyonly) >= +20 pts
  H32  the same contrast under joint elicitation, >= +20 and not more than 15 below H31's
  H33  P(verify 73 | pricing) - P(verify 73 | none) >= +15, pooled over elicitation
  H34  Delta positive in at least 5 of 6 models
  H35  mirror. P(verify an onboarding memory | onboarding) - P(... | pricing) >= +20 pts

  Falsification: Delta < 10 means the upstream relationship is not shown to be
  plan-conditioned, and the title, abstract and vocabulary change.
"""
import json, glob, os, math, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
rows = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs/exp7/*.json")) if "ERROR" not in f]
errs = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs/exp7/*.ERROR.json"))]
if not rows: raise SystemExit("no episodes yet")

def wilson(k, n, z=1.96):
    if n == 0: return (0.0, 0.0)
    p = k / n; d = 1 + z*z/n; c = (p + z*z/(2*n)) / d
    h = z * ((p*(1-p)/n + z*z/(4*n*n)) ** .5) / d
    return (max(0, c-h), min(1, c+h))

def sel(**kw):
    return [r for r in rows if all(r[k] == v for k, v in kw.items())]

def rate(R, field="verified_target"):
    k = sum(r["scored"][field] for r in R)
    return k, len(R), (k/len(R) if R else 0.0)

def show(label, R, field="verified_target"):
    k, n, p = rate(R, field)
    lo, hi = wilson(k, n)
    print(f"  {label:42} {k:3}/{n:3} = {p:5.1%}  [{lo:.0%}, {hi:.0%}]")
    return p

# --- error rates, reported whatever they are --------------------------------
print(f"episodes {len(rows)} | errors {len(errs)}")
if errs:
    for m, c in collections.Counter(e["model"] for e in errs).most_common():
        n_ok = len([r for r in rows if r["model"] == m])
        print(f"    {m:20} {c}/{c+n_ok} = {c/(c+n_ok):.1%}")
spent0 = [r for r in rows if r["scored"]["spent"] == 0]
print(f"episodes naming no memory at all: {len(spent0)}")

print("\n" + "=" * 74)
print("WHERE THE SINGLE CREDIT GOES, by assigned plan and elicitation\n")
for e in ("verifyonly", "joint"):
    print(f" elicitation = {e}")
    for p in ("none", "pricing", "onboarding"):
        show(f"plan={p}  -> memory_73 (pricing)", sel(plan=p, elicit=e))
    for p in ("none", "pricing", "onboarding"):
        show(f"plan={p}  -> an onboarding memory", sel(plan=p, elicit=e), "verified_onboarding")
    print()

# --- H31 primary -------------------------------------------------------------
print("=" * 74)
_, _, p_pri = rate(sel(plan="pricing", elicit="verifyonly"))
_, _, p_onb = rate(sel(plan="onboarding", elicit="verifyonly"))
D = 100 * (p_pri - p_onb)
print(f"\nH31  PRIMARY. Delta (verify-only) = {100*p_pri:.1f}% - {100*p_onb:.1f}% = {D:+.1f} points")
if D >= 20:   v31 = "SUPPORTED"
elif D >= 10: v31 = "FAILED (10 <= Delta < 20: effect present, below the registered threshold)"
else:         v31 = "FALSIFIED (Delta < 10)"
print(f"     registered threshold +20 -> {v31}")
if D < 10:
    print("     -> The upstream relationship is NOT shown to be plan-conditioned.")
    print("        Per the pre-registration: the title changes, the abstract states the")
    print("        association is consistent with response coherence, and 'policy' comes out.")

# --- H32 joint ---------------------------------------------------------------
_, _, j_pri = rate(sel(plan="pricing", elicit="joint"))
_, _, j_onb = rate(sel(plan="onboarding", elicit="joint"))
Dj = 100 * (j_pri - j_onb)
print(f"\nH32  joint elicitation Delta = {Dj:+.1f} points"
      f"  -> {'SUPPORTED' if Dj >= 20 and (Dj - D) <= 15 else 'FAILED'}")
print(f"     joint minus verify-only = {Dj - D:+.1f} points"
      f"  ({'coherence explains little' if abs(Dj-D) <= 15 else 'a large part of Exp 1 may be coherence'})")

# --- H33 movement off baseline ----------------------------------------------
_, _, b_pri = rate(sel(plan="pricing"))
_, _, b_non = rate(sel(plan="none"))
D33 = 100 * (b_pri - b_non)
print(f"\nH33  pricing minus no-plan (pooled) = {D33:+.1f} points"
      f"  -> {'SUPPORTED' if D33 >= 15 else 'FAILED'}")

# --- H34 per model -----------------------------------------------------------
print("\nH34  per model, verify-only Delta")
pos = 0
for m in sorted({r["model"] for r in rows}):
    _, _, a = rate(sel(plan="pricing", elicit="verifyonly", model=m))
    _, _, b = rate(sel(plan="onboarding", elicit="verifyonly", model=m))
    d = 100 * (a - b); pos += d > 0
    print(f"     {m:20} {100*a:5.0f}% vs {100*b:5.0f}%   {d:+6.1f}")
print(f"     positive in {pos} of 6 -> {'SUPPORTED' if pos >= 5 else 'FAILED'}")

# --- H35 mirror --------------------------------------------------------------
_, _, o_onb = rate(sel(plan="onboarding", elicit="verifyonly"), "verified_onboarding")
_, _, o_pri = rate(sel(plan="pricing", elicit="verifyonly"), "verified_onboarding")
D35 = 100 * (o_onb - o_pri)
print(f"\nH35  MIRROR. onboarding lookups: {100*o_onb:.1f}% under an onboarding plan"
      f" vs {100*o_pri:.1f}% under a pricing plan = {D35:+.1f} points")
print(f"     -> {'SUPPORTED: the assignment redirects attention, it does not merely suppress' if D35 >= 20 else 'FAILED'}")

# --- CMH stratified by model, on the primary contrast ------------------------
num = den = 0.0
for m in sorted({r["model"] for r in rows}):
    a = sum(r["scored"]["verified_target"] for r in sel(plan="pricing", elicit="verifyonly", model=m))
    b = len(sel(plan="pricing", elicit="verifyonly", model=m)) - a
    c = sum(r["scored"]["verified_target"] for r in sel(plan="onboarding", elicit="verifyonly", model=m))
    d2 = len(sel(plan="onboarding", elicit="verifyonly", model=m)) - c
    n = a+b+c+d2
    if n < 2 or (a+b) == 0 or (c+d2) == 0: continue
    num += a - (a+b)*(a+c)/n
    den += (a+b)*(c+d2)*(a+c)*(b+d2)/(n*n*(n-1))
if den > 0:
    chi = (abs(num) - 0.5) ** 2 / den
    p = math.erfc(math.sqrt(chi/2))
    print(f"\n     CMH stratified by model: chi2 = {chi:.1f}, p = {p:.2e}")
    print("     (the interval and the effect size above are the result; this is corroboration)")
