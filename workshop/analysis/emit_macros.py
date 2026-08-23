"""Every number in the workshop paper, emitted as LaTeX macros from the raw
episode files. The paper never hard-codes a number; if the data changes the
paper changes. Mirrors paper/analyze.py's policy for the arXiv manuscript."""
import json, glob, os, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from stats import wilson, cmh, cmh_chi2, cmh_str, fisher, wald_iv_bootstrap

M = {}
def mac(k, v): M[k] = v
def ptex(p):
    if p is None: return "n/a"
    if p >= 0.001: return f"{p:.3f}".rstrip("0").rstrip(".")
    e = math.floor(math.log10(p)); m = p/10**e
    return f"{m:.1f}\\times 10^{{{e}}}"
def cmhtex(strata):
    chi = cmh_chi2(strata)
    if chi is None: return "n/a"
    p = cmh(strata)
    if p and p > 0: return ptex(p)
    z = math.sqrt(chi)
    lg = (math.log(2) - z*z/2 - math.log(z) - 0.5*math.log(2*math.pi))/math.log(10)
    return f"<10^{{{math.ceil(lg)}}}"

MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]
BACKING = {"simplify_onboarding":["memory_31","memory_86"],"promotional_pricing":["memory_73"],
           "referral_incentive":["memory_57"],"activation_messaging":["memory_91"],"enterprise_sales_assist":["memory_44"]}
load = lambda p: [json.load(open(f)) for f in glob.glob(p, recursive=True)]

# ---- Experiment 1 (published data, re-analysed) ---------------------------
E1 = load("runs/paper/paper-v1/**/*.json")
mac("ExpOneN", len(E1))
al = [e for e in E1 if e["target"] in BACKING.get(e["first"]["intended_action"], [])]
mis = [e for e in E1 if e not in al]
va = sum(1 for e in al if e["scores"]["verified_target"]); vm = sum(1 for e in mis if e["scores"]["verified_target"])
mac("AlignedK", va); mac("AlignedN", len(al)); mac("MisK", vm); mac("MisN", len(mis))
mac("MisPct", f"{100*vm/len(mis):.0f}")

# ---- Experiment 3A --------------------------------------------------------
A = load("workshop/runs/exp3a-v1/**/*.json")
mac("ThreeAN", len(A))
cell = lambda r: (sum(1 for e in r if e["scores"]["p2_pricing"]), len(r))
st_out, bym = [], {}
for m in MODELS:
    d = [e for e in A if e["model"]==m and e["condition"]=="drifted"]
    t = [e for e in A if e["model"]==m and e["condition"]=="drifted-triage"]
    if not d or not t: continue
    kd,nd = cell(d); kt,nt = cell(t)
    st_out.append((kt,nt,kd,nd))
    md = sum(1 for e in d if e["verified_73_in_phase1"]); mt = sum(1 for e in t if e["verified_73_in_phase1"])
    bym[m] = (kt,nt,kd,nd,mt,md)
for c,tag in (("drifted","Dr"),("drifted-triage","Tr"),("clean","Cl")):
    k,n = cell([e for e in A if e["condition"]==c])
    mac(f"ThreeA{tag}K", k); mac(f"ThreeA{tag}N", n); mac(f"ThreeA{tag}Pct", f"{100*k/n:.0f}" if n else "0")
mac("ThreeACMH", cmhtex(st_out))
for lab,f_ in (("Rec", lambda e: e["verified_73_in_phase1"]), ("Unrec", lambda e: not e["verified_73_in_phase1"])):
    st=[]
    for m in MODELS:
        d=[e for e in A if e["model"]==m and e["condition"]=="drifted" and f_(e)]
        t=[e for e in A if e["model"]==m and e["condition"]=="drifted-triage" and f_(e)]
        if d and t: st.append((*cell(t)[::-1][::-1], *cell(d)))
    d=[e for e in A if e["condition"]=="drifted" and f_(e)]; t=[e for e in A if e["condition"]=="drifted-triage" and f_(e)]
    kd,nd=cell(d); kt,nt=cell(t)
    mac(f"ThreeA{lab}DrK",kd); mac(f"ThreeA{lab}DrN",nd); mac(f"ThreeA{lab}TrK",kt); mac(f"ThreeA{lab}TrN",nt)
    if nd: mac(f"ThreeA{lab}DrPctText", f"{100*kd/nd:.0f}")
    if nt: mac(f"ThreeA{lab}TrPctText", f"{100*kt/nt:.0f}")
    if st: mac(f"ThreeA{lab}CMH", cmhtex(st))
if len(bym)==len(MODELS):
    est,lo,hi,dY,dM = wald_iv_bootstrap(bym)
    mac("IVEst", f"{est:.2f}"); mac("IVLo", f"{lo:.2f}"); mac("IVHi", f"{hi:.2f}")
    mac("IVdY", f"{dY:.3f}"); mac("IVdM", f"{dM:.3f}")
o = sum(1 for e in A if e["original_p2_action"]=="promotional_pricing")
mac("ThreeAOrigPct", f"{100*o/len(A):.0f}" if A else "0")

# ---- Experiment 3B --------------------------------------------------------
B = load("workshop/runs/exp3b-v1/**/*.json")
mac("ThreeBN", len(B))
st=[]
for m in MODELS:
    ct=[e for e in B if e["model"]==m and e["arm"]=="carry-target"]; co=[e for e in B if e["model"]==m and e["arm"]=="carry-other"]
    if ct and co: st.append((*cell(ct), *cell(co)))
kt,nt = cell([e for e in B if e["arm"]=="carry-target"]); kc,nc = cell([e for e in B if e["arm"]=="carry-other"])
mac("ThreeBTgtK",kt); mac("ThreeBTgtN",nt); mac("ThreeBOthK",kc); mac("ThreeBOthN",nc)
mac("ThreeBTgtPct", f"{100*kt/nt:.0f}" if nt else "0"); mac("ThreeBOthPct", f"{100*kc/nc:.0f}" if nc else "0")
mac("ThreeBDiff", f"{100*(kc/nc - kt/nt):.0f}" if nt and nc else "0")
mac("ThreeBCMH", cmhtex(st)); mac("ThreeBChi", f"{cmh_chi2(st):.0f}" if st else "0")
mac("ThreeBAllModels", str(sum(1 for m in MODELS
    if cell([e for e in B if e["model"]==m and e["arm"]=="carry-target"])[0]
     < cell([e for e in B if e["model"]==m and e["arm"]=="carry-other"])[0])))

# ---- Experiment 4 ---------------------------------------------------------
C = load("workshop/runs/exp4-v1/**/*.json")
mac("FourN", len(C))
v = lambda r: (sum(1 for e in r if e["scores"]["verified_73"]), len(r))
TAG = {"drifted":"Drift","clean-positive":"Pos","clean-neutral":"Neut","clean-negative":"Neg"}
for arm,tag in TAG.items():
    k,n = v([e for e in C if e["arm"]==arm])
    mac(f"Four{tag}K",k); mac(f"Four{tag}N",n); mac(f"Four{tag}Pct", f"{100*k/n:.0f}" if n else "0")
def c4(a1,a2,tag):
    st=[]
    for m in MODELS:
        k1,n1 = v([e for e in C if e["model"]==m and e["arm"]==a1]); k2,n2 = v([e for e in C if e["model"]==m and e["arm"]==a2])
        if n1 and n2: st.append((k1,n1,k2,n2))
    if st: mac(f"Four{tag}CMH", cmhtex(st))
c4("clean-neutral","clean-negative","NeutNeg"); c4("clean-positive","clean-negative","PosNeg")
c4("clean-neutral","drifted","NeutDrift"); c4("clean-positive","drifted","PosDrift")
pr = lambda arm: sum(1 for e in C if e["arm"]==arm and e["scores"]["intent_is_pricing"])
mac("FourPricingIntentTotal", str(sum(pr(a) for a in TAG)))

# ---- Experiment 5 ---------------------------------------------------------
S = load("workshop/runs/exp5-scores/**/*.json")
mac("FiveScored", len(S))
D = load("workshop/runs/exp5-v2/**/*.json")
mac("FiveChains", len(D))
if S:
    LAB = ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"]
    NEG = {"memory_73"}; SCOPE = {"memory_31","memory_44","memory_57"}; NONE = {"memory_86","memory_91"}
    def surv(keys, lab):
        rows=[s for s in S if s["memory"] in keys]
        k=sum(1 for s in rows for j in s["judgments"] if j["version"]==lab and j["states_qualifier"])
        n=sum(1 for s in rows for j in s["judgments"] if j["version"]==lab)
        return k,n
    # LaTeX control words are letters only, so generations get letter names
    GENNAME = {"session_note":"Note","consolidated":"Cons",
               "resum_130":"ResA","resum_110":"ResB","resum_90":"ResC","resum_70":"ResD"}
    for lab in LAB:
        for keys,tag in ((NEG,"Neg"),(SCOPE,"Scope"),(NONE,"Ctrl")):
            k,n = surv(keys,lab)
            key = f"Five{tag}{GENNAME[lab]}"
            mac(key+"K",k); mac(key+"N",n); mac(key+"Pct", f"{100*k/n:.0f}" if n else "0")
    k,n = surv(NONE,"resum_70"); mac("FiveFalsePos", f"{k}/{n}")

os.makedirs("workshop/paper", exist_ok=True)
bad = [k for k in M if not k.isalpha()]
if bad:
    raise SystemExit(f"invalid LaTeX macro names (control words must be letters only): {bad}")
with open("workshop/paper/macros.tex","w") as f:
    for k,val in M.items(): f.write(f"\\newcommand{{\\{k}}}{{{val}}}\n")
print(f"wrote {len(M)} macros to workshop/paper/macros.tex")
for k in ("ExpOneN","AlignedK","AlignedN","ThreeAN","ThreeBN","FourN","FiveChains","FiveScored"):
    print(f"  {k} = {M.get(k)}")
