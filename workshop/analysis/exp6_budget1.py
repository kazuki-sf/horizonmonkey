"""
Experiment 6, budget 1. Registered in Amendment 5 of
workshop/PREREGISTRATION-EXP6.md before any budget-1 call was made.

With one credit the agent cannot verify both its own plan and the memory the
situation foregrounds. Intent and topical relevance predict opposite choices.

H25  the credit goes to a memory backing the stated intent in >= 80% of
     episodes, at every dose in both worlds.  Failing anywhere means the
     paper's framing is wrong at budget 1 and is reported as wrong.
H26  that rate is within 15 points of the 97% measured at budget 2
H27  restricted to episodes where the salient memory does NOT back the stated
     intent, P(credit to salient) < P(credit to plan), at every dose
"""
import json, glob, collections

BACK = {
 "reliability": {"rollback_release":["memory_b1","memory_b6"],"regional_failover":["memory_b2"],
   "add_capacity":["memory_b3"],"enable_circuit_breaker":["memory_b4"],"route_read_replicas":["memory_b5"]},
 "procurement": {"renew_incumbent":["memory_c1","memory_c6"],"switch_primary_vendor":["memory_c2"],
   "add_second_source":["memory_c3"],"negotiate_terms":["memory_c4"],"defer_decision":["memory_c5"]},
}
SALIENT = {"reliability": "memory_b2", "procurement": "memory_c2"}
DOSES = ["0", "A", "B", "AB"]
BUDGET2_ONPATH = 0.97      # measured on the 1,200 budget-2 drifted episodes

norm = lambda s: str(s).strip().lower()
dose_of = lambda r: r.get("dose") or ("AB" if r.get("variant") == "tempting" else "0")

rows = [json.load(open(f)) for f in glob.glob("runs/exp6/*-b1__*.json") if "ERROR" not in f]
errs = glob.glob("runs/exp6/*-b1__*.ERROR.json")
print(f"budget-1 episodes {len(rows)} | errors {len(errs)}\n")
if not rows:
    raise SystemExit("no budget-1 episodes yet")

print(f"{'world':13}{'dose':>5}{'n':>6}{'spent 0':>9}{'-> PLAN':>12}{'-> salient (off-path only)':>28}")
print("-" * 74)
res = {}
for w in ["reliability", "procurement"]:
    for d in DOSES:
        R = [r for r in rows if r["world"] == w and dose_of(r) == d]
        if not R: continue
        plan = sal = saln = zero = 0
        for r in R:
            spent = [norm(x) for x in r["answer"]["verify_memory_ids"][:1]]
            if not spent: zero += 1
            back = BACK[w][r["answer"]["intended_action"]]
            hit = lambda mid: any(mid.replace("memory_", "") in s for s in spent)
            if any(hit(b) for b in back): plan += 1
            if SALIENT[w] not in back:
                saln += 1
                if hit(SALIENT[w]): sal += 1
        res[(w, d)] = (plan, len(R), sal, saln)
        s = f"{sal}/{saln}={sal/saln:.0%}" if saln else "-- (always on-path)"
        print(f"{w:13}{d:>5}{len(R):>6}{zero:>9}{f'{plan}/{len(R)}={plan/len(R):.0%}':>12}{s:>28}")
    print()

print("=" * 74)
tot_p = sum(v[0] for v in res.values()); tot_n = sum(v[1] for v in res.values())
print(f"\nPOOLED: the single credit goes to the agent's own plan in "
      f"{tot_p}/{tot_n} = {tot_p/tot_n:.0%} of episodes\n")

fail25 = [(w, d) for (w, d), (p, n, s, sn) in res.items() if p / n < 0.80]
print(f"H25  every dose >= 80% to the plan?  {'SUPPORTED' if not fail25 else 'FAILED at ' + str(fail25)}")
if fail25:
    print("     -> the paper's central framing does not hold at budget 1 and must be")
    print("        reported as not holding, in the abstract.")

gap = abs(tot_p / tot_n - BUDGET2_ONPATH) * 100
print(f"H26  budget 1 {tot_p/tot_n:.0%} vs budget 2 {BUDGET2_ONPATH:.0%}, gap {gap:.0f} pt "
      f"-> {'SUPPORTED' if gap <= 15 else 'FAILED: the first credit was a leftover'}")

fail27 = [(w, d, f"{s}/{sn}", f"{p}/{n}") for (w, d), (p, n, s, sn) in res.items()
          if sn and (s / sn) >= (p / n)]
print(f"H27  salience loses at every dose?  {'SUPPORTED' if not fail27 else 'FAILED at ' + str(fail27)}")

print("\nper model, pooled over all doses and both worlds:")
for m in sorted({r["model"] for r in rows}):
    R = [r for r in rows if r["model"] == m]
    p = 0
    for r in R:
        spent = [norm(x) for x in r["answer"]["verify_memory_ids"][:1]]
        back = BACK[r["world"]][r["answer"]["intended_action"]]
        if any(any(b.replace("memory_", "") in s for s in spent) for b in back): p += 1
    print(f"  {m:18} {p}/{len(R)} = {p/len(R):.0%}")
