"""
Emits every Experiment 7, 8, 9 and 10 number the PALM paper uses, straight from
the stored episode files. No number in the paper is typed by hand.

  python3 workshop/analysis/emit_macros710.py
"""
import json, glob, os, math, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = [os.path.join(ROOT, "workshop/paper/macros710.tex"),
       os.path.join(ROOT, "paper/figures/macros710.tex")]

def load(d):
    return [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, d, "*.json")) if "ERROR" not in f]

E7, E8, E9, ES = load("runs/exp7"), load("runs/exp8"), load("runs/exp9"), load("runs/exp9-sens")
E10, E10R = load("runs/exp10"), load("runs/exp10-repl")

M = {}
def put(k, v): M[k] = v

def rate(R, f="verified_target"):
    k = sum(r["scored"][f] for r in R); return k, len(R), (k/len(R) if R else 0.0)

def wilson(k, n, z=1.96):
    if n == 0: return (0.0, 0.0)
    p = k/n; d = 1+z*z/n; c = (p+z*z/(2*n))/d
    h = z*((p*(1-p)/n + z*z/(4*n*n))**.5)/d
    return (max(0, c-h), min(1, c+h))

def pct(name, k, n):
    """k, n, percentage. Never prints 100 for a rate that is not exactly 1."""
    put(name+"K", k); put(name+"N", n)
    r = 100*k/n if n else 0.0
    if k != n and round(r) == 100: put(name+"Pct", f"{r:.1f}")
    elif k != 0 and round(r) == 0: put(name+"Pct", f"{r:.1f}")
    else: put(name+"Pct", round(r))
    lo, hi = wilson(k, n)
    put(name+"CIlo", round(100*lo)); put(name+"CIhi", round(100*hi))

def cmh(A, B, rows):
    num = den = 0.0
    for m in sorted({r["model"] for r in rows}):
        a = sum(r["scored"]["verified_target"] for r in A if r["model"] == m)
        b = len([r for r in A if r["model"] == m]) - a
        c = sum(r["scored"]["verified_target"] for r in B if r["model"] == m)
        d = len([r for r in B if r["model"] == m]) - c
        n = a+b+c+d
        if n < 2 or (a+b) == 0 or (c+d) == 0: continue
        num += a - (a+b)*(a+c)/n
        den += (a+b)*(c+d)*(a+c)*(b+d)/(n*n*(n-1))
    if den <= 0: return 0.0, 1.0
    chi = (abs(num)-0.5)**2/den
    return chi, math.erfc(math.sqrt(chi/2))

def texp(p):
    """A p-value as LaTeX, never as a bare tiny float."""
    if p < 1e-12: return r"p < 10^{-12}"
    e = math.floor(math.log10(p))
    return rf"p = {p/10**e:.1f}\times 10^{{{e}}}"

# ---------------- Experiment 7: the causal upstream result -------------------
sel7 = lambda **kw: [r for r in E7 if all(r[k] == v for k, v in kw.items())]
put("SevenN", len(E7)); put("SevenErr", len(glob.glob(os.path.join(ROOT, "runs/exp7/*.ERROR.json"))))
pri = sel7(plan="pricing", elicit="verifyonly"); onb = sel7(plan="onboarding", elicit="verifyonly")
kp, np_, pp = rate(pri); ko, no, po = rate(onb)
pct("SevenPri", kp, np_); pct("SevenOnb", ko, no)
put("SevenDelta", f"{100*(pp-po):.1f}")
chi, p = cmh(pri, onb, E7); put("SevenCMH", f"{chi:.1f}"); put("SevenCMHP", texp(p))
put("SevenModels", len({r["model"] for r in E7}))
put("SevenPos", sum(1 for m in sorted({r["model"] for r in E7})
                    if rate(sel7(plan="pricing", elicit="verifyonly", model=m))[2]
                     > rate(sel7(plan="onboarding", elicit="verifyonly", model=m))[2]))
# joint vs verify-only: coherence would predict the opposite sign
jp = rate(sel7(plan="pricing", elicit="joint"))[2]; jo = rate(sel7(plan="onboarding", elicit="joint"))[2]
put("SevenJointDelta", f"{100*(jp-jo):.1f}")
# the mirror: does an onboarding plan pull the credit onto an ONBOARDING memory?
mo = rate(sel7(plan="onboarding", elicit="verifyonly"), "verified_onboarding")
mp = rate(sel7(plan="pricing", elicit="verifyonly"), "verified_onboarding")
pct("SevenMirrorOnb", mo[0], mo[1]); pct("SevenMirrorPri", mp[0], mp[1])
put("SevenMirror", f"{100*(mo[2]-mp[2]):.1f}")
# the no-plan baseline, registered under H33 and previously unreported
nk, nn, pn = rate(sel7(plan="none", elicit="verifyonly"))
pct("SevenNone", nk, nn)
put("SevenPriVsNone", f"{100*(pp-pn):.1f}"); put("SevenOnbVsNone", f"{100*(po-pn):.1f}")

put("SevenElicitGap", f"{100*((pp-po)-(jp-jo)):.1f}")
# Agents that abandon the assigned plan still verify its evidence. Only the
# joint elicitation can be classified this way: verify-only has no action field.
J = sel7(plan="pricing", elicit="joint")
ov = [r for r in J if r["answer"].get("intended_action") != "promotional_pricing"]
pct("SevenOverturn", sum(r["scored"]["verified_target"] for r in ov), len(ov))
kp_ = [r for r in J if r["answer"].get("intended_action") == "promotional_pricing"]
pct("SevenKept", sum(r["scored"]["verified_target"] for r in kp_), len(kp_))
put("SevenOverturnRate", round(100*len(ov)/len(J)))

# ---------------- Experiment 8: the falsification and the real effect --------
a8 = lambda a: [r for r in E8 if r["arm"] == a]
put("EightN", len(E8))
for arm, nm in [("drift","EightDrift"),("padded","EightPadded"),("hedge","EightHedge"),
                ("positive","EightPositive"),("true-caveat","EightCaveat")]:
    k, n, _ = rate(a8(arm)); pct(nm, k, n)
_, _, ph = rate(a8("hedge")); _, _, ppd = rate(a8("padded")); _, _, pd = rate(a8("drift"))
_, _, pc = rate(a8("true-caveat"))
put("EightHedgeVsPadded", f"{100*(ph-ppd):.1f}")
_, ph_p = cmh(a8("hedge"), a8("padded"), E8); put("EightHedgeVsPaddedP", f"{ph_p:.2f}")
put("EightLengthEffect", f"{100*(ppd-pd):.1f}")
put("EightCaveatVsPadded", f"{100*(pc-ppd):.1f}")
AL = sorted({r["append_len"] for r in E8 if r["append_len"] > 0})
put("EightAppendMin", min(AL)); put("EightAppendMax", max(AL))
_, _, ppos = rate(a8("positive"))
put("EightPositiveVsPadded", f"{100*(ppos-ppd):.1f}")

# ---------------- Experiment 9: the natural-consolidation boundary -----------
a9 = lambda a: [r for r in E9 if r["arm"] == a]
put("NineN", len(E9))
for arm, nm in [("natural","NineNat"),("natural-padded","NinePad"),("hand-drift","NineHand"),("intact","NineIntact")]:
    k, n, _ = rate(a9(arm)); pct(nm, k, n)
put("NinePadVsHand", f"{100*(rate(a9('natural-padded'))[2]-rate(a9('hand-drift'))[2]):.1f}")
put("NinePadVsIntact", f"{100*(rate(a9('natural-padded'))[2]-rate(a9('intact'))[2]):.1f}")
put("NineNatVsIntact", f"{100*(rate(a9('natural'))[2]-rate(a9('intact'))[2]):.1f}")
put("NineNatVsHand", f"{100*(rate(a9('natural'))[2]-rate(a9('hand-drift'))[2]):.1f}")
# the bodies: what consolidation preserved
NAT = sorted({r["natural_source"]["body"] for r in E9 if r.get("natural_source")})
import re
put("NineBodies", len(NAT))
put("NineKeepNeg", sum(1 for b in NAT if re.search(r"-\s?\d+|churn|retention", b, re.I)))
put("NineKeepNegLoose", sum(1 for b in NAT if re.search(r"-\s?\d+|churn|retention|renewal|retain|weak", b, re.I)))
put("NineKeepPro", sum(1 for b in NAT if re.search(r"avoid|skip|do not|don't|unsustainable|one-off|not a lever|guardrail|tactical", b, re.I)))
# intent: the consolidated body suppresses the risky action as the intact one does
for arm, nm in [("natural","NineNatIntent"),("natural-padded","NinePadIntent"),
                ("hand-drift","NineHandIntent"),("intact","NineIntactIntent")]:
    k, n, _ = rate(a9(arm), "intent_target"); pct(nm, k, n)
# identical-prompt stability, from the sensitivity run
key = lambda x: (x["model"], x["run"])
A = {key(r): r for r in E9 if r["arm"] == "natural-padded"}; B = {key(r): r for r in ES}
same = [k for k in set(A) & set(B) if A[k]["user_prompt"] == B[k]["user_prompt"]]
flip = sum(1 for k in same if A[k]["scored"]["verified_target"] != B[k]["scored"]["verified_target"])
put("StabilityN", len(same)); put("StabilityFlip", flip)
put("StabilityFlipPct", round(100*flip/len(same)))
fr = [(m, sum(1 for k in same if k[0] == m and A[k]["scored"]["verified_target"] != B[k]["scored"]["verified_target"])
          / len([k for k in same if k[0] == m])) for m in sorted({k[0] for k in same})]
put("StabilityMin", f"{100*min(v for _, v in fr):.1f}"); put("StabilityMax", f"{100*max(v for _, v in fr):.1f}")
put("StabilityWorstModel", max(fr, key=lambda x: x[1])[0])

# ---------------- Experiment 10: constraint, not style ----------------------
def e10(R, **kw): return [r for r in R if all(r.get(k) == v for k, v in kw.items())]
def eff(R, **kw):
    a = [r for r in e10(R, **kw) if r.get("level") == "removed"]
    b = [r for r in e10(R, **kw) if r.get("level") in ("negative", "prohibition")]
    return 100*(rate(a)[2] - rate(b)[2])
BOTH = E10 + E10R
put("TenN", len(E10)); put("TenReplN", len(E10R)); put("TenBothN", len(BOTH))
# the bridge cell has no constraint level and does not enter the contrast
put("TenContrastN", len([r for r in BOTH if r.get("level")]))
put("TenFamilies", len({r["family"] for r in E10 if r.get("family")}))
put("TenModels", len({r["model"] for r in E10}))
put("TenPrimary", f"{eff(E10):.1f}"); put("TenRepl", f"{eff(E10R):.1f}")
put("TenPooled", f"{eff(BOTH):.1f}")
put("TenReplDiff", f"{abs(eff(E10R)-eff(E10)):.1f}")
rem = [r for r in BOTH if r.get("level") == "removed"]
ret = [r for r in BOTH if r.get("level") in ("negative", "prohibition")]
pct("TenRemoved", rate(rem)[0], rate(rem)[1]); pct("TenRetained", rate(ret)[0], rate(ret)[1])
chi, p = cmh(rem, ret, BOTH); put("TenCMH", f"{chi:.1f}"); put("TenCMHP", texp(p))
put("TenFluent", f"{eff(BOTH, syntax='fluent'):.1f}")
put("TenTelegraphic", f"{eff(BOTH, syntax='telegraphic'):.1f}")
# syntax contrast, reported as an estimate and never as "no effect"
tel = e10(BOTH, syntax="telegraphic"); flu = e10(BOTH, syntax="fluent")
put("TenSyntax", f"{100*(rate(tel)[2]-rate(flu)[2]):.1f}")
# the quantification bridge
br = [r for r in BOTH if r["cell"] == "bridge"]; fr_ = [r for r in BOTH if r["cell"] == "fluent/removed"]
pct("TenBridge", rate(br)[0], rate(br)[1]); pct("TenMatched", rate(fr_)[0], rate(fr_)[1])
put("TenBridgeDelta", f"{100*(rate(br)[2]-rate(fr_)[2]):.1f}")
# prohibition increment
neg = [r for r in BOTH if r.get("level") == "negative"]; pro = [r for r in BOTH if r.get("level") == "prohibition"]
pct("TenNegOnly", rate(neg)[0], rate(neg)[1]); pct("TenProhib", rate(pro)[0], rate(pro)[1])
put("TenProhibDelta", f"{100*(rate(neg)[2]-rate(pro)[2]):.1f}")
# heterogeneity, which sits next to the headline
per = {m: (eff(E10, model=m), eff(E10R, model=m)) for m in sorted({r["model"] for r in E10})}
put("TenPosPrimary", sum(1 for v in per.values() if v[0] > 0))
put("TenPosRepl", sum(1 for v in per.values() if v[1] > 0))
put("TenMinModel", f"{min(v[0] for v in per.values()):.1f}")
put("TenMaxModel", f"{max(v[0] for v in per.values()):.1f}")
top2 = sorted(per, key=lambda m: -per[m][0])[:2]
put("TenExTwoPrimary", f"{eff([r for r in E10 if r['model'] not in top2]):.1f}")
put("TenExTwoRepl", f"{eff([r for r in E10R if r['model'] not in top2]):.1f}")
FAMS = {r["family"] for r in BOTH if r.get("family")}
put("TenFamMin", f"{min(eff(BOTH, family=f) for f in FAMS):.1f}")
put("TenFamMax", f"{max(eff(BOTH, family=f) for f in FAMS):.1f}")
# the model whose direction changed across runs
flipped = [m for m in per if per[m][0]*per[m][1] < 0]
put("TenFlippedModel", flipped[0] if flipped else "none")
if flipped:
    put("TenFlippedPrimary", f"{per[flipped[0]][0]:.1f}"); put("TenFlippedRepl", f"{per[flipped[0]][1]:.1f}")
put("TenErr", len(glob.glob(os.path.join(ROOT, "runs/exp10/*.ERROR.json")))
            + len(glob.glob(os.path.join(ROOT, "runs/exp10-repl/*.ERROR.json"))))

# ---------------- write ------------------------------------------------------
NUMRE = __import__("re").compile("^-[0-9]+([.][0-9]+)?$")
def esc(v):
    """Negative numbers get a real minus sign, not a hyphen, in any context."""
    if isinstance(v, str) and NUMRE.match(v):
        return chr(92)+"ensuremath{" + v + "}"
    return str(v).replace("_", r"\_") if isinstance(v, str) else v
lines = ["% Generated by workshop/analysis/emit_macros710.py -- do not edit by hand.",
         "% Every value is recomputed from stored episode files in runs/.", ""]
for k in sorted(M):
    lines.append(rf"\newcommand{{\{k}}}{{{esc(M[k])}}}")
body = "\n".join(lines) + "\n"
for path in OUT:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(body)
print(f"{len(M)} macros -> " + ", ".join(os.path.relpath(p, ROOT) for p in OUT))
for k in ["SevenDelta","SevenCMH","EightHedgeVsPadded","EightCaveatVsPadded","NinePadVsHand",
          "TenPooled","TenFluent","TenTelegraphic","TenSyntax","TenBridgeDelta","TenProhibDelta",
          "TenExTwoPrimary","TenExTwoRepl","StabilityFlipPct","TenFlippedModel"]:
    print(f"   {k:22} {M.get(k)}")

# ---------------- figure data, emitted as pgfplots coordinate files ----------
FIG = [os.path.join(ROOT, "workshop/paper/figdata710.tex"),
       os.path.join(ROOT, "paper/figures/figdata710.tex")]
f = ["% Generated by emit_macros710.py -- coordinates recomputed from runs/.", ""]

# Experiment 8: five arms with Wilson intervals. The falsification is visible:
# hedge sits on padded, and the true caveat is far below both.
f.append(r"\newcommand{\EightArmCoords}{%")
lab8 = [("drift","silent deletion"),("padded","neutral clause"),("hedge","irrelevant hedge"),
        ("positive","positive note"),("true-caveat","true caveat")]
for arm, nm in lab8:
    k, n, p = rate(a8(arm)); lo, hi = wilson(k, n)
    f.append(rf"({nm},{100*p:.1f}) +- (0,{100*(hi-p):.1f}) -= (0,{100*(p-lo):.1f})")
f.append("}")
f.append(r"\newcommand{\EightArmLabels}{" + ",".join(nm for _, nm in lab8) + "}")

# Experiment 10: per-model constraint effect, primary and replication.
short = {"claude-opus-5":"Opus","claude-sonnet-5":"Sonnet","claude-haiku-4-5":"Haiku",
         "gpt-5.6-sol":"Sol","gpt-5.6-terra":"Terra","gpt-5.6-luna":"Luna"}
order = sorted(per, key=lambda m: per[m][0])
f.append(r"\newcommand{\TenModelLabels}{" + ",".join(short.get(m, m) for m in order) + "}")
for idx, which in [(0, "Primary"), (1, "Repl")]:
    f.append(rf"\newcommand{{\TenModel{which}Coords}}{{%")
    f.append(" ".join(f"({short.get(m,m)},{per[m][idx]:.1f})" for m in order))
    f.append("}")
f.append(rf"\newcommand{{\TenPooledLine}}{{{eff(BOTH):.1f}}}")
for path in FIG:
    open(path, "w").write("\n".join(f) + "\n")
print(f"figure data -> " + ", ".join(os.path.relpath(p, ROOT) for p in FIG))

# ---------------- Experiment 5: what eroded INSIDE the tested horizon --------
SC = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "workshop/runs/exp5-scores/**/*.json"), recursive=True)]
GENS = ["session_note", "consolidated", "resum_130", "resum_110", "resum_90", "resum_70"]
def qseries(pred):
    g = collections.defaultdict(lambda: [0, 0])
    for r in SC:
        if not pred(r): continue
        for j in r["judgments"]:
            g[j["version"]][0] += bool(j["states_qualifier"]); g[j["version"]][1] += 1
    return [(v, g[v][0], g[v][1]) for v in GENS if v in g]
tgt = qseries(lambda r: r["memory"] == "memory_73")
sco = qseries(lambda r: r["memory"] in ("memory_31", "memory_44", "memory_57"))
put("FiveTgtGenOnePct", round(100*tgt[0][1]/tgt[0][2])); put("FiveTgtGenSixPct", round(100*tgt[-1][1]/tgt[-1][2]))
put("FiveTgtGenSixK", tgt[-1][1]); put("FiveTgtGenSixN", tgt[-1][2])
put("FiveScopeGenOnePct", round(100*sco[0][1]/sco[0][2])); put("FiveScopeGenSixPct", round(100*sco[-1][1]/sco[-1][2]))
put("FiveScopeGenSixK", sco[-1][1]); put("FiveScopeGenSixN", sco[-1][2])
put("FiveTgtSeries", ", ".join(f"{round(100*k/n)}" for _, k, n in tgt))
# the two component predicates, on the stored chain bodies themselves
CH = [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, "workshop/runs/exp5-v2/**/*.json"), recursive=True)]
NUMRX = re.compile(r"-\s?\d+|churn|retention|retain|renewal", re.I)
PRORX = re.compile(r"avoid|skip|do not|don't|unsustainable|one-off|not a lever|guardrail|tactical|prioriti[sz]e", re.I)
gseries = collections.defaultdict(lambda: [0, 0, 0])
for c in CH:
    for i, g in enumerate(c.get("generations", [])):
        b = g.get("memory_73")
        if not b: continue
        gseries[i][0] += bool(NUMRX.search(b)); gseries[i][1] += bool(PRORX.search(b)); gseries[i][2] += 1
gk = sorted(gseries)
put("FiveNumSeries", ", ".join(f"{round(100*gseries[i][0]/gseries[i][2])}" for i in gk))
put("FiveProSeries", ", ".join(f"{round(100*gseries[i][1]/gseries[i][2])}" for i in gk))
put("FiveNumAllGens", f"{gseries[gk[0]][0]}/{gseries[gk[0]][2]}")
put("FiveProGenOneK", gseries[gk[0]][1]); put("FiveProGenSixK", gseries[gk[-1]][1])
put("FiveProGenN", gseries[gk[0]][2])
put("FiveScopeSeries", ", ".join(f"{round(100*k/n)}" for _, k, n in sco))
f2 = ["", r"\newcommand{\FiveErosionCoords}{%",
      " ".join(f"({i+1},{100*k/n:.1f})" for i, (_, k, n) in enumerate(tgt)), "}",
      r"\newcommand{\FiveScopeErosionCoords}{%",
      " ".join(f"({i+1},{100*k/n:.1f})" for i, (_, k, n) in enumerate(sco)), "}"]
for path in FIG:
    open(path, "a").write("\n".join(f2) + "\n")
# rewrite the macro file with the new keys included
lines = ["% Generated by workshop/analysis/emit_macros710.py -- do not edit by hand.",
         "% Every value is recomputed from stored episode files in runs/.", ""]
for k in sorted(M): lines.append(rf"\newcommand{{\{k}}}{{{esc(M[k])}}}")
for path in OUT: open(path, "w").write("\n".join(lines) + "\n")
print(f"final: {len(M)} macros")
for k in ["FiveTgtSeries","FiveScopeSeries","TenContrastN","NineKeepNeg","SevenNonePct","SevenKeptPct","EightAppendMin","EightAppendMax","TenFamMin","TenFamMax","NineNatVsIntact"]:
    print(f"   {k:20} {M.get(k)}")
