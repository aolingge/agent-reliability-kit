# Channel Rules

This file keeps launch work aligned with platform expectations as of 2026-04-28. It summarizes public guidance and turns it into concrete launch actions.

## GitHub

Source:

- GitHub topics: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics
- GitHub social preview: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview
- GitHub README guidance: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- GitHub community profiles: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories
- GitHub Acceptable Use Policies: https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies

Do:

- Add a short repository description that matches the README one-liner.
- Add up to 20 lowercase topic names; keep them focused.
- Upload `assets/social-preview.png` as the repository social preview after the repo is public.
- Keep README links relative until public URLs exist.

Suggested topics:

```text
ai-agent
coding-agents
codex
claude-code
cursor
gemini-cli
mcp
developer-tools
ci
sarif
security
repository-health
open-source
typescript
cli
```

Avoid:

- Dead badges or public links before the repo, docs, and npm package exist.
- More than 20 topics.
- Broad or misleading tags that do not describe the project.
- Asking people to star, fork, follow, or comment as a favor.
- Advertising in unrelated issues, pull requests, discussions, or user mentions.

## Hacker News

Sources:

- Show HN: https://news.ycombinator.com/showhn.html
- Hacker News Guidelines: https://news.ycombinator.com/newsguidelines.html

Do:

- Use Show HN only after users can try the project without a signup barrier.
- Use a plain title such as `Show HN: Agent Reliability Kit - local-first repo checks for AI coding agents`.
- Stay available for human conversation in the thread.
- Explain how and why the project was built, plus what feedback is useful.

Avoid:

- Asking friends or followers for upvotes or comments.
- Posting if the public repo or install path is not ready.
- Posting generated or AI-edited comments directly; manually rewrite any prepared draft before submitting.
- Linkbait titles, uppercase emphasis, or marketing adjectives.

## Product Hunt

Sources:

- Posting a product: https://help.producthunt.com/en/articles/479557-how-to-post-a-product
- Featuring guidelines: https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines
- Sharing a post: https://help.producthunt.com/en/articles/2690626-how-do-i-share-my-post
- Personal versus company account: https://help.producthunt.com/en/articles/771527-personal-account-vs-company-account

Do:

- Post from a personal account, not a company account.
- Use the product page or docs page as the primary URL.
- Prepare a short tagline, concise description, square thumbnail, at least two gallery images, and a first comment.
- Use `assets/product-hunt-thumbnail.png` as the 240x240 thumbnail source.
- Position the project as a live, useful developer tool once install works.

Avoid:

- Launching before users can install or run the project.
- Treating engagement as the only success metric.
- Submitting a waitlist, template, report, or pure landing page as if it were a usable product.
- Unsupported adoption, security, or benchmark claims.
- Asking for upvotes directly, offering incentives, mass-messaging people, or coordinating votes.

## Reddit

Source:

- Reddit Pro organic playbook: https://redditinc.com/hubfs/Reddit%20Inc/Content/Reddit%20Pros%20organic%20playbook.pdf
- Reddit spam guidance: https://support.reddithelp.com/hc/en-us/articles/360043504051-What-constitutes-spam-Am-I-a-spammer
- Reddit self-promotion wiki: https://www.reddit.com/wiki/selfpromotion

Do:

- Comment and help first in each community.
- Read each subreddit rule page before posting.
- Ask moderators via ModMail when self-promotion rules are unclear.
- Make the post useful without the link.
- Reply to questions and feedback.

Avoid:

- Link-dropping the same launch post across many subreddits.
- Sales language.
- Posting in communities where self-promotion is not allowed.
- Using launch day as the first interaction with a subreddit.
- Hiding the maintainer relationship to the project.
- Private-message promotion.

## DEV Community

Source:

- DEV writing, editing, and scheduling: https://dev.to/help/writing-editing-scheduling
- DEV terms: https://dev.to/terms
- DEV Code of Conduct: https://dev.to/code-of-conduct
- Hashnode AI terms: https://hashnode.com/terms/ai

Do:

- Publish a technical article, not just a product announcement.
- Use a canonical URL when cross-posting from a project blog or docs page.
- Keep tags focused: `opensource`, `ai`, `cli`, `devtools`.
- Include a redacted demo and a clear private-data warning.

Avoid:

- Duplicating a post without canonical attribution.
- Posting screenshots with private repo paths, logs, URLs, or secrets.
- Using profanity or overhyped titles that reduce promotion quality.
- Publishing a thin external-link post whose main purpose is backlinking.
- Posting unreviewed AI-generated article text.

## X And LinkedIn

Sources:

- X platform manipulation and spam policy: https://help.x.com/en/rules-and-policies/platform-manipulation
- X developer guidelines: https://docs.x.com/developer-guidelines
- LinkedIn Professional Community Policies: https://www.linkedin.com/legal/professional-community-policies
- LinkedIn User Agreement: https://www.linkedin.com/legal/user-agreement
- LinkedIn CAN-SPAM/CASL guidance: https://www.linkedin.com/legal/l/can-spam-casl

Do:

- Use the short launch post first.
- Attach `assets/social-preview.png` or a clean report screenshot.
- Ask for specific feedback: false positives, confusing next actions, missing stacks, install friction.
- Reply from the maintainer account with useful implementation details.

Avoid:

- Making adoption claims before there are real users.
- Reposting the same message too often.
- Asking for stars before people have tried the project.
- Buying engagement, using engagement pods, or coordinating multiple accounts.
- Cold-DM promotion to people who have no clear relationship to the project.
