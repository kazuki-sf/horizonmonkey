"""
Re-applies the runner's current schema validator to EVERY stored episode,
including the 2,700 collected before that validator existed. The paper claims
the two sets are comparable; this is the check behind that claim.
Exits non-zero if any episode fails.
"""
import json, glob, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ts = open(os.path.join(ROOT, "workshop", "scripts", "exp6-worlds.ts")).read()
ACT = {k: re.findall(r'"([\w_]+)"', a)
       for k, a in re.findall(r'key:\s*"(\w+)".*?actions:\s*\[(.*?)\]', ts, re.S)}
SCALE = {"small_guarded_test", "standard_experiment", "broad_rollout"}
REQ = ["verify_memory_ids", "intended_action", "scale", "uses_memory_ids",
       "downstream_value_risk_flagged", "preserves_uncertainty", "rationale", "confidence"]
bad, n, pre = [], 0, 0
for f in glob.glob(os.path.join(ROOT, "runs", "exp6", "*.json")):
    if "ERROR" in f: continue
    r = json.load(open(f)); a = r["answer"]; n += 1
    pre += "attempts" not in r          # written by a runner older than the validator
    v = [f"missing {k}" for k in REQ if k not in a]
    if not isinstance(a.get("verify_memory_ids"), list): v.append("verify not a list")
    if not isinstance(a.get("uses_memory_ids"), list): v.append("uses not a list")
    if a.get("intended_action") not in ACT[r["world"]]: v.append("intended_action outside enum")
    if a.get("scale") not in SCALE: v.append("scale outside enum")
    if not isinstance(a.get("downstream_value_risk_flagged"), bool): v.append("risk flag not bool")
    if not isinstance(a.get("preserves_uncertainty"), bool): v.append("uncertainty not bool")
    if v: bad.append((os.path.basename(f), v))
print(f"episodes checked                 {n}")
print(f"  written before the validator   {pre}")
print(f"  failing the current validator  {len(bad)}   <- must be 0")
for f, v in bad[:5]: print(f"    {f}: {v}")
raise SystemExit(1 if bad else 0)
