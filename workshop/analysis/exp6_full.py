"""
Experiment 6, complete analysis over every model and every cell.

Hypotheses as registered in workshop/PREREGISTRATION-EXP6.md:
  H22  off-path verification is non-decreasing in dose, per world
  H23  on-path verification >= 0.90 at every dose (budget 2)
  H25  at budget 1 the single credit goes to the plan in >= 80% of episodes
  H27/H30  the topically salient off-path memory never overtakes the plan
  H28  H23 holds per model, or the invariant is specific to two labs
  H29  the on-path rate at budget 1 is below the rate at budget 2
  Error rule: a model above 20% schema-violation is excluded, rate and cause stated
"""
import json, glob, re, collections, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- backing maps parsed from the world definitions, so they cannot drift -----
ts = open(os.path.join(ROOT, "scripts", "exp6-worlds.ts")).read()
BACK, SALIENT = {}, {}
for key, target in re.findall(r'key:\s*"(\w+)".*?target:\s*"(\w+)"', ts, re.S):
    SALIENT[key] = target
for m in re.finditer(r'key:\s*"(\w+)".*?backing:\s*\{(.*?)\n  \}', ts, re.S):
    BACK[m.group(1)] = {a: re.findall(r'"(\w+)"', b) for a, b in re.findall(r'(\w+):\s*(\[[^\]]*\])', m.group(2))}
assert set(BACK) == {"reliability", "procurement"}, BACK.keys()

norm = lambda s: str(s).strip().lower()
def dose_of(r):
    return r.get("dose") or ("AB" if r.get("variant") == "tempting" else "0")
def budget_of(r):
    return r.get("budget", 2)

rows = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "..", "runs/exp6/*.json")) if "ERROR" not in f]
errs = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "..", "runs/exp6/*.ERROR.json"))]

# --- error rates and the 20% exclusion rule ---------------------------------
ec = collections.Counter(e["model"] for e in errs)
oc = collections.Counter(r["model"] for r in rows)
excluded, cause = set(), {}
print("=" * 78)
print("SCHEMA-VIOLATION RATE BY MODEL (registered rule: exclude above 20%)\n")
for m in sorted(set(oc) | set(ec)):
    ok, er = oc[m], ec[m]; tot = ok + er
    rate = er / tot if tot else 0
    flag = ""
    if rate > 0.20:
        excluded.add(m); flag = "  EXCLUDED"
        why = collections.Counter(re.sub(r"\d+", "N", e["error"])[:70] for e in errs if e["model"] == m)
        cause[m] = why.most_common(1)[0][0]
    print(f"  {m:34} ok={ok:5} fail={er:4}  {rate:5.1%}{flag}")
for m in sorted(excluded):
    print(f"    {m} excluded because: {cause[m]}")
rows = [r for r in rows if r["model"] not in excluded]
print(f"\n  analysed episodes: {len(rows)}  models: {len(set(r['model'] for r in rows))}")

# --- cell table --------------------------------------------------------------
def cell(R):
    al = [r for r in R if r["scored"]["intent_aligned"]]
    mi = [r for r in R if not r["scored"]["intent_aligned"]]
    return (sum(r["scored"]["verified_target"] for r in al), len(al),
            sum(r["scored"]["verified_target"] for r in mi), len(mi))

def plan_credit(r):
    """did a credit reach ANY memory backing the stated intent?"""
    b = budget_of(r)
    spent = [norm(x) for x in r["answer"]["verify_memory_ids"][:b]]
    back = BACK[r["world"]].get(r["answer"]["intended_action"], [])
    return any(any(x.replace("memory_", "") in s for s in spent) for x in back)

def salient_credit(r):
    b = budget_of(r)
    spent = [norm(x) for x in r["answer"]["verify_memory_ids"][:b]]
    sal = SALIENT[r["world"]]
    back = BACK[r["world"]].get(r["answer"]["intended_action"], [])
    if sal in back: return None                       # not off-path in this episode
    return any(sal.replace("memory_", "") in s for s in spent)

drift = [r for r in rows if r["arm"] == "drifted"]
print("\n" + "=" * 78)
print("ON-PATH VERIFICATION OF THE CORRUPTED MEMORY, by dose and budget")
print("(H23: >= 90% at every dose, budget 2)\n")
print(f"{'world':13}{'bud':>4}{'dose':>5}{'n':>6}{'ON-PATH':>16}{'OFF-PATH':>16}")
print("-" * 60)
for w in ("reliability", "procurement"):
    for b in (2, 1):
        for d in ("0", "A", "B", "AB"):
            R = [r for r in drift if r["world"] == w and budget_of(r) == b and dose_of(r) == d]
            if not R: continue
            ak, an, mk, mn = cell(R)
            f = lambda k, n: f"{k}/{n}={k/n:.0%}" if n else "-- empty"
            print(f"{w:13}{b:>4}{d:>5}{len(R):>6}{f(ak,an):>16}{f(mk,mn):>16}")
    print()

# --- H23 / H28: per model ----------------------------------------------------
print("=" * 78)
print("H28: the on-path invariant, per model (budget 2, cells with >= 20 aligned)\n")
fails = []
for m in sorted(set(r["model"] for r in drift)):
    R = [r for r in drift if r["model"] == m and budget_of(r) == 2]
    ak, an, _, _ = cell(R)
    if an == 0: print(f"  {m:34} no aligned episodes"); continue
    bad = an >= 20 and ak / an < 0.90
    if bad: fails.append(m)
    print(f"  {m:34} {ak}/{an} = {ak/an:6.1%}{'   BELOW 90%' if bad else ''}")
print(f"\n  H28 {'SUPPORTED for every model' if not fails else 'FAILED for: ' + ', '.join(fails)}")

# --- H25 / H29 / H30: budget 1 ----------------------------------------------
print("\n" + "=" * 78)
print("BUDGET 1: where the one credit goes (H25 floor 80%; H30 salience must lose)\n")
h25, h30 = [], []
for m in sorted(set(r["model"] for r in drift)):
    R1 = [r for r in drift if r["model"] == m and budget_of(r) == 1]
    R2 = [r for r in drift if r["model"] == m and budget_of(r) == 2]
    if not R1: continue
    p1 = sum(plan_credit(r) for r in R1) / len(R1)
    p2 = sum(plan_credit(r) for r in R2) / len(R2) if R2 else float("nan")
    sc = [salient_credit(r) for r in R1]; sc = [x for x in sc if x is not None]
    s1 = sum(sc) / len(sc) if sc else 0.0
    if p1 < 0.80: h25.append(m)
    if sc and s1 >= p1: h30.append(m)
    print(f"  {m:34} plan {p1:5.0%} (b2 {p2:5.0%})   salient {s1:5.0%} of {len(sc):4}")
print(f"\n  H25 {'SUPPORTED' if not h25 else 'FAILED for: ' + ', '.join(h25)}")
print(f"  H30 {'SUPPORTED, salience never overtakes the plan' if not h30 else 'FAILED for: ' + ', '.join(h30)}")

allp1 = [r for r in drift if budget_of(r) == 1]; allp2 = [r for r in drift if budget_of(r) == 2]
if allp1 and allp2:
    a, b = sum(map(plan_credit, allp1)) / len(allp1), sum(map(plan_credit, allp2)) / len(allp2)
    print(f"  H29 pooled: budget 1 {a:.0%} vs budget 2 {b:.0%} -> {'SUPPORTED' if a < b else 'FAILED'}")

# --- H22: dose-response ------------------------------------------------------
print("\n" + "=" * 78)
print("H22: off-path rate is non-decreasing in dose (budget 2)\n")
for w in ("reliability", "procurement"):
    off = {}
    for d in ("0", "A", "B", "AB"):
        R = [r for r in drift if r["world"] == w and budget_of(r) == 2 and dose_of(r) == d]
        if not R: continue
        _, _, mk, mn = cell(R)
        if mn: off[d] = mk / mn
    mids = [off[d] for d in ("A", "B") if d in off]
    ok = True
    if "0" in off and mids: ok &= off["0"] <= min(mids) + 1e-9
    if "AB" in off and mids: ok &= max(mids) <= off["AB"] + 1e-9
    print(f"  {w:13} " + ", ".join(f"{d}={off[d]:.0%}" for d in off) +
          f"   -> {'MONOTONE' if ok else 'NOT MONOTONE'}")
