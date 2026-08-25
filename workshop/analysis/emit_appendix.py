"""
Emits the appendix tables of the canonical full paper straight from stored
episode files, into paper/generated/. No number in any appendix is hand-typed.

  python3 workshop/analysis/emit_appendix.py
"""
import json, glob, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "paper/generated")
os.makedirs(OUT, exist_ok=True)

def load(d):
    return [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, d), recursive=True) if "ERROR" not in f]

from fractions import Fraction
import decimal
def rnd1(x):
    """Round half away from zero on the EXACT value (x may be a Fraction), so
    +3.75 prints +3.8 in both runs rather than +3.8/+3.7 by float noise."""
    d = decimal.Decimal(x.numerator) / decimal.Decimal(x.denominator) if isinstance(x, Fraction) else decimal.Decimal(str(x))
    return d.quantize(decimal.Decimal("0.1"), rounding=decimal.ROUND_HALF_UP)

E7  = load("runs/exp7/*.json")
E10, E10R = load("runs/exp10/*.json"), load("runs/exp10-repl/*.json")
E9  = load("runs/exp9/*.json"); ES = load("runs/exp9-sens/*.json")
CH  = load("workshop/runs/exp5-v2/**/*.json")

def rate(S, f="verified_target"):
    k = sum(x["scored"][f] for x in S); return k, len(S), (100*k/len(S) if S else 0.0)

# ---- A1: Experiment 7 per model ------------------------------------------
rows = []
for m in sorted({r["model"] for r in E7}):
    s = lambda **kw: [x for x in E7 if x["model"] == m and all(x[a]==v for a,v in kw.items())]
    p = rate(s(plan="pricing", elicit="verifyonly")); o = rate(s(plan="onboarding", elicit="verifyonly"))
    n = rate(s(plan="none", elicit="verifyonly"))
    d = 100*(Fraction(p[0], p[1]) - Fraction(o[0], o[1]))
    rows.append(f"\\texttt{{{m}}} & {p[0]}/{p[1]} & {o[0]}/{o[1]} & {n[0]}/{n[1]} & ${rnd1(d):+}$ \\\\")
open(os.path.join(OUT, "tab-exp7-models.tex"), "w").write(
    "\\begin{tabular}{lcccc}\n\\toprule\nmodel & pricing & onboarding & no plan & $\\Delta$ \\\\\n\\midrule\n"
    + "\n".join(rows) + "\n\\bottomrule\n\\end{tabular}\n")

# ---- A2: Experiment 10 per model, exact quarters -------------------------
def eff(S, m):
    a = [x for x in S if x.get("level") == "removed" and x["model"] == m]
    b = [x for x in S if x.get("level") in ("negative","prohibition") and x["model"] == m]
    ka, kb = sum(x["scored"]["verified_target"] for x in a), sum(x["scored"]["verified_target"] for x in b)
    return 100*(Fraction(ka, len(a)) - Fraction(kb, len(b)))
rows = []
for m in sorted({r["model"] for r in E10}, key=lambda m: -eff(E10, m)):
    rows.append(f"\\texttt{{{m}}} & ${rnd1(eff(E10,m)):+}$ & ${rnd1(eff(E10R,m)):+}$ \\\\")
open(os.path.join(OUT, "tab-exp10-models.tex"), "w").write(
    "\\begin{tabular}{lcc}\n\\toprule\nmodel & primary & replication \\\\\n\\midrule\n"
    + "\n".join(rows) + "\n\\bottomrule\n\\end{tabular}\n")

# ---- A3: Experiment 9 arm table ------------------------------------------
rows = []
for arm, label in [("natural","natural (consolidated body)"), ("natural-padded","natural, padded to 129 chars"),
                   ("hand-drift","hand-stripped corruption"), ("intact","intact original")]:
    S = [x for x in E9 if x["arm"] == arm]
    v = rate(S); i = rate(S, "intent_target")
    L = [x["target_len"] for x in S]
    rows.append(f"{label} & {min(L)}--{max(L)} & {i[0]}/{i[1]} & {v[0]}/{v[1]} & {v[2]:.1f}\\% \\\\")
open(os.path.join(OUT, "tab-exp9-arms.tex"), "w").write(
    "\\begin{tabular}{lcccc}\n\\toprule\narm & body chars & plans risky action & verifies target & rate \\\\\n\\midrule\n"
    + "\n".join(rows) + "\n\\bottomrule\n\\end{tabular}\n")

# ---- A4: identical-prompt stability per model ----------------------------
key = lambda x: (x["model"], x["run"])
A = {key(r): r for r in E9 if r["arm"] == "natural-padded"}; B = {key(r): r for r in ES}
same = [k for k in set(A) & set(B) if A[k]["user_prompt"] == B[k]["user_prompt"]]
rows = []
for m in sorted({k[0] for k in same}):
    S = [k for k in same if k[0] == m]
    f = sum(1 for k in S if A[k]["scored"]["verified_target"] != B[k]["scored"]["verified_target"])
    rows.append(f"\\texttt{{{m}}} & {f}/{len(S)} & {100*f/len(S):.1f}\\% \\\\")
open(os.path.join(OUT, "tab-stability.tex"), "w").write(
    "\\begin{tabular}{lcc}\n\\toprule\nmodel & flips & rate \\\\\n\\midrule\n"
    + "\n".join(rows) + "\n\\bottomrule\n\\end{tabular}\n")

# ---- A5: consolidation examples, deterministic selection ------------------
bodies = sorted({c["generations"][-1]["memory_73"] for c in CH if c.get("generations")})
sel = bodies[:4]   # first four in lexicographic order: stated rule, no cherry-picking
esc = lambda s: s.replace("%", r"\%").replace("&", r"\&").replace("$", r"\$").replace("#", r"\#").replace("_", r"\_")
rows = [f"\\item[{len(b)} ch] \\texttt{{{esc(b)}}}" for b in sel]
open(os.path.join(OUT, "consolidation-examples.tex"), "w").write("\n".join(rows) + "\n")

print("generated:", ", ".join(sorted(os.listdir(OUT))))
