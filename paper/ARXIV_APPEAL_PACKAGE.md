# arXiv appeal package — prepared, not filed

**Do not file this appeal now.** It becomes eligible only on a qualifying
peer-reviewed outcome, and the appeal route is terminal if denied.

## The decision, from the primary source

Verified on 2026-08-25 against the original notice in the author's mailbox
(`MOD-101641 arXiv - important notification regarding submit/7984035`,
from `jira@arxiv-org.atlassian.net`, 2026-08-24 11:51 UTC), **not** against our
own earlier summary of it.

Verbatim, the operative paragraphs:

> Thank you for submitting your work to arXiv. We regret to inform you that
> arXiv's moderators have determined that your submission will not be accepted
> at this time and made public on arXiv.org.
>
> In this case, our moderators have determined that your submission would
> benefit from additional review and revision that is outside of the services we
> provide.
>
> Our moderators will reconsider this material via appeal if it is published in
> a conventional journal and you can provide a resolving DOI (Digital Object
> Identifier) to the published version of the work or link to the journal's
> website showing the status of the work.
>
> Note that publication in a conventional journal does not guarantee that arXiv
> will accept this work.

No defect in the manuscript was named. This is a screening decision, not a
review.

## Correction to our own record

Our `ARXIV_SUBMISSION.md` previously stated that **"only one appeal is allowed"**
as if appeals were rationed to one per author or per submission. That is not
what either source says.

- The **rejection email** says nothing about a limit on the number of appeals.
- The **appeals policy** (linked from the email,
  <https://info.arxiv.org/help/moderation/appeals.html>) says:
  *"When an appeal is denied by appellate moderators, no further appeal is
  possible."*

The accurate statement is therefore: **an appeal is not rationed, but a denial
is terminal.** The practical conclusion is unchanged --- do not appeal without
the strongest possible case --- but the reason is that a refusal ends the route,
not that we hold a single token.

## What would make the appeal eligible

The email names two alternatives, and the second is looser than the first:

1. **a resolving DOI to the published version**, or
2. **a link to the journal's website showing the status of the work.**

Reading (2), an acceptance visible on the venue's site may suffice before the
final DOI issues. We should not rely on that reading without checking.

**The Zenodo DOI does not qualify.** Zenodo is a repository, not a conventional
journal; `10.5281/zenodo.22084498` establishes a citable record and a date, not
peer review. Filing on the strength of it would likely draw the terminal denial.

**TMLR acceptance would qualify.** TMLR is a peer-reviewed journal with a public
record of each submission's status, which satisfies (2) directly and (1) once
the camera-ready is posted.

## Contents of the package, when it is filed

| item | path | state |
|---|---|---|
| canonical manuscript, public author version | `paper/output/full-paper.pdf` | built in Phase B |
| LaTeX source archive | `paper/output/arxiv-source.tar.gz` | built in Phase B |
| the original submission, for the record | `submit/7984035`, cs.IR, 2026-08-23 | historical |
| the decision notice | `MOD-101641`, quoted above | historical |
| the qualifying evidence | TMLR acceptance page or DOI | **not yet available** |

## Draft appeal note, to be revised at filing time

> This submission (`submit/7984035`) was declined on 24 Aug 2026 on the grounds
> that it would benefit from additional review and revision outside the services
> arXiv provides. It has since been peer reviewed and accepted at
> [venue], [status link or DOI].
>
> The manuscript has also been substantially revised since that submission. Four
> further pre-registered experiments were completed, one previously reported
> interpretation was falsified by our own controlled test and withdrawn, an
> independent replication of the central effect was run, and the limitations
> section now states what the design does and does not identify.
>
> We are happy to provide the reviews if that would assist the moderators.

## Status

**NOT ELIGIBLE.** Revisit only on a TMLR decision. Until then this file is a
record, not a task.
