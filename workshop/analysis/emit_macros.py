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
# resolve every path against the repository root so this runs from any cwd
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)

def load(p, expect=None):
    rows = [json.load(open(f)) for f in glob.glob(p, recursive=True)]
    if expect is not None and len(rows) != expect:
        raise SystemExit(f"{p}: found {len(rows)} episodes, expected {expect}. "
                         "Refusing to emit macros from an incomplete run.")
    if not rows:
        raise SystemExit(f"{p}: no episodes found (cwd={os.getcwd()}). "
                         "Refusing to emit macros from nothing.")
    return rows

# ---- Experiment 1 (published data, re-analysed) ---------------------------
E1 = load("runs/paper/paper-v1/**/*.json", 1020)
mac("ExpOneN", len(E1))
al = [e for e in E1 if e["target"] in BACKING.get(e["first"]["intended_action"], [])]
mis = [e for e in E1 if e not in al]
va = sum(1 for e in al if e["scores"]["verified_target"]); vm = sum(1 for e in mis if e["scores"]["verified_target"])
mac("AlignedK", va); mac("AlignedN", len(al)); mac("MisK", vm); mac("MisN", len(mis))
mac("MisPct", f"{100*vm/len(mis):.0f}")

# ---- Experiment 3A --------------------------------------------------------
A = load("workshop/runs/exp3a-v1/**/*.json", 450)
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
B = load("workshop/runs/exp3b-v1/**/*.json", 300)
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
# severity, not just direction: non-guarded choices under randomisation
ngc = lambda r: sum(1 for e in r if e["scores"].get("p2_nonguarded_pricing"))
stn = []
for m in MODELS:
    t = [e for e in B if e["model"]==m and e["arm"]=="carry-target"]
    o = [e for e in B if e["model"]==m and e["arm"]=="carry-other"]
    if t and o: stn.append((ngc(t), len(t), ngc(o), len(o)))
tt = [e for e in B if e["arm"]=="carry-target"]; oo = [e for e in B if e["arm"]=="carry-other"]
mac("ThreeBNGTgt", f"{ngc(tt)}/{len(tt)}"); mac("ThreeBNGOth", f"{ngc(oo)}/{len(oo)}")
if stn: mac("ThreeBNGCMH", cmhtex(stn)); mac("ThreeBNGChi", f"{cmh_chi2(stn):.0f}")
mac("ThreeBNGHedged", str(sum(1 for e in B if e["scores"].get("p2_nonguarded_pricing") and not e["scores"]["p2_uncertainty"])))
A_ng = sum(1 for e in A if e["scores"].get("p2_nonguarded_pricing"))
mac("ThreeANonGuarded", f"{A_ng}/{len(A)}")

mac("ThreeBAllModels", str(sum(1 for m in MODELS
    if cell([e for e in B if e["model"]==m and e["arm"]=="carry-target"])[0]
     < cell([e for e in B if e["model"]==m and e["arm"]=="carry-other"])[0])))

# ---- Experiment 4 ---------------------------------------------------------
C = load("workshop/runs/exp4-v1/**/*.json", 600)
mac("FourN", len(C))
v = lambda r: (sum(1 for e in r if e["scores"]["verified_73"]), len(r))
TAG = {"drifted":"Drift","clean-positive":"Pos","clean-neutral":"Neut","clean-negative":"Neg"}
# marginal (confounded by intent) and intent-misaligned (the contrast that isolates
# the qualifier) are both emitted; the paper reports the second and says why.
mis = lambda a, m=None: [e for e in C if e["arm"]==a and not e["scores"]["intent_is_pricing"] and (m is None or e["model"]==m)]
for arm,tag in TAG.items():
    k,n = v([e for e in C if e["arm"]==arm])
    mac(f"Four{tag}AllK",k); mac(f"Four{tag}AllN",n); mac(f"Four{tag}AllPct", f"{100*k/n:.0f}" if n else "0")
    mac(f"Four{tag}Intent", str(sum(1 for e in C if e["arm"]==arm and e["scores"]["intent_is_pricing"])))
    k,n = v(mis(arm))
    mac(f"Four{tag}K",k); mac(f"Four{tag}N",n); mac(f"Four{tag}Pct", f"{100*k/n:.0f}" if n else "0")
def c4(a1,a2,tag):
    # pre-registered contrast: all episodes
    stM = []
    for m in MODELS:
        k1,n1 = v([e for e in C if e["model"]==m and e["arm"]==a1]); k2,n2 = v([e for e in C if e["model"]==m and e["arm"]==a2])
        if n1 and n2: stM.append((k1,n1,k2,n2))
    k1,n1 = v([e for e in C if e["arm"]==a1]); k2,n2 = v([e for e in C if e["arm"]==a2])
    if stM: mac(f"Four{tag}PreCMH", cmhtex(stM))
    if n1 and n2:
        mac(f"Four{tag}PreDiff", f"{100*(k1/n1 - k2/n2):.0f}")
        mac(f"Four{tag}PreA", f"{k1}/{n1}"); mac(f"Four{tag}PreB", f"{k2}/{n2}")
    # post-hoc stratum: intent-misaligned only
    st=[]
    for m in MODELS:
        k1,n1 = v(mis(a1,m)); k2,n2 = v(mis(a2,m))
        if n1 and n2: st.append((k1,n1,k2,n2))
    k1,n1 = v(mis(a1)); k2,n2 = v(mis(a2))
    if st: mac(f"Four{tag}CMH", cmhtex(st))
    if n1 and n2: mac(f"Four{tag}Diff", f"{100*(k1/n1 - k2/n2):.0f}")
c4("clean-neutral","clean-negative","NeutNeg"); c4("clean-positive","clean-negative","PosNeg")
c4("clean-neutral","drifted","NeutDrift"); c4("clean-positive","drifted","PosDrift")
c4("drifted","clean-negative","DriftNeg")
# how universal is the suppression?  and does Sonnet's Experiment-1 reversal survive?
sup = rev = 0
for m in MODELS:
    kn,nn = v([e for e in C if e["model"]==m and e["arm"]=="clean-negative"])
    kd,nd = v([e for e in C if e["model"]==m and e["arm"]=="drifted"])
    if nn and nd:
        if kn/nn < kd/nd: sup += 1
        else: rev += 1
mac("FourSuppressModels", str(sup)); mac("FourReverseModels", str(rev))
for m,tag in (("claude-sonnet-5","Sonnet"),("claude-haiku-4-5","Haiku")):
    kn,nn = v([e for e in C if e["model"]==m and e["arm"]=="clean-negative"])
    kd,nd = v([e for e in C if e["model"]==m and e["arm"]=="drifted"])
    mac(f"Four{tag}Neg", f"{kn}/{nn}"); mac(f"Four{tag}Drift", f"{kd}/{nd}")
    mac(f"Four{tag}Gap", f"{100*(kn/nn - kd/nd):+.0f}")

# ---- Experiment 5 ---------------------------------------------------------
S = load("workshop/runs/exp5-scores/**/*.json")
mac("FiveScored", len(S))
D = load("workshop/runs/exp5-v2/**/*.json")
mac("FiveChains", len(D))
if S:
    LAB = ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"]
    D = load("workshop/runs/exp5-v2/**/*.json")
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
    fp = sum(1 for s_ in S if s_["memory"] in NONE for j in s_["judgments"] if j["states_qualifier"])
    fpn = sum(1 for s_ in S if s_["memory"] in NONE for j in s_["judgments"])
    mac("FiveFalsePosAll", f"{fp}/{fpn}")
    # what erodes inside the corrupted memory: the number, or the instruction?
    PROH = ["do not","don't","never","avoid","not a growth","not sustainable","unsustainable","not a lever","only for","one-off"]
    NUM  = ["retention","churn","renewal","-12","12%","12pp"]
    D2 = {(d["model"], d["rep"]): d for d in D}
    for lab,tag in (("consolidated","Cons"),("resum_70","ResD")):
        gi = LAB.index(lab); kp = kn = t = 0
        for ch in D2.values():
            body = ch["generations"][gi].get("memory_73","").lower()
            t += 1; kp += any(w in body for w in PROH); kn += any(w in body for w in NUM)
        mac(f"FiveNum{tag}", f"{kn}/{t}"); mac(f"FiveProh{tag}", f"{kp}/{t}")
    mac("FiveGenerations", "6")
    # did consolidation ever strip memory_73 down to a purely positive body,
    # i.e. reproduce the corruption Experiments 1-4 install by hand?
    NEGW = ["retention","churn","renewal","ret ","-12","12%","12pp","damage","hurt",
            "risk","unsustain","not sustain","guardrail","selectively","tactically",
            "short-term","judge at"]
    pure = tot = 0
    for ch in D:
        for g in ch["generations"]:
            b = g.get("memory_73","").lower(); tot += 1
            if not any(w in b for w in NEGW): pure += 1
    mac("FivePurelyPositive", f"{pure}/{tot}")
    per = []
    for m in MODELS:
        r = [s_ for s_ in S if s_["memory"]=="memory_73" and s_["model"]==m]
        k = sum(1 for s_ in r for j in s_["judgments"] if j["version"]=="resum_70" and j["states_qualifier"])
        n = sum(1 for s_ in r for j in s_["judgments"] if j["version"]=="resum_70")
        if n: per.append((k, n))
    if per:
        mac("FiveNegPerModelLo", f"{min(k for k,_ in per)}/{per[0][1]}")
        mac("FiveNegPerModelHi", f"{max(k for k,_ in per)}/{per[0][1]}")

os.makedirs("workshop/paper", exist_ok=True)
# ---- unified Firth model: the table in the paper is generated, not typed ----
import numpy as np
def firth(X, y, iters=500, tol=1e-10):
    b = np.zeros(X.shape[1])
    for _ in range(iters):
        eta = np.clip(X @ b, -30, 30); pr = 1/(1+np.exp(-eta))
        W = np.clip(pr*(1-pr), 1e-10, None); XW = X * W[:, None]
        Iinv = np.linalg.pinv(X.T @ XW)
        h = np.einsum("ij,jk,ik->i", XW, Iinv, X)
        step = Iinv @ (X.T @ (y - pr + h*(0.5 - pr)))
        mx = np.max(np.abs(step))
        if mx > 4: step *= 4/mx
        b += step
        if np.max(np.abs(step)) < tol: break
    eta = np.clip(X @ b, -30, 30); pr = 1/(1+np.exp(-eta)); W = np.clip(pr*(1-pr), 1e-10, None)
    return b, np.sqrt(np.diag(np.linalg.pinv(X.T @ (X * W[:, None]))))

MODLIST = MODELS
rows, yy = [], []
for e in E1:
    tgt = e["target"]; intent = e["first"]["intended_action"]
    x = [1.0 if tgt in BACKING.get(intent, []) else 0.0,
         1.0 if e["condition"] in ("drifted","drifted-triage") else 0.0,
         1.0 if e["condition"] == "drifted-triage" else 0.0,
         e["budget"] - 2.0, e["position"] - 2.5, 1.0 if tgt == "memory_86" else 0.0]
    x += [1.0 if e["model"] == m else 0.0 for m in MODLIST[1:]]
    rows.append(x); yy.append(1.0 if e["scores"]["verified_target"] else 0.0)
X = np.column_stack([np.ones(len(rows)), np.array(rows)]); yy = np.array(yy)
bb, se = firth(X, yy)
TERMS = ["Intercept","Align","Drift","Triage","Budget","Pos","Swap"]
for i, t in enumerate(TERMS):
    or_ = math.exp(bb[i]); lo = math.exp(bb[i]-1.96*se[i]); hi = math.exp(bb[i]+1.96*se[i])
    def f(v):
        t = f"{v:.0f}" if v >= 100 else (f"{v:.2f}" if v < 10 else f"{v:.1f}")
        return t[:-2] if t.endswith(".0") else t
    mac(f"OR{t}", f(or_)); mac(f"OR{t}Lo", f(lo)); mac(f"OR{t}Hi", f(hi))

# ---- Study 2b per-model table, generated ----
carry_rows = []
NICE = {"claude-opus-5":"Opus 5","claude-sonnet-5":"Sonnet 5","claude-haiku-4-5":"Haiku 4.5",
        "gpt-5.6-sol":"Sol","gpt-5.6-terra":"Terra","gpt-5.6-luna":"Luna"}
for m in MODELS:
    kt_,nt_ = cell([e for e in B if e["model"]==m and e["arm"]=="carry-target"])
    kc_,nc_ = cell([e for e in B if e["model"]==m and e["arm"]=="carry-other"])
    carry_rows.append(f"{NICE[m]} & {kt_}/{nt_} & {kc_}/{nc_} \\\\")
# ---- exploratory: allocation under naturally drifted memory ----
NB = load("workshop/runs/exp5b-v1/**/*.json")
if NB:
    k = sum(1 for e in NB if e["scores"]["verified_73"])
    mac("NatK", k); mac("NatN", len(NB)); mac("NatPct", f"{100*k/len(NB):.0f}")
    mac("NatPricingIntent", str(sum(1 for e in NB if e["scores"]["intent_is_pricing"])))
    mac("NatChains", str(len({e["natural_source"] for e in NB})))
    mac("NatLenMin", str(min(e["natural_body_len"] for e in NB)))
    mac("NatLenMax", str(max(e["natural_body_len"] for e in NB)))

os.makedirs("workshop/paper", exist_ok=True)
kt_,nt_ = cell([e for e in B if e["arm"]=="carry-target"]); kc_,nc_ = cell([e for e in B if e["arm"]=="carry-other"])
open("workshop/paper/tab-carry.tex","w").write(
"""\\begin{table}[t]
\\centering\\small
\\caption{Study 2b. Corrupted-direction rate when the provenance carried into the
later decision is randomised rather than chosen. Both arms carry two source
records; only whether one of them is the corrupted memory's differs.}
\\label{tab:carry}
\\begin{tabular}{lrr}
\\toprule
& corrupted memory's source carried & not carried \\\\
\\midrule
""" + "\n".join(carry_rows) + f"""
\\midrule
pooled & {kt_}/{nt_} ({100*kt_/nt_:.0f}\\%) & {kc_}/{nc_} ({100*kc_/nc_:.0f}\\%) \\\\
\\bottomrule
\\end{{tabular}}
\\end{{table}}
""")

# ---- design constants, measured rather than typed ----
import subprocess
lens = json.loads(subprocess.run(["npx","tsx","-e","""
import { lineage } from "./scripts/paper-experiment";
const c = lineage("clean","memory_73"), d = lineage("drifted","memory_73");
const t = (a:any[]) => a.find((m)=>m.id==="memory_73").body.length;
const o = (a:any[]) => a.filter((m)=>m.id!=="memory_73").map((m)=>m.body.length);
console.log(JSON.stringify({cleanT:t(c), driftT:t(d), oMin:Math.min(...o(d)), oMax:Math.max(...o(d)),
  oMean:o(d).reduce((x,y)=>x+y,0)/o(d).length}));
"""], capture_output=True, text=True).stdout.strip().splitlines()[-1])
mac("BodyMin", lens["oMin"]); mac("BodyMax", lens["oMax"])
mac("BodyCleanTarget", lens["cleanT"]); mac("BodyDriftTarget", lens["driftT"])
mac("BodyRatio", f"{lens['cleanT']/lens['oMean']:.2f}")

bad = [k for k in M if not k.isalpha()]
if bad:
    raise SystemExit(f"invalid LaTeX macro names (control words must be letters only): {bad}")
body = "".join(f"\\newcommand{{\\{k}}}{{{val}}}\n" for k,val in M.items())
open("workshop/paper/macros.tex","w").write(body)
# the arXiv manuscript reports the same experiments, so it reads the same numbers
os.makedirs("paper/figures", exist_ok=True)
open("paper/figures/macros3.tex","w").write(body)
open("paper/tab-carry.tex","w").write(open("workshop/paper/tab-carry.tex").read())
print(f"wrote {len(M)} macros to workshop/paper/macros.tex and paper/figures/macros3.tex")
for k in ("ExpOneN","AlignedK","AlignedN","ThreeAN","ThreeBN","FourN","FiveChains","FiveScored"):
    print(f"  {k} = {M.get(k)}")
