"""
Experiment 9. Written before the data existed; every threshold comes from
workshop/PREREGISTRATION-EXP9.md and is not adjustable here.

  H41  primary. P(verify | natural-padded) at least 15 points BELOW P(verify | hand-drift)
  H42  P(verify | natural) at least 15 points below hand-drift  (Exp 5b, confirmatory)
  H43  the H41 gap is at least half the H42 gap, else the effect is length
  H44  P(verify | intact) below P(verify | natural-padded)
  H45  H41's sign negative in at least 4 of 6 models

  Falsification: H41 failing means consolidation does not produce a stealthier
  record, Experiment 5b's 22% was a length artefact, and the claim comes out of
  the abstract -- not into a limitation.
"""
import json, glob, os, math, collections, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
rows = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs/exp9/*.json")) if "ERROR" not in f]
errs = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs/exp9/*.ERROR.json"))]
if not rows: raise SystemExit("no episodes yet")

def wilson(k, n, z=1.96):
    if n == 0: return (0.0, 0.0)
    p = k / n; d = 1 + z*z/n; c = (p + z*z/(2*n)) / d
    h = z * ((p*(1-p)/n + z*z/(4*n*n)) ** .5) / d
    return (max(0, c-h), min(1, c+h))

def sel(**kw): return [r for r in rows if all(r[k] == v for k, v in kw.items())]
def rate(R, f="verified_target"):
    k = sum(r["scored"][f] for r in R)
    return k, len(R), (k/len(R) if R else 0.0)
def show(label, R, f="verified_target"):
    k, n, p = rate(R, f); lo, hi = wilson(k, n)
    print(f"  {label:34} {k:3}/{n:3} = {p:5.1%}  [{lo:.0%}, {hi:.0%}]")
    return p

ARMS = ["natural", "natural-padded", "hand-drift", "intact"]

print(f"episodes {len(rows)} | errors {len(errs)}")
if errs:
    for m, c in collections.Counter(e["model"] for e in errs).most_common():
        n_ok = len([r for r in rows if r["model"] == m])
        flag = "  EXCLUDED per prereg" if c/(c+n_ok) > 0.20 else ""
        print(f"    {m:20} {c}/{c+n_ok} = {c/(c+n_ok):.1%}{flag}")
print(f"episodes naming no memory at all: {len([r for r in rows if r['scored']['spent'] == 0])}")

lens = collections.defaultdict(list)
for r in rows: lens[r["arm"]].append(r["target_len"])
print("\nbody length actually shown, by arm")
for a in ARMS:
    L = sorted(lens[a])
    if L: print(f"  {a:16} n={len(L):3}  {L[0]}-{L[-1]}, median {L[len(L)//2]}")

print("\n" + "=" * 70)
print("VERIFICATION OF memory_73, by arm\n")
P = {a: show(a, sel(arm=a)) for a in ARMS}

print("\n" + "=" * 70)
D41 = 100 * (P["natural-padded"] - P["hand-drift"])
print(f"\nH41  PRIMARY. natural-padded - hand-drift = {D41:+.1f} points")
print(f"     registered: at least 15 points BELOW -> "
      f"{'SUPPORTED' if D41 <= -15 else 'FAILED'}")
if D41 > -15:
    print("     -> Consolidation does NOT produce a stealthier record at fixed length.")
    print("        Per the pre-registration: Experiment 5b's 22% was a length artefact,")
    print("        the claim comes OUT of the abstract, and this is stated in the")
    print("        abstract, not in a limitation.")

D42 = 100 * (P["natural"] - P["hand-drift"])
print(f"\nH42  natural - hand-drift (no length control) = {D42:+.1f} points"
      f"  -> {'SUPPORTED' if D42 <= -15 else 'FAILED'}")

if D42 < 0:
    share = D41 / D42
    print(f"\nH43  the H41 gap is {share:.0%} of the H42 gap"
          f"  -> {'SUPPORTED' if D41 <= D42 / 2 else 'FAILED: most of the gap is length'}")
    print(f"     length accounts for {100 * (1 - max(share, 0)):.0f}% of the raw natural effect")
else:
    print("\nH43  not evaluable: H42's gap is not negative")

D44 = 100 * (P["intact"] - P["natural-padded"])
print(f"\nH44  intact - natural-padded = {D44:+.1f} points"
      f"  -> {'SUPPORTED' if D44 < 0 else 'FAILED'}")

print("\nH45  per model, natural-padded vs hand-drift")
neg = 0
for m in sorted({r["model"] for r in rows}):
    _, na, a = rate(sel(arm="natural-padded", model=m))
    _, nb, b = rate(sel(arm="hand-drift", model=m))
    d = 100 * (a - b); neg += d < 0
    print(f"     {m:20} {100*a:5.0f}% vs {100*b:5.0f}%   {d:+6.1f}")
print(f"     negative in {neg} of 6 -> {'SUPPORTED' if neg >= 4 else 'FAILED'}")

# CMH on the primary contrast, stratified by model
num = den = 0.0
for m in sorted({r["model"] for r in rows}):
    a = sum(r["scored"]["verified_target"] for r in sel(arm="natural-padded", model=m))
    b = len(sel(arm="natural-padded", model=m)) - a
    c = sum(r["scored"]["verified_target"] for r in sel(arm="hand-drift", model=m))
    d2 = len(sel(arm="hand-drift", model=m)) - c
    n = a+b+c+d2
    if n < 2 or (a+b) == 0 or (c+d2) == 0: continue
    num += a - (a+b)*(a+c)/n
    den += (a+b)*(c+d2)*(a+c)*(b+d2)/(n*n*(n-1))
if den > 0:
    chi = (abs(num) - 0.5) ** 2 / den
    print(f"\n     CMH stratified by model: chi2 = {chi:.1f}, p = {math.erfc(math.sqrt(chi/2)):.2e}")
    print("     (the interval and effect size above are the result; this corroborates)")

# ---- exploratory, labelled in the pre-registration before the data existed ----
print("\n" + "=" * 70)
print("EXPLORATORY (pre-labelled, never a headline)\n")
KEEPS_NEG = re.compile(r"-\s?\d+%|\bchurn\b|\bretention\b|\brenewal\b", re.I)
PROHIB = re.compile(r"\bdo not\b|\bdon't\b|\bavoid\b|\bnot a\b|\bunsustainable\b|\bprioriti[sz]e\b", re.I)
nat = [r for r in rows if r["arm"] == "natural"]
for name, rx in (("retains a quantified negative / churn term", KEEPS_NEG),
                 ("retains normative force (contested rule)", PROHIB),
                 ("retains the -12% figure", re.compile(r"-\s?12"))):
    yes = [r for r in nat if rx.search(r["natural_source"]["body"])]
    no = [r for r in nat if not rx.search(r["natural_source"]["body"])]
    ky, ny, py = rate(yes); kn, nn, pn = rate(no)
    print(f"  {name}")
    print(f"     yes {ky:3}/{ny:3} = {py:5.1%}     no {kn:3}/{nn:3} = {pn:5.1%}"
          f"     {100*(py-pn):+.1f} pts")
med = sorted(r["target_len"] for r in nat)[len(nat)//2] if nat else 0
sh = [r for r in nat if r["target_len"] <= med]; lo_ = [r for r in nat if r["target_len"] > med]
ks, ns, ps = rate(sh); kl, nl, pl = rate(lo_)
print(f"  body length within the natural arm (split at {med})")
print(f"     shorter {ks:3}/{ns:3} = {ps:5.1%}   longer {kl:3}/{nl:3} = {pl:5.1%}"
      f"     {100*(pl-ps):+.1f} pts")
