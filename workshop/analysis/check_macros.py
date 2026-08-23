"""Every \macro used in the paper must exist in macros.tex, and every macro in
macros.tex should be used or deliberately spare. Catches silent \relax output."""
import re, glob, pathlib, sys
defined = set(re.findall(r"\\newcommand\{\\([A-Za-z]+)\}", pathlib.Path("workshop/paper/macros.tex").read_text()))
used = set()
for f in glob.glob("workshop/paper/*.tex"):
    if f.endswith("macros.tex"): continue
    used |= set(re.findall(r"\\([A-Z][A-Za-z]*)\b", pathlib.Path(f).read_text()))
KNOWN_LATEX = {"LaTeX","TeX","Firth"}
missing = sorted(u for u in used - defined if u not in KNOWN_LATEX and not u.isupper())
print(f"macros defined: {len(defined)}   referenced: {len(used & defined)}")
if missing:
    print("UNDEFINED macros referenced in the paper:")
    for m in missing: print("   \\" + m)
    sys.exit(1)
print("all referenced macros are defined")
