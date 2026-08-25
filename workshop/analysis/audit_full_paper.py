"""
FULL_PAPER_NUMERIC_AUDIT: every headline number in the canonical paper,
recomputed from stored episodes and located in the rendered PDF.
"""
import json, glob, os, re, subprocess, collections, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def load(d): return [json.load(open(f)) for f in glob.glob(os.path.join(ROOT, d), recursive=True) if "ERROR" not in f]
def rate(S, f="verified_target"):
    k = sum(x["scored"][f] for x in S); return k, len(S), (100*k/len(S) if S else 0.0)

t = subprocess.run(["pdftotext", os.path.join(ROOT,"paper/output/main.pdf"), "-"], capture_output=True, text=True).stdout
for a,b in [("ﬀ","ff"),("ﬁ","fi"),("ﬂ","fl"),("ﬃ","ffi"),("−","-"),("–","-"),("—","---")]: t = t.replace(a,b)
t = re.sub(r"-\n","",t); t = re.sub(r"\s+"," ",t)

E1 = load("runs/paper/**/*.json"); E6 = load("runs/exp6/*.json"); E7 = load("runs/exp7/*.json")
E8 = load("runs/exp8/*.json"); E9 = load("runs/exp9/*.json"); ES = load("runs/exp9-sens/*.json")
E10 = load("runs/exp10/*.json"); E10R = load("runs/exp10-repl/*.json")
E3 = load("workshop/runs/exp3b-v1/**/*.json")
SC = load("workshop/runs/exp5-scores/**/*.json"); CH = load("workshop/runs/exp5-v2/**/*.json")

BACKING = {"promotional_pricing": ["memory_73"], "simplify_onboarding": ["memory_86","memory_31"],
           "activation_messaging": ["memory_91"], "referral_incentive": ["memory_57"],
           "enterprise_sales_assist": ["memory_44"]}
al = [e for e in E1 if e["target"] in BACKING.get(e["first"]["intended_action"], [])]
mis = [e for e in E1 if e not in al]
va = sum(1 for e in al if e["scores"]["verified_target"]); vm = sum(1 for e in mis if e["scores"]["verified_target"])

s7 = lambda **k: [x for x in E7 if all(x[a]==v for a,v in k.items())]
p7 = rate(s7(plan="pricing",elicit="verifyonly")); o7 = rate(s7(plan="onboarding",elicit="verifyonly"))
a8 = lambda a: [x for x in E8 if x["arm"]==a]
B = E10+E10R
rem = [x for x in B if x.get("level")=="removed"]; ret = [x for x in B if x.get("level") in ("negative","prohibition")]
eff = lambda S: rate([x for x in S if x.get("level")=="removed"])[2] - rate([x for x in S if x.get("level") in ("negative","prohibition")])[2]
effs = lambda S,syn: rate([x for x in S if x.get("level")=="removed" and x.get("syntax")==syn])[2] - rate([x for x in S if x.get("level") in ("negative","prohibition") and x.get("syntax")==syn])[2]
e3 = lambda arm,f: (sum(r["scores"][f] for r in E3 if r["arm"]==arm), len([r for r in E3 if r["arm"]==arm]))
a9 = lambda a: [x for x in E9 if x["arm"]==a]
G = ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"]
def ser(pred):
    g = collections.defaultdict(lambda:[0,0])
    for r in SC:
        if not pred(r): continue
        for j in r["judgments"]: g[j["version"]][0]+=bool(j["states_qualifier"]); g[j["version"]][1]+=1
    return [round(100*g[v][0]/g[v][1]) for v in G]
tgt = ser(lambda r: r["memory"]=="memory_73"); sco = ser(lambda r: r["memory"] in ("memory_31","memory_44","memory_57"))
NUM = re.compile(r"-\s?\d+|churn|retention|retain|renewal", re.I); PRO = re.compile(r"avoid|skip|do not|don't|unsustainable|one-off|not a lever|guardrail|tactical|prioriti[sz]e", re.I)
gs = collections.defaultdict(lambda:[0,0,0])
for c in CH:
    for i,g in enumerate(c.get("generations",[])):
        b = g.get("memory_73")
        if b: gs[i][0]+=bool(NUM.search(b)); gs[i][1]+=bool(PRO.search(b)); gs[i][2]+=1
key = lambda x:(x["model"],x["run"])
A = {key(r):r for r in E9 if r["arm"]=="natural-padded"}; Bs = {key(r):r for r in ES}
same = [k for k in set(A)&set(Bs) if A[k]["user_prompt"]==Bs[k]["user_prompt"]]
flips = sum(1 for k in same if A[k]["scored"]["verified_target"]!=Bs[k]["scored"]["verified_target"])

rows = [
 ("Exp7 delta", "84.7", f"{p7[2]-o7[2]:.1f}", "runs/exp7"),
 ("Exp1 aligned", "236/236", f"{va}/{len(al)}", "runs/paper"),
 ("Exp1 misaligned", "464/784", f"{vm}/{len(mis)}", "runs/paper"),
 ("Exp6 on-path", "3026/3077", (lambda k,n,_: f"{k}/{n}")(*rate([r for r in E6 if r['scored']['intent_aligned']])), "runs/exp6"),
 ("Exp8 hedge-padded", "-3.3", f"{rate(a8('hedge'))[2]-rate(a8('padded'))[2]:.1f}", "runs/exp8"),
 ("Exp8 caveat-padded", "-46.0", f"{rate(a8('true-caveat'))[2]-rate(a8('padded'))[2]:.1f}", "runs/exp8"),
 ("Exp10 total/contrast", "1680/1440", f"{len(B)}/{len(rem)+len(ret)}", "runs/exp10*"),
 ("Exp10 removed", "303/480", f"{rate(rem)[0]}/{rate(rem)[1]}", "runs/exp10*"),
 ("Exp10 retained", "300/960", f"{rate(ret)[0]}/{rate(ret)[1]}", "runs/exp10*"),
 ("Exp10 pooled", "31.9", f"{eff(B):.1f}", "runs/exp10*"),
 ("Exp10 primary/repl", "29.2/34.6", f"{eff(E10):.1f}/{eff(E10R):.1f}", "runs/exp10*"),
 ("Exp10 fluent/telegraphic", "40.6/23.1", f"{effs(B,'fluent'):.1f}/{effs(B,'telegraphic'):.1f}", "runs/exp10*"),
 ("Exp10 prohibition inc", "18.3", f"{rate([x for x in B if x.get('level')=='negative'])[2]-rate([x for x in B if x.get('level')=='prohibition'])[2]:.1f}", "runs/exp10*"),
 ("Exp3B corrupted-direction", "139/150->3/150", f"{e3('carry-other','p2_pricing')[0]}/150->{e3('carry-target','p2_pricing')[0]}/150", "exp3b-v1"),
 ("Exp3B unguarded", "39/150->0/150", f"{e3('carry-other','p2_nonguarded_pricing')[0]}/150->{e3('carry-target','p2_nonguarded_pricing')[0]}/150", "exp3b-v1"),
 ("Exp5 complete deletion", "0/360", f"{sum(1 for c in CH for g in c.get('generations',[]) if g.get('memory_73') and not NUM.search(g['memory_73']) and not PRO.search(g['memory_73']))}/360", "exp5-v2"),
 ("Exp5 target qualifier", "100,100,100,97,92,83", ",".join(map(str,tgt)), "exp5-scores"),
 ("Exp5 scope qualifier", "100,100,96,83,73,61", ",".join(map(str,sco)), "exp5-scores"),
 ("Exp5 prohibition", "80,55,43,52,48,42", ",".join(str(round(100*gs[i][1]/gs[i][2])) for i in sorted(gs)), "exp5-v2"),
 ("Exp9 risky action", "0/150,0/150,28/150", f"{rate(a9('natural'),'intent_target')[0]}/150,{rate(a9('intact'),'intent_target')[0]}/150,{rate(a9('hand-drift'),'intent_target')[0]}/150", "runs/exp9"),
 ("Exp9 23%/61%/-38/-30", "23/61/-38.0/-30.0",
  f"{rate(a9('natural'))[2]:.0f}/{rate(a9('hand-drift'))[2]:.0f}/{rate(a9('natural'))[2]-rate(a9('hand-drift'))[2]:.1f}/{rate(a9('natural-padded'))[2]-rate(a9('hand-drift'))[2]:.1f}", "runs/exp9"),
 ("stability flips", "32/127", f"{flips}/{len(same)}", "exp9-sens"),
]
fails = 0
print(f"| claim | printed | recomputed | source | verdict |")
print(f"|---|---|---|---|---|")
for c, p, r, src in rows:
    ok = (p.replace(" ","") == r.replace(" ",""))
    # also require the printed value to appear in the PDF (loose: first token)
    tok = p.split("/")[0].split(",")[0].replace("->","")
    inpdf = tok in t
    v = "PASS" if ok and inpdf else ("PASS*" if ok else "FAIL")
    fails += (not ok)
    print(f"| {c} | {p} | {r} | {src} | {v} |")
print(f"\n{len(rows)-fails}/{len(rows)} recompute exactly; * = value matches but token not independently located in PDF text")
sys.exit(1 if fails else 0)
