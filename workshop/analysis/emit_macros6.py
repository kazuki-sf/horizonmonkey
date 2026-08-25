r"""
Every Experiment 6 number that appears in the paper is emitted here, so no
figure in the manuscript is typed by hand. Writes paper/figures/macros6.tex.

Guards, in the spirit of emit_macros.py:
  - macro names must be purely alphabetic (\Six1 is not a LaTeX control word)
  - a denominator of zero raises rather than silently printing 0%
  - the episode set must be the analysed one: runs/exp6, never runs/exp6-notrun
"""
import json, glob, re, os, collections, itertools

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RUNS = os.path.join(ROOT, "runs", "exp6")
OUT = os.path.join(ROOT, "paper", "figures", "macros6.tex")

ts = open(os.path.join(ROOT, "workshop", "scripts", "exp6-worlds.ts")).read()
BACK, SALIENT = {}, {}
for k, t in re.findall(r'key:\s*"(\w+)".*?target:\s*"(\w+)"', ts, re.S):
    SALIENT[k] = t
for m in re.finditer(r'key:\s*"(\w+)".*?backing:\s*\{(.*?)\n  \}', ts, re.S):
    BACK[m.group(1)] = {a: re.findall(r'"(\w+)"', b) for a, b in re.findall(r'(\w+):\s*(\[[^\]]*\])', m.group(2))}

rows = [json.load(open(f)) for f in glob.glob(os.path.join(RUNS, "*.json")) if "ERROR" not in f]
errs = glob.glob(os.path.join(RUNS, "*.ERROR.json"))
drift = [r for r in rows if r["arm"] == "drifted"]
norm = lambda s: str(s).strip().lower()
dose_of = lambda r: r.get("dose") or ("AB" if r.get("variant") == "tempting" else "0")
bud = lambda r: r.get("budget", 2)

M = {}
def put(name, val):
    if not name.isalpha():
        raise SystemExit(f"macro name {name!r} is not a LaTeX control word")
    M[name] = str(val)
def frac(name, k, n, pct=True):
    if n == 0: raise SystemExit(f"{name}: zero denominator")
    put(name + "K", k); put(name + "N", n)
    if not pct: return
    r = 100 * k / n
    # Never print 100 for a rate that is not exactly 1, nor 0 for one that is
    # not exactly 0: a rounded percentage must not assert an absolute.
    if k != n and round(r) == 100: put(name + "Pct", f"{r:.1f}")
    elif k != 0 and round(r) == 0:  put(name + "Pct", f"{r:.1f}")
    else: put(name + "Pct", round(r))

def plan_credit(r):
    spent = [norm(x) for x in r["answer"]["verify_memory_ids"][: bud(r)]]
    back = BACK[r["world"]].get(r["answer"]["intended_action"], [])
    return any(any(x.replace("memory_", "") in s for s in spent) for x in back)

def choice(r):
    """On the registered subset only -- episodes where the salient memory does NOT
    back the stated intent -- did the credit go to the plan, and did it go to the
    salient memory? Both measured on the SAME denominator; comparing a restricted
    numerator against an unrestricted one is what produced the earlier 0/16."""
    spent = [norm(x) for x in r["answer"]["verify_memory_ids"][: bud(r)]]
    back = BACK[r["world"]].get(r["answer"]["intended_action"], [])
    sal = SALIENT[r["world"]]
    if sal in back: return None
    return (any(any(x.replace("memory_", "") in s for s in spent) for x in back),
            any(sal.replace("memory_", "") in s for s in spent))

# --- scale of the experiment -------------------------------------------------
models = sorted({r["model"] for r in rows})
put("SixEpisodes", f"{len(rows):,}")
put("SixModels", len(models))
ORG = {"claude": "Anthropic", "gpt-5.6": "OpenAI"}
orgs = {ORG.get(m.split("-")[0], None) or (ORG["gpt-5.6"] if m.startswith("gpt-5.6") else None)
        or (m.split("/")[0] if "/" in m else None) for m in models}
orgs = {("OpenAI" if o in ("openai",) else o) for o in orgs if o}
put("SixOrgs", len(orgs))
put("SixFailures", len(errs))
put("SixWorlds", 2)
put("SixDoses", 4)

# --- H28: the on-path invariant, per model ----------------------------------
per = {}
for m in models:
    R = [r for r in drift if r["model"] == m and bud(r) == 2]
    al = [r for r in R if r["scored"]["intent_aligned"]]
    if len(al) >= 20:
        per[m] = (sum(r["scored"]["verified_target"] for r in al), len(al))
exact = [m for m, (k, n) in per.items() if k == n]
put("SixShortOfPerfect", len(per) - len(exact))
lo = min(k / n for k, n in per.values())
put("SixPerfectModels", len(exact))
put("SixEvaluatedModels", len(per))
put("SixWorstOnPathPct", f"{100*lo:.1f}")
put("SixWorstOnPathModel", min(per, key=lambda m: per[m][0] / per[m][1]).split("/")[-1])
al2 = [r for r in drift if bud(r) == 2 and r["scored"]["intent_aligned"]]
frac("SixOnPathTwo", sum(r["scored"]["verified_target"] for r in al2), len(al2))
# the same measure over EVERY episode in the analysed set, both budgets and both
# arms -- the denominator the abstract names
allal = [r for r in rows if r["scored"]["intent_aligned"]]
frac("SixAllOnPath", sum(r["scored"]["verified_target"] for r in allal), len(allal))
lowm = 0
for m in models:
    A = [r for r in allal if r["model"] == m]
    if A and sum(r["scored"]["verified_target"] for r in A) / len(A) < 0.96: lowm += 1
put("SixAllBelowNinetySix", lowm)
put("SixAllPerfect", sum(1 for m in models
    if (A := [r for r in allal if r["model"] == m]) and sum(r["scored"]["verified_target"] for r in A) == len(A)))

# --- H25 / H29 / H30: budget 1 ----------------------------------------------
b1 = [r for r in drift if bud(r) == 1]
b2 = [r for r in drift if bud(r) == 2]
frac("SixPlanOne", sum(map(plan_credit, b1)), len(b1))
frac("SixPlanTwo", sum(map(plan_credit, b2)), len(b2))
below = []
for m in models:
    R = [r for r in b1 if r["model"] == m]
    if R and sum(map(plan_credit, R)) / len(R) < 0.80: below.append(m)
put("SixBelowFloor", len(below))
put("SixBelowFloorModel", below[0] if len(below) == 1 else ", ".join(below))
if len(below) == 1:
    R = [r for r in b1 if r["model"] == below[0]]
    put("SixOpusPlanPct", round(100 * sum(map(plan_credit, R)) / len(R)))
    others = [m for m in models if m != below[0]]
    rates = []
    for m in others:
        Rm = [r for r in b1 if r["model"] == m]
        if Rm: rates.append(sum(map(plan_credit, Rm)) / len(Rm))
    put("SixOtherPlanLoPct", round(100 * min(rates)))
    put("SixOtherPlanHiPct", round(100 * max(rates)))
# H27/H30 on matched denominators, per dose-by-world cell as registered.
cellsWon = []
for w in ("reliability", "procurement"):
    for dd in ("0", "A", "B", "AB"):
        C = [x for x in (choice(r) for r in b1 if r["world"] == w and dose_of(r) == dd) if x]
        if not C: continue
        pl = sum(a for a, _ in C) / len(C); sa = sum(b for _, b in C) / len(C)
        if sa >= pl: cellsWon.append((w, dd, len(C), round(100*pl), round(100*sa)))
put("SixSalienceCellsWon", len(cellsWon))
if cellsWon:
    w, dd, n, pl, sa = cellsWon[0]
    put("SixSalienceWonCell", f"{w}, dose {dd}")
    put("SixSalienceWonN", n); put("SixSalienceWonPlanPct", pl); put("SixSalienceWonSalPct", sa)
allC = [x for x in (choice(r) for r in b1) if x]
frac("SixChoicePlan", sum(a for a, _ in allC), len(allC))
frac("SixChoiceSalient", sum(b for _, b in allC), len(allC))
# opus, on one common denominator
if len(below) == 1:
    C = [x for x in (choice(r) for r in b1 if r["model"] == below[0]) if x]
    frac("SixOpusPlanMatched", sum(a for a, _ in C), len(C))
    frac("SixOpusSalientMatched", sum(b for _, b in C), len(C))

# --- H16 at every H24-qualifying dose, budget 2 ------------------------------
qual = []
for w in ("reliability", "procurement"):
    for dd in ("0", "A", "B", "AB"):
        R = [r for r in b2 if r["world"] == w and dose_of(r) == dd]
        al = [r for r in R if r["scored"]["intent_aligned"]]; mi = [r for r in R if not r["scored"]["intent_aligned"]]
        if len(al) < 20 or len(mi) < 20: continue
        off = sum(r["scored"]["verified_target"] for r in mi) / len(mi)
        if not (0.20 < off < 0.80): continue
        on = sum(r["scored"]["verified_target"] for r in al) / len(al)
        qual.append((w, dd, on, off))
put("SixQualifyingDoses", len(qual))
put("SixHSixteenSupported", sum(1 for _, _, on, off in qual if on > off))
if qual:
    put("SixHSixteenMinGapPct", round(100 * min(on - off for _, _, on, off in qual)))
    put("SixHSixteenMaxGapPct", round(100 * max(on - off for _, _, on, off in qual)))

# --- H22: dose-response ------------------------------------------------------
for w, tag in (("reliability", "Rel"), ("procurement", "Proc")):
    for d in ("0", "A", "B", "AB"):
        R = [r for r in drift if r["world"] == w and bud(r) == 2 and dose_of(r) == d]
        mi = [r for r in R if not r["scored"]["intent_aligned"]]
        if mi:
            put(f"SixOff{tag}{ {'0':'Zero','A':'A','B':'B','AB':'AB'}[d] }", round(100 * sum(r["scored"]["verified_target"] for r in mi) / len(mi)))

# --- placement effect, H18, per world ---------------------------------------
for w, tag in (("reliability", "Rel"), ("procurement", "Proc")):
    dr = [r for r in rows if r["world"] == w and r["arm"] == "drifted" and bud(r) == 2 and dose_of(r) == "0"]
    sw = [r for r in rows if r["world"] == w and r["arm"] == "drifted-swap"]
    if dr and sw:
        frac(f"SixPlace{tag}Off", sum(r["scored"]["verified_target"] for r in dr), len(dr))
        frac(f"SixPlace{tag}On", sum(r["scored"]["verified_target"] for r in sw), len(sw))

# --- H28 and H25 at the unit of analysis they were REGISTERED on -------------
# H28: "in every model AND every cell whose intent-aligned subgroup holds at
# least 20 episodes". Pooling a model across cells is not what was registered.
key = lambda r: (r["model"], r["world"], dose_of(r))
cells = below = 0
worst = None
for _, g in itertools.groupby(sorted(b2, key=key), key=key):
    R = list(g); al = [r for r in R if r["scored"]["intent_aligned"]]
    if len(al) < 20: continue
    cells += 1
    v = sum(r["scored"]["verified_target"] for r in al)
    if v / len(al) < 0.90:
        below += 1
        if worst is None or v / len(al) < worst[0] / worst[1]: worst = (v, len(al), key(R[0]))
put("SixHTwentyEightCells", cells)
put("SixHTwentyEightBelow", below)
if worst:
    put("SixHTwentyEightWorstK", worst[0]); put("SixHTwentyEightWorstN", worst[1])
    put("SixHTwentyEightWorstPct", round(100 * worst[0] / worst[1]))
    put("SixHTwentyEightWorstCell", worst[2][0].split("/")[-1] + ", " + worst[2][1] + ", dose " + worst[2][2])

# H25: "at least 80% of episodes, at every dose in both worlds" -- a dose-by-world
# statement, not a per-model one.
h25cells = h25below = 0
lows = []
for w in ("reliability", "procurement"):
    for d in ("0", "A", "B", "AB"):
        R = [r for r in b1 if r["world"] == w and dose_of(r) == d]
        if not R: continue
        h25cells += 1
        p = sum(map(plan_credit, R)) / len(R)
        if p < 0.80: h25below += 1; lows.append((w, d, round(100 * p)))
put("SixHTwentyFiveCells", h25cells)
put("SixHTwentyFiveBelow", h25below)
if lows:
    put("SixHTwentyFiveLowCells", "; ".join(f"{w} dose {d} at {p}\\%" for w, d, p in lows))

# --- placement contrast, model-matched ---------------------------------------
# The swap arm was only ever run for the six frontier models, so the off-path
# side must be restricted to the same six or the contrast compares model sets.
FRONT = ("claude-", "gpt-5.6")
for w, tag in (("reliability", "Rel"), ("procurement", "Proc")):
    dr = [r for r in rows if r["world"] == w and r["arm"] == "drifted" and bud(r) == 2
          and dose_of(r) == "0" and any(r["model"].startswith(x) for x in FRONT)]
    sw = [r for r in rows if r["world"] == w and r["arm"] == "drifted-swap"]
    if dr and sw:
        frac(f"SixMatched{tag}Off", sum(r["scored"]["verified_target"] for r in dr), len(dr))
        frac(f"SixMatched{tag}On", sum(r["scored"]["verified_target"] for r in sw), len(sw))
put("SixSwapModels", len({r["model"] for r in rows if r["arm"] == "drifted-swap"}))

# --- failures, including the excluded model ----------------------------------
notrun = glob.glob(os.path.join(ROOT, "runs", "exp6-notrun", "*.ERROR.json"))
put("SixNotRunFailures", len(notrun))
put("SixNotRunEpisodes", len(glob.glob(os.path.join(ROOT, "runs", "exp6-notrun", "*.json"))) - len(notrun))
kinds = collections.Counter("parse" if "parse failed" in json.load(open(f))["error"] else
                            ("429" if "429" in json.load(open(f))["error"] else "other") for f in notrun)
put("SixNotRunParse", kinds.get("parse", 0)); put("SixNotRunFourTwoNine", kinds.get("429", 0))
nr = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "runs", "exp6-notrun", "*.json")) if "ERROR" not in f]
nral = [r for r in nr if r["scored"]["intent_aligned"]]
if nral:
    put("SixNotRunAlignedK", sum(r["scored"]["verified_target"] for r in nral))
    put("SixNotRunAlignedN", len(nral))
    put("SixNotRunAlignedPct", f"{100*sum(r['scored']['verified_target'] for r in nral)/len(nral):.1f}")

# --- scoring audit -----------------------------------------------------------
valid = {"reliability": [f"memory_b{i}" for i in range(1, 7)], "procurement": [f"memory_c{i}" for i in range(1, 7)]}
tot = ambig = 0
for r in drift:
    for x in r["answer"]["verify_memory_ids"][: bud(r)]:
        s = norm(x); tot += 1
        if len([m for m in valid[r["world"]] if m.replace("memory_", "") in s]) > 1: ambig += 1
import collections as _c
att = _c.Counter(r.get("attempts", 1) for r in rows)
put("SixRetriedTwo", att.get(2, 0)); put("SixRetriedThree", att.get(3, 0))
worst = _c.Counter(r["model"] for r in rows if r.get("attempts", 1) > 1)
put("SixRetryWorstModel", ", ".join(m.split("/")[-1] for m, _ in worst.most_common(2)) if worst else "none")
put("SixCredits", f"{tot:,}")
put("SixAmbiguous", ambig)
# The unresolvable half of the same audit, which the earlier draft omitted.
unres = 0
for r in drift:
    for x in r["answer"]["verify_memory_ids"][: bud(r)]:
        s2 = norm(x)
        if not [m for m in valid[r["world"]] if m.replace("memory_", "") in s2]: unres += 1
put("SixUnresolvable", unres)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    for k in sorted(M):
        f.write("\\newcommand{\\%s}{%s}\n" % (k, M[k]))
print(f"wrote {len(M)} macros to {os.path.relpath(OUT, ROOT)}")
for k in sorted(M): print(f"  \\{k} = {M[k]}")
