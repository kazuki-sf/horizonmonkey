#!/bin/sh
# Build the arXiv submission tarball. Mirrors glasp-web research conventions.
set -e
cd "$(dirname "$0")"
python3 analyze.py > analysis-output.txt
tectonic --keep-intermediates paper.tex
rm -rf arxiv && mkdir -p arxiv
cp paper.tex refs.bib results_body.tex limitations_body.tex paper.bbl arxiv/
mkdir -p arxiv/figures && cp figures/macros.tex figures/budget_fig.tex arxiv/figures/
tar -czf arxiv-submission.tar.gz -C arxiv .
echo "built: paper.pdf and arxiv-submission.tar.gz"
