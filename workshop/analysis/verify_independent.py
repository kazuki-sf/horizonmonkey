"""Recompute the paper's headline numbers from the raw files by a different
route than emit_macros.py, and assert they agree. Catches a bug in the
generator itself, which macro-driven writing cannot."""
import json, glob, re, sys

M = dict(re.findall(r"\\newcommand\{\\([A-Za-z]+)\}\{([^}]*)\}",
                    open("workshop/paper/macros.tex").read()))
fails = []
def check(name, got, why):
    want = M.get(name)
    ok = str(want) == str(got)
    print(f"  {'OK  ' if ok else 'FAIL'} {name:<22} paper={want!r:>12}  recomputed={str(got)!r:>12}   {why}")
    if not ok: fails.append(name)

# --- Study 1: separation, counted with an independent walk over files --------
BACK = {"simplify_onboarding":{"memory_31","memory_86"},"promotional_pricing":{"memory_73"},
        "referral_incentive":{"memory_57"},"activation_messaging":{"memory_91"},
        "enterprise_sales_assist":{"memory_44"}}
n_al = v_al = n_mis = v_mis = 0
for f in glob.glob("runs/paper/paper-v1/**/*.json", recursive=True):
    e = json.load(open(f))
    aligned = e["target"] in BACK.get(e["first"]["intended_action"], set())
    ver = e["scores"]["verified_target"]
    if aligned: n_al += 1; v_al += ver
    else:       n_mis += 1; v_mis += ver
check("AlignedK", v_al, "intent-aligned & verified")
check("AlignedN", n_al, "intent-aligned total")
check("MisK", v_mis, "misaligned & verified")
check("MisN", n_mis, "misaligned total")
check("ExpOneN", n_al + n_mis, "all Study-1 episodes")

# --- Study 2b: recount from the answer field, not the stored score -----------
kt = nt = kc = nc = 0
for f in glob.glob("workshop/runs/exp3b-v1/**/*.json", recursive=True):
    e = json.load(open(f))
    priced = e["answer"]["intended_action"] == "promotional_pricing"
    if "memory_73" in e["carried"]: nt += 1; kt += priced
    else:                            nc += 1; kc += priced
check("ThreeBTgtK", kt, "carried target & priced (from answer, not scores)")
check("ThreeBTgtN", nt, "carried target total")
check("ThreeBOthK", kc, "carried other & priced")
check("ThreeBOthN", nc, "carried other total")
check("ThreeBDiff", f"{100*(kc/nc - kt/nt):.0f}", "risk difference")

# --- Study 3: recount from spent, not from scores.verified_73 ---------------
for arm, tag in (("drifted","Drift"),("clean-neutral","Neut"),("clean-negative","Neg"),("clean-positive","Pos")):
    k = n = 0
    for f in glob.glob("workshop/runs/exp4-v1/**/*.json", recursive=True):
        e = json.load(open(f))
        if e["arm"] != arm: continue
        if e["first"]["intended_action"] == "promotional_pricing": continue   # intent-misaligned stratum
        n += 1; k += "memory_73" in e["spent"]
    check(f"Four{tag}K", k, f"{arm}: verified, recomputed from spent")
    check(f"Four{tag}N", n, f"{arm}: intent-misaligned total")

# --- Study 4: recount survival from the judgment array ----------------------
k = n = 0
for f in glob.glob("workshop/runs/exp5-scores/**/*.json", recursive=True):
    s = json.load(open(f))
    if s["memory"] != "memory_73": continue
    for j in s["judgments"]:
        if j["version"] == "resum_70": n += 1; k += bool(j["states_qualifier"])
check("FiveNegResDPct", f"{100*k/n:.0f}", "negative-outcome survival at 70 chars")

# --- the false-positive control has to be exactly zero ----------------------
fp = tot = 0
for f in glob.glob("workshop/runs/exp5-scores/**/*.json", recursive=True):
    s = json.load(open(f))
    if s["memory"] not in ("memory_86","memory_91"): continue
    for j in s["judgments"]: tot += 1; fp += bool(j["states_qualifier"])
check("FiveFalsePosAll", f"{fp}/{tot}", "scorer false positives on unqualified records")

print()
if fails: print(f"{len(fails)} MISMATCH(ES): {fails}"); sys.exit(1)
print("all headline numbers reproduce by an independent route")
