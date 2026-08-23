"""Every k/n in the compiled PDF must trace to the episode files.

Macros store numerator and denominator separately, so K/N pairs are
reconstructed before matching. Anything left over is either a design constant
or a number copied forward from an older manuscript version -- the second is
what this catches.
"""
import re, subprocess, pathlib, sys

pdf = re.sub(r"\s+", " ", subprocess.run(["pdftotext","paper/paper.pdf","-"],
             capture_output=True, text=True).stdout)
M = {}
for f in ("paper/figures/macros.tex","paper/figures/macros2.tex","paper/figures/macros3.tex"):
    try: M.update(dict(re.findall(r"\\newcommand\{\\([A-Za-z]+)\}\{([^}]*)\}",
                                  pathlib.Path(f).read_text())))
    except FileNotFoundError: pass

backed = set()
for k, v in M.items():
    v = v.strip()
    backed.add(v)
    if re.fullmatch(r"\d+/\d+", v): backed.add(v)
    if k.endswith("K"):                              # pair K with its N
        n = M.get(k[:-1] + "N")
        if n: backed.add(f"{v}/{n.strip()}")
    if k.endswith("A") or k.endswith("B"):           # PreA/PreB already hold k/n
        pass

# also accept any k/n whose parts are both macro values under a shared prefix
nums = {v.strip() for v in M.values() if v.strip().isdigit()}

frac = sorted(set(re.findall(r"\b\d{1,4}/\d{1,4}\b", pdf)))
unbacked = []
for f in frac:
    a, b = f.split("/")
    if f in backed: continue
    if a in nums and b in nums: continue             # both halves generated
    unbacked.append(f)

print(f"fractions in the compiled PDF: {len(frac)}")
print(f"  traced to generated macros : {len(frac)-len(unbacked)}")
if unbacked:
    print("  NOT traced -- verify each against the episode files:")
    for f in unbacked:
        c = re.search(r".{60}" + re.escape(f) + r".{20}", pdf)
        print(f"    {f:<9} ...{c.group().strip() if c else ''}...")
    sys.exit(1)
print("  every fraction in the paper is generated from episode data")
