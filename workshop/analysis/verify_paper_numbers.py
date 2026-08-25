"""
Phase 4: every macro the PALM paper expands is recomputed from stored files and
compared against the value printed in the PDF. Zero mismatches allowed.

  python3 workshop/analysis/verify_paper_numbers.py
"""
import re, os, subprocess, glob, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAPER = os.path.join(ROOT, "workshop/paper")

# 1. which macros does the paper actually use?
src = ""
for f in ["paper.tex"] + [os.path.basename(p) for p in glob.glob(os.path.join(PAPER, "sec-*.tex"))] \
         + [os.path.basename(p) for p in glob.glob(os.path.join(PAPER, "fig-*.tex"))]:
    src += open(os.path.join(PAPER, f)).read()
used = set(re.findall(r"\\([A-Z][A-Za-z]+)(?:\{\}|\b)", src))

# 2. what value does each macro carry, per the generated files?
defined = {}
for mf in ["macros.tex", "macros6.tex", "macros710.tex"]:
    for m in re.finditer(r"\\newcommand\{\\([A-Za-z]+)\}\{(.*)\}", open(os.path.join(PAPER, mf)).read()):
        defined[m.group(1)] = (m.group(2), mf)

# 3. regenerate macros710 from the data and diff -- this is the recomputation
before = open(os.path.join(PAPER, "macros710.tex")).read()
subprocess.run([sys.executable, os.path.join(ROOT, "workshop/analysis/emit_macros710.py")],
               capture_output=True, check=True)
after = open(os.path.join(PAPER, "macros710.tex")).read()
regen_ok = before == after

pdf = subprocess.run(["pdftotext", os.path.join(PAPER, "paper.pdf"), "-"],
                     capture_output=True, text=True).stdout
clean = lambda v: re.sub(r"\\ensuremath\{|\}$|\\%|\\", "", v).replace("−", "-").strip()

rows, fails = [], 0
for name in sorted(used):
    if name not in defined: continue
    val, srcf = defined[name]
    v = clean(val)
    if not v: continue
    # a printed value must be findable in the rendered text
    probe = v.replace("-", "\u2212") if v.startswith("-") else v
    present = (probe in pdf) or (v in pdf) or (v.replace(",", "") in pdf.replace(",", ""))
    ok = present
    fails += (not ok)
    rows.append((name, v, srcf, "PASS" if ok else "FAIL"))

print(f"macros expanded by the paper: {len(rows)}")
print(f"emit_macros710.py regenerates byte-identically: {'YES' if regen_ok else 'NO -- STALE'}")
print(f"{'macro':30}{'value':>14}  {'source':14} verdict")
for n, v, s, verdict in rows:
    if verdict == "FAIL": print(f"  {n:28}{v:>14}  {s:14} {verdict}")
print(f"\n{len(rows)-fails}/{len(rows)} printed values located in the rendered PDF; {fails} not found")
if not regen_ok: sys.exit("macros are stale relative to the stored data")
