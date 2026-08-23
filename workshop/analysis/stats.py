"""Statistics helpers. wilson/cmh/fisher are byte-identical to paper/analyze.py
so workshop numbers and published numbers cannot drift apart."""
import math, random

def wilson(k, n, z=1.96):
    if n == 0: return (0.0, 0.0, 1.0)
    p = k / n
    d = 1 + z*z/n
    c = (p + z*z/(2*n)) / d
    h = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / d
    return (p, max(0, c-h), min(1, c+h))

def cmh_chi2(strata):
    num = den = 0.0
    for x1, n1, x2, n2 in strata:
        if n1 == 0 or n2 == 0: continue
        N = n1 + n2; M = x1 + x2
        if N < 2: continue
        num += x1 - n1 * M / N
        den += n1 * n2 * M * (N - M) / (N * N * (N - 1))
    if den == 0: return None
    return (abs(num) - 0.5) ** 2 / den

def cmh(strata):
    chi = cmh_chi2(strata)
    if chi is None: return None
    return 1 - math.erf(math.sqrt(chi / 2))

def cmh_str(strata):
    """CMH as text. Below ~1e-16 the normal tail underflows to exactly 0.0 in
    double precision, so report the statistic and a bound instead of "p = 0"."""
    chi = cmh_chi2(strata)
    if chi is None: return "n/a"
    p = 1 - math.erf(math.sqrt(chi / 2))
    if p > 0: return f"chi2 = {chi:.1f}, p = {p:.3g}"
    # upper bound on the normal tail: 2*phi(z)/z
    z = math.sqrt(chi)
    log10p = (math.log(2) - z*z/2 - math.log(z) - 0.5*math.log(2*math.pi)) / math.log(10)
    return f"chi2 = {chi:.1f}, p < 10^{math.ceil(log10p)}"

def fisher(a, b, c, d):
    from math import comb
    n = a+b+c+d; row1, col1 = a+b, a+c
    def pmf(x): return comb(col1, x) * comb(n-col1, row1-x) / comb(n, row1)
    p0 = pmf(a); lo, hi = max(0, row1+col1-n), min(row1, col1)
    return sum(pmf(x) for x in range(lo, hi+1) if pmf(x) <= p0 + 1e-12)

def pct(k, n):
    p, lo, hi = wilson(k, n)
    return f"{k}/{n} ({100*p:.0f}% [{100*lo:.0f},{100*hi:.0f}])"

def wald_iv_bootstrap(by_model, seed=20260823, B=10000):
    """Stratified bootstrap of the Wald ratio (dY/dM) over model strata.

    by_model: {model: (y_treat, n_treat, y_ctrl, n_ctrl, m_treat, m_ctrl)}
      y = outcome successes, m = mediator successes, same denominators.
    """
    rng = random.Random(seed)
    def point(d):
        yt = sum(v[0] for v in d.values()); nt = sum(v[1] for v in d.values())
        yc = sum(v[2] for v in d.values()); nc = sum(v[3] for v in d.values())
        mt = sum(v[4] for v in d.values()); mc = sum(v[5] for v in d.values())
        dY = yt/nt - yc/nc; dM = mt/nt - mc/nc
        return (dY/dM if dM else float("nan")), dY, dM
    est, dY, dM = point(by_model)
    draws = []
    for _ in range(B):
        d = {}
        for m, (yt, nt, yc, nc, mt, mc) in by_model.items():
            bt = [rng.random() < yt/nt for _ in range(nt)]
            bc = [rng.random() < yc/nc for _ in range(nc)]
            bmt = [rng.random() < mt/nt for _ in range(nt)]
            bmc = [rng.random() < mc/nc for _ in range(nc)]
            d[m] = (sum(bt), nt, sum(bc), nc, sum(bmt), sum(bmc))
        r, _, _ = point(d)
        if r == r: draws.append(r)
    draws.sort()
    lo = draws[int(0.025*len(draws))]; hi = draws[int(0.975*len(draws))]
    return est, lo, hi, dY, dM
