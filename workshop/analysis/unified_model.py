"""One logistic model over all 1020 Experiment-1 episodes.

Robustness/synthesis only. The pre-registered Fisher/CMH tests in paper/analyze.py
remain the confirmatory analysis; nothing here replaces them.

IRLS with a small ridge penalty, standard errors from the observed information.
numpy only, matching the rest of this repository's no-heavy-dependency policy.
"""
import json, glob, math
import numpy as np

MODELS = ["claude-opus-5","claude-sonnet-5","claude-haiku-4-5","gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna"]
BACKING = {"simplify_onboarding":["memory_31","memory_86"], "promotional_pricing":["memory_73"],
           "referral_incentive":["memory_57"], "activation_messaging":["memory_91"],
           "enterprise_sales_assist":["memory_44"]}

eps = [json.load(open(f)) for f in glob.glob("runs/paper/paper-v1/**/*.json", recursive=True)]
print(f"episodes: {len(eps)}")

rows, y = [], []
names = ["intent_aligned","drifted","triage","budget_c","position_c","target_is_86"] + [f"model[{m}]" for m in MODELS[1:]]
for e in eps:
    tgt = e["target"]
    intent = e["first"]["intended_action"]
    aligned = 1.0 if tgt in BACKING.get(intent, []) else 0.0
    drifted = 1.0 if e["condition"] in ("drifted","drifted-triage") else 0.0
    triage  = 1.0 if e["condition"] == "drifted-triage" else 0.0
    x = [aligned, drifted, triage, e["budget"] - 2.0, e["position"] - 2.5, 1.0 if tgt == "memory_86" else 0.0]
    x += [1.0 if e["model"] == m else 0.0 for m in MODELS[1:]]
    rows.append(x); y.append(1.0 if e["scores"]["verified_target"] else 0.0)

X = np.column_stack([np.ones(len(rows)), np.array(rows)])
y = np.array(y); names = ["intercept"] + names

def firth(X, y, iters=500, tol=1e-10):
    """Firth-penalised logistic regression (Jeffreys prior on the likelihood).

    intent_aligned separates the outcome perfectly (236/236), so the ordinary
    MLE diverges. Firth's penalty gives a finite, interpretable estimate under
    separation instead of an arbitrary ridge.
    """
    b = np.zeros(X.shape[1]); step = np.zeros_like(b)
    for _ in range(iters):
        eta = np.clip(X @ b, -30, 30); p = 1/(1+np.exp(-eta))
        W = np.clip(p*(1-p), 1e-10, None)
        XW = X * W[:, None]
        I = X.T @ XW
        Iinv = np.linalg.pinv(I)
        h = np.einsum("ij,jk,ik->i", XW, Iinv, X)          # hat diagonal
        U = X.T @ (y - p + h*(0.5 - p))                    # Firth-modified score
        step = Iinv @ U
        # damp early steps so separation does not blow the first iteration up
        m = np.max(np.abs(step))
        if m > 4: step *= 4/m
        b += step
        if np.max(np.abs(step)) < tol: break
    eta = np.clip(X @ b, -30, 30); p = 1/(1+np.exp(-eta)); W = np.clip(p*(1-p), 1e-10, None)
    cov = np.linalg.pinv(X.T @ (X * W[:, None]))
    return b, np.sqrt(np.diag(cov))

irls = firth

# separation check, reported rather than hidden
al = X[:,1] == 1
print(f"\nintent-aligned episodes: verified {int(y[al].sum())}/{int(al.sum())}")
print(f"intent-misaligned      : verified {int(y[~al].sum())}/{int((~al).sum())}")
if y[al].sum() == al.sum():
    print("  -> complete separation on intent_aligned; the MLE for that term is +inf.")
    print("     Firth penalisation is used so every coefficient stays finite.")

b, se = firth(X, y)
def pval(z):  # two-sided normal
    return math.erfc(abs(z)/math.sqrt(2))

print(f"\n{'term':<22}{'log-odds':>10}{'SE':>8}{'odds ratio':>12}{'95% CI':>20}{'p':>12}")
print("-"*84)
for i, nm in enumerate(names):
    z = b[i]/se[i]; lo, hi = math.exp(b[i]-1.96*se[i]), math.exp(b[i]+1.96*se[i])
    star = " *" if pval(z) < 0.05 else ""
    print(f"{nm:<22}{b[i]:>10.3f}{se[i]:>8.3f}{math.exp(b[i]):>12.2f}{f'[{lo:.2f}, {hi:.2f}]':>20}{pval(z):>12.2e}{star}")

# Does the DRIFT effect vary by model?  (intent-alignment cannot be tested this
# way: it is separated, so no interaction can improve an already perfect fit.)
mv = np.array([e["model"] for e in eps])
Xi = np.column_stack([X] + [X[:,2] * (mv == m) for m in MODELS[1:]])
bi, _ = firth(Xi, y)
ll = lambda X_, b_: float(np.sum(y*np.clip(X_@b_,-30,30) - np.log1p(np.exp(np.clip(X_@b_,-30,30)))))
lr = 2*(ll(Xi, bi) - ll(X, b)); df = Xi.shape[1]-X.shape[1]
print(f"\nmodel x drift interaction: LR chi2 = {lr:.1f} on {df} df (chi2_5 crit 11.07)")
print(f"  -> the drift effect {'VARIES' if lr > 11.07 else 'does not vary'} detectably across models")
print("\nNote: no interaction test is run for intent_aligned. With 236/236 the fit is")
print("already perfect on that cell, so an interaction cannot improve it and an LR")
print("test would be vacuous rather than null.")
