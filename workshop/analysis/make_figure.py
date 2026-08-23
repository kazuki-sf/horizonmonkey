"""Figure 1 — the two mechanism panels, generated from the episode files."""
import json, glob, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from stats import wilson

# panel (a): Study 3, intent-misaligned stratum
C = [json.load(open(f)) for f in glob.glob("workshop/runs/exp4-v1/**/*.json", recursive=True)]
mis = lambda a: [e for e in C if e["arm"]==a and not e["scores"]["intent_is_pricing"]]
ARMS = [("clean-negative","true caveat"),("drifted","silence"),
        ("clean-neutral","irrelevant hedge"),("clean-positive","positive note")]
bars = []
for arm,lab in ARMS:
    r = mis(arm); k = sum(1 for e in r if e["scores"]["verified_73"]); n = len(r)
    p,lo,hi = wilson(k,n)
    bars.append((lab, 100*p, 100*(p-lo), 100*(hi-p)))

# panel (b): Study 4 survival
S = [json.load(open(f)) for f in glob.glob("workshop/runs/exp5-scores/**/*.json", recursive=True)]
LAB = ["session_note","consolidated","resum_130","resum_110","resum_90","resum_70"]
NEG, SCOPE = {"memory_73"}, {"memory_31","memory_44","memory_57"}
def series(keys):
    out=[]
    for i,lab in enumerate(LAB):
        rows=[s for s in S if s["memory"] in keys]
        k=sum(1 for s in rows for j in s["judgments"] if j["version"]==lab and j["states_qualifier"])
        n=sum(1 for s in rows for j in s["judgments"] if j["version"]==lab)
        p,lo,hi = wilson(k,n)
        out.append((i+1, 100*p, 100*(p-lo), 100*(hi-p)))
    return out
neg, scope = series(NEG), series(SCOPE)

coords = lambda pts: " ".join(f"({x},{y:.1f}) -= (0,{l:.1f}) += (0,{h:.1f})" for x,y,l,h in pts)
EB = ("error bars/.cd,y dir=both,y explicit,error bar style={line width=0.5pt},"
      "error mark options={rotate=90,mark size=2pt}")

fig = r"""\begin{figure}[t]
\centering
\begin{tikzpicture}
\begin{axis}[name=a,width=6.4cm,height=4.6cm,ybar,bar width=13pt,
  ylabel={corrupted memory verified (\%)},ymin=0,ymax=100,
  symbolic x coords={""" + ",".join(b[0] for b in bars) + r"""},
  xtick=data,xticklabel style={rotate=28,anchor=east,font=\scriptsize},
  ytick={0,25,50,75,100},grid=major,title={\small (a) what the body carries}]
\addplot+[fill=blue!25,draw=blue!60!black,""" + EB + r"""] coordinates {""" + \
  " ".join(f"({b[0]},{b[1]:.1f}) -= (0,{b[2]:.1f}) += (0,{b[3]:.1f})" for b in bars) + r"""};
\end{axis}
\begin{axis}[at={(a.east)},xshift=1.5cm,anchor=west,width=6.6cm,height=4.6cm,
  xlabel={consolidation generation},ylabel={qualifier still stated (\%)},
  xtick={1,2,3,4,5,6},xticklabels={note,cons,130,110,90,70},
  xticklabel style={font=\scriptsize},ymin=0,ymax=104,ytick={0,25,50,75,100},
  grid=major,legend style={font=\scriptsize,at={(0.03,0.06)},anchor=south west,draw=none},
  title={\small (b) what compression keeps}]
\addplot+[thick,mark=*,color=red!70!black,""" + EB + r"""] coordinates {""" + coords(neg) + r"""};
\addlegendentry{negative outcome}
\addplot+[thick,mark=square*,color=orange!80!black,""" + EB + r"""] coordinates {""" + coords(scope) + r"""};
\addlegendentry{scope restriction}
\end{axis}
\end{tikzpicture}
\caption{\textbf{(a)} Verification of the corrupted memory by what its body
carries, restricted to episodes where the agent does not intend the action that
memory backs (Study 3). The true caveat suppresses verification; a qualifier
that raises a question without answering it raises it; silence sits between.
\textbf{(b)} Survival of each qualifier type through six consolidation
generations (Study 4); x-axis is session note, consolidation, then
re-summarisation targets of 130, 110, 90 and 70 characters. Scope restrictions
erode; quantified negative outcomes largely do not. Bars are Wilson 95\%
intervals.}
\label{fig:mech}
\end{figure}
"""
os.makedirs("workshop/paper", exist_ok=True)
open("workshop/paper/fig-mech.tex","w").write(fig)
print("wrote workshop/paper/fig-mech.tex")
print("  (a)", [(b[0], round(b[1])) for b in bars])
print("  (b) neg  ", [round(y) for _,y,_,_ in neg])
print("  (b) scope", [round(y) for _,y,_,_ in scope])
