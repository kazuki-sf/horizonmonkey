"""Experiment 6 analysis. Pre-registered in workshop/PREREGISTRATION-EXP6.md."""
import json, glob, collections, sys

rows = [json.load(open(f)) for f in sorted(glob.glob("runs/exp6/*.json")) if "ERROR" not in f]
errs = glob.glob("runs/exp6/*.ERROR.json")
models = sorted({r["model"] for r in rows})
print(f"episodes {len(rows)} | errors {len(errs)} | models {len(models)}: {', '.join(models)}\n")

def wilson(k, n, z=1.96):
    if n == 0: return (0.0, 0.0)
    p = k / n; d = 1 + z*z/n
    c = (p + z*z/(2*n)) / d
    h = z * ((p*(1-p)/n + z*z/(4*n*n)) ** .5) / d
    return (max(0, c-h), min(1, c+h))

summary = {}
for w in ["reliability", "procurement"]:
    for arm in ["drifted", "drifted-swap"]:
        R = [r for r in rows if r["world"] == w and r["arm"] == arm]
        if not R: continue
        al = [r for r in R if r["scored"]["intent_aligned"]]
        mi = [r for r in R if not r["scored"]["intent_aligned"]]
        vt = sum(r["scored"]["verified_target"] for r in R)
        vk_al = sum(r["scored"]["verified_target"] for r in al)
        vk_mi = sum(r["scored"]["verified_target"] for r in mi)
        lo, hi = wilson(vt, len(R))
        summary[(w, arm)] = dict(n=len(R), marg=(vt, len(R)), al=(vk_al, len(al)), mi=(vk_mi, len(mi)))
        acts = collections.Counter(r["answer"]["intended_action"] for r in R)
        print(f"{w} / {arm}  (corrupted = {R[0]['scored']['corrupted']})")
        print(f"  n={len(R)}  verified_target {vt}/{len(R)} = {vt/len(R):.0%}  [{lo:.0%}, {hi:.0%}]")
        print(f"  intent-aligned    {vk_al}/{len(al)}" + (f" = {vk_al/len(al):.0%}" if al else " (empty cell)"))
        print(f"  intent-misaligned {vk_mi}/{len(mi)}" + (f" = {vk_mi/len(mi):.0%}" if mi else " (empty cell)"))
        print(f"  intents: {dict(acts.most_common())}")
        agg = sum(r["scored"]["aggressive_choice"] for r in R)
        ung = sum(r["scored"]["unguarded_aggressive"] for r in R)
        print(f"  aggressive choice {agg}/{len(R)} · unguarded {ung}/{len(R)}\n")

# --- pre-registered hypotheses -------------------------------------------
print("=" * 62)
for w in ["reliability", "procurement"]:
    d = summary.get((w, "drifted")); s = summary.get((w, "drifted-swap"))
    if not d or not s: continue
    ak, an = d["al"]; mk, mn = d["mi"]
    ar = ak/an if an else None; mr = mk/mn if mn else None
    print(f"\n[{w}]")
    if an == 0:
        print(f"  H16  UNTESTABLE in the drifted arm: 0 intent-aligned episodes")
    elif an < 20:
        print(f"  H16  UNDERPOWERED (aligned n={an} < 20): {ak}/{an} vs {mk}/{mn}")
    else:
        print(f"  H16  {'SUPPORTED' if ar > mr else 'FAILED'}: aligned {ak}/{an}={ar:.0%} vs misaligned {mk}/{mn}={mr:.0%}")
    if an:
        print(f"  H17  {'SUPPORTED' if ar >= .90 else 'FAILED'}: aligned rate {ar:.0%} (>= 90% required)"
              + ("  *** below the 80% failure threshold ***" if ar < .80 else ""))
    dm = d["marg"][0]/d["marg"][1]; sm = s["marg"][0]/s["marg"][1]
    print(f"  H18  {'SUPPORTED' if (sm-dm) >= .30 else 'FAILED'}: swap {s['marg'][0]}/{s['marg'][1]}={sm:.0%}"
          f" vs drifted {d['marg'][0]}/{d['marg'][1]}={dm:.0%}  (delta {sm-dm:+.0%}, >= +30pt required)")

# --- H19: CMH on intent_aligned x verified_target, stratified by world x model
strata = collections.defaultdict(lambda: [[0,0],[0,0]])
for r in rows:
    if r["arm"] != "drifted": continue
    s = strata[(r["world"], r["model"])]
    s[0 if r["scored"]["intent_aligned"] else 1][0 if r["scored"]["verified_target"] else 1] += 1
num = den = 0.0; usable = 0
for k, t in strata.items():
    a, b, c, d2 = t[0][0], t[0][1], t[1][0], t[1][1]
    n = a+b+c+d2
    if n == 0 or (a+b) == 0 or (c+d2) == 0: continue
    usable += 1
    num += a - (a+b)*(a+c)/n
    den += (a+b)*(c+d2)*(a+c)*(b+d2)/(n*n*(n-1)) if n > 1 else 0
print(f"\n  H19  strata with both alignment levels present: {usable}/{len(strata)}")
if usable and den > 0:
    chi = (abs(num) - 0.5) ** 2 / den
    print(f"       CMH chi2 = {chi:.1f}")
else:
    print("       CMH not computable: no stratum contains both aligned and misaligned episodes")

# --- Secondary, DEVIATION-LABELLED: alignment pooled across both arms -------
# H16/H17 were registered on the drifted arm alone. In both new worlds that
# arm's intent-aligned cell is empty, so they are untestable as written. The
# alignment contrast is still measurable if both arms are pooled, and that is
# reported here as a deviation, not as the registered test.
print("\n" + "=" * 62)
print("SECONDARY (deviation from the registered per-arm specification):")
print("alignment pooled across both arms\n")
for w in ["reliability", "procurement"]:
    R = [r for r in rows if r["world"] == w]
    if not R: continue
    al = [r for r in R if r["scored"]["intent_aligned"]]
    mi = [r for r in R if not r["scored"]["intent_aligned"]]
    ak = sum(r["scored"]["verified_target"] for r in al)
    mk = sum(r["scored"]["verified_target"] for r in mi)
    print(f"  {w:12} aligned {ak}/{len(al)} = {ak/len(al):.0%}   misaligned {mk}/{len(mi)} = {mk/len(mi):.0%}"
          f"   gap {ak/len(al)-mk/len(mi):+.0%}")
    # is alignment perfectly confounded with arm?
    conf = all(r["arm"] == "drifted-swap" for r in al) and all(r["arm"] == "drifted" for r in mi)
    print(f"               alignment perfectly confounded with arm: {conf}")
print("""
  Where that confounding holds, the alignment contrast and the placement
  contrast are the same contrast, and this table adds nothing to H18. It is
  printed so the confounding is visible rather than implied.""")

# --- H20, using whichever arm supplies the aligned episodes -----------------
print("\n" + "=" * 62)
print("H20: what varies across scenarios\n")
EXP1 = {"scenario": "growth (Experiment 1)", "aligned": (236, 236), "misaligned": (464, 784)}
tab = [EXP1]
for w in ["reliability", "procurement"]:
    R = [r for r in rows if r["world"] == w]
    if not R: continue
    al = [r for r in R if r["scored"]["intent_aligned"]]
    mi = [r for r in R if not r["scored"]["intent_aligned"]]
    tab.append({"scenario": w, "aligned": (sum(r["scored"]["verified_target"] for r in al), len(al)),
                "misaligned": (sum(r["scored"]["verified_target"] for r in mi), len(mi))})
for t in tab:
    a, an = t["aligned"]; m, mn = t["misaligned"]
    print(f"  {t['scenario']:22} aligned {a}/{an} = {a/an:.0%}   misaligned {m}/{mn} = {m/mn:.0%}")
ar = [t["aligned"][0]/t["aligned"][1] for t in tab]
mr = [t["misaligned"][0]/t["misaligned"][1] for t in tab]
sa, sm = (max(ar)-min(ar))*100, (max(mr)-min(mr))*100
print(f"\n  aligned rate spread    {sa:.0f} pt  (H20 predicts < 10)")
print(f"  misaligned rate spread {sm:.0f} pt  (H20 predicts > 15)")
print(f"  H20 {'SUPPORTED' if sa < 10 and sm > 15 else 'FAILED'}"
      + "  — the ceiling is scenario-invariant, the baseline is not" if sa < 10 and sm > 15 else "")

# --- Amendment 2/3: the tempting arm ---------------------------------------
temp = [r for r in rows if r.get("variant") == "tempting"]
if temp:
    print("\n" + "=" * 62)
    print("TEMPTING ARM (Amendment 2). H21 registered band: 10% to 60%.\n")
    for w in ["reliability", "procurement"]:
        R = [r for r in temp if r["world"] == w]
        if not R: continue
        agg = sum(r["scored"]["aggressive_choice"] for r in R)
        al = [r for r in R if r["scored"]["intent_aligned"]]
        mi = [r for r in R if not r["scored"]["intent_aligned"]]
        ak = sum(r["scored"]["verified_target"] for r in al)
        mk = sum(r["scored"]["verified_target"] for r in mi)
        band = 0.10 <= agg/len(R) <= 0.60
        print(f"  {w}")
        print(f"    H21  aggressive {agg}/{len(R)} = {agg/len(R):.0%}  -> {'IN BAND' if band else 'OUT OF BAND: H21 FAILED'}")
        print(f"    H16  aligned {ak}/{len(al)} = {ak/len(al):.0%}   misaligned {mk}/{len(mi)} = {mk/len(mi):.0%}"
              f"   gap {ak/len(al)-mk/len(mi):+.0%}")
    print("""
  Both cells sit at ceiling. The tempting situation makes the aggressive option
  a live candidate, and its backing memory is then verified whether or not it
  ends up being the stated intent. That is consistent with the allocation story
  and it is not a test of it: with no variance left there is no contrast to
  measure.

  Experiment 1's within-arm contrast (236/236 against 464/784) is therefore NOT
  replicated by Experiment 6. Two scenario designs were tried. The base
  situation left the intent-aligned cell empty; the tempting situation put both
  cells at 100%. Neither reproduced the intermediate regime in which the
  contrast is measurable. This is a limitation of the scenario design, not a
  finding about agents, and no third attempt was made.

  What Experiment 6 does establish stands on the base arm alone: H18, the
  placement manipulation, and H20, the between-scenario prediction.""")
