#!/bin/sh
# Build the arXiv submission tarball.
#
# The file list is DERIVED from paper.tex rather than hard-coded: an earlier
# hard-coded list silently omitted three new body files and one macro file, and
# would have shipped a tarball that could not compile. If you add an \input,
# nothing here needs changing.
set -e
cd "$(dirname "$0")"

python3 analyze.py > analysis-output.txt
python3 analyze_phase2.py > analysis2-output.txt
python3 ../workshop/analysis/emit_macros.py > analysis3-output.txt
tectonic --keep-intermediates paper.tex

rm -rf arxiv && mkdir -p arxiv/figures

# every \input{...} and \bibliography{...} target, resolved to a real file
INPUTS=$(grep -ohE '\\(input|bibliography)\{[^}]+\}' paper.tex *_body.tex figures/*.tex 2>/dev/null \
         | sed -E 's/.*\{([^}]+)\}/\1/' | sort -u)
for f in $INPUTS; do
  for cand in "$f" "$f.tex" "$f.bib"; do
    if [ -f "$cand" ]; then
      mkdir -p "arxiv/$(dirname "$cand")"
      cp "$cand" "arxiv/$cand"
      break
    fi
  done
done
cp paper.tex paper.bbl arxiv/

tar -czf arxiv-submission.tar.gz -C arxiv .

# the tarball must build standalone; an untested tarball is not a submission
TMP=$(mktemp -d)
tar -xzf arxiv-submission.tar.gz -C "$TMP"
( cd "$TMP" && mkdir -p out && tectonic -X compile paper.tex --outdir out >build.log 2>&1 ) || {
  echo "FAIL: extracted tarball does not build"; tail -20 "$TMP/build.log"; exit 1; }
PAGES=$(pdfinfo "$TMP/out/paper.pdf" | awk '/^Pages/{print $2}')
REFS=$(pdftotext "$TMP/out/paper.pdf" - | grep -c 'arXiv preprint' || true)
UNDEF=$(grep -ci 'undefined \(control\|citation\|reference\)' "$TMP/build.log" || true)
rm -rf "$TMP"
echo "built: paper.pdf and arxiv-submission.tar.gz"
echo "  tarball builds standalone: $PAGES pages, $REFS arXiv references, $UNDEF undefined"
[ "$UNDEF" = "0" ] || { echo "FAIL: undefined references in the tarball build"; exit 1; }
