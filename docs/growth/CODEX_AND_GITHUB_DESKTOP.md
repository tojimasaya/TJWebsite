# Codex + GitHub Desktop workflow

## Recommended path
Use Codex for the code changes and PR, then use GitHub Desktop for local review and push/merge workflow.

1. Open Codex and connect the `tojimasaya.com` GitHub repository.
2. Create a new task using `docs/growth/CODEX_TASK.md`.
3. Ask Codex to work on a new branch named `growth/site-guides-seo-tracking`.
4. Review the Codex diff in the browser.
5. Create a pull request from Codex.
6. In GitHub Desktop, fetch origin and check out the Codex branch.
7. Open the changed HTML files locally and confirm the new pages and links.
8. Commit any manual adjustments in GitHub Desktop if needed.
9. Push and merge after review.

## If applying this package manually instead
Copy the production files from this ZIP into the repository root, preserving existing `assets/` and `data/` folders, then review the Changes tab in GitHub Desktop.

Recommended commit message:

```text
Add growth-focused site guides and SEO tracking
```
