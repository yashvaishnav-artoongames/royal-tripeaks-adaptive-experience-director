# Workflow and versioning

Live demo: https://yashvaishnav-artoongames.github.io/royal-tripeaks-adaptive-experience-director/

## The constraint that shapes everything

**GitHub Pages serves `main` from the repository root.** There is no build step
and no staging. Every push to `main` is a production deploy, visible within about
a minute.

So `main` is production. Treat it that way.

That is not the usual arrangement and it has already bitten: version 1.0.0 was
pushed to `main` with ISSUE-001 in it — a `ReferenceError` that killed every
REBAND — and it was live until 1.0.1. Nothing caught it because nothing ran.

## Branches

    main              production. Deployed. Protected by discipline, not by CI.
    feat/<name>       one feature or fix. Short-lived.
    exp/<name>        experiments that may never merge.

Work happens on a branch. `main` receives merges, not commits.

**Never commit directly to `main`** except to revert. A revert is the one change
that should go in fast and unreviewed, because it restores a state that was
already verified.

## The loop

    1  branch          git checkout -b feat/issue-002-band-adherence
    2  understand      read the code and docs/ before editing
    3  change          smallest thing that works
    4  verify          run the harnesses, paste real output
    5  document        update docs/ if knowledge, a decision or an issue changed
    6  version         bump APP_VERSION and add a CHANGELOG entry
    7  merge           into main
    8  tag             git tag v1.0.2 && git push --tags
    9  check live      open the site, confirm the version in the header

Step 9 exists because the deployed build now identifies itself. The header shows
`v1.0.1` beside the seed. If the site says one thing and `CHANGELOG.md` says
another, the deploy did not land.

## The verification gate

Before any merge to `main`:

    node tools/reg.js          core director — the important one
    node tools/plustest.js     13/13
    node tools/streaktest.js   26/26
    node tools/colortest.js    11/11
    node tools/meter.js         9/9
    node tools/truth.js        18/18

**Paste the actual output into the commit message or the PR.** Not a summary.
A number nobody ran is worse than no number.

`reg.js` takes about four minutes over 25 levels. That is the cost of not
shipping another ISSUE-001.

Two things it will not catch, so watch for them by hand:

- **Verified-to-live drift.** A level moving from the verified director to live
  steering is a regression even when every suite passes. `tools/buildchk.js`
  shows the split.
- **Non-determinism.** Generation is time-boxed, so `reg.js` can differ run to
  run on the identical build. Run it twice before calling something a
  regression. See ISSUE-004.

## Versioning

`MAJOR.MINOR.PATCH`, and the meaning is specific to this project:

| | when |
|---|---|
| **PATCH** — 1.0.1 | a fix that changes no outcome. Crash fixes, UI, docs, tooling |
| **MINOR** — 1.1.0 | new behaviour, or a tuning change that moves measured outcomes. A new obstacle, a band change, a director rule |
| **MAJOR** — 2.0.0 | the director model itself changes, or level JSON stops loading the same way |

The distinction that matters: **anything that moves a measured number is at
least MINOR**, even if it is one constant. Changing `STREAK_REWARD.type` is not
a patch — it changes what every level does.

`APP_VERSION` in `index.html` and the top entry of `CHANGELOG.md` must agree.
That is the review check.

> **Not yet possible — added 2026-08-24, second session.** VERIFIED: `index.html`
> contains no `APP_VERSION` and no version string at all, and the span beside the
> seed (`id="sd"`) renders only `seed <n>`. Step 6 of the loop, this review check
> and step 9 all depend on a constant that does not exist yet. Tracked as
> ISSUE-009. Left in place rather than softened, because the requirement is
> right; it is the code that has not caught up.

## Releases

Tag every merge to `main` that bumps the version:

    git tag -a v1.0.2 -m "fix ISSUE-002 band adherence"
    git push --tags

A tag is a rollback point. Because the demo is one file with no build step,
rollback is genuinely one command:

    git checkout v1.0.1 -- index.html && git commit && git push

Live again within a minute. **Do not roll back by editing.** Check out the tag.

Copy `docs/versions/RELEASE_TEMPLATE.md` for anything MINOR or larger, and put
it in `docs/versions/`. Patches only need the `CHANGELOG.md` entry.

## Where measurements go

Sweep output belongs in `docs/measurements/`, named for the version that
produced it — `eced_1.1.0.md`. When it is superseded, move it to `archive/` and
mark it in `docs/measurements/README.md`.

Never delete a report. A stale figure in a repo is dangerous; a figure marked
superseded is history.

## What Claude may do without asking

- read anything
- run any harness
- work on a branch
- propose a change with measured evidence

## What needs a decision first

- merging to `main` — it deploys
- tuning that moves a measured outcome
- anything that reduces verified coverage
- adding a file to the repository root
- recording a decision in `docs/DECISIONS.md`

## Next three, in order

1. **ISSUE-002** — 25 of 121 level/outcome pairs land outside their band with
   streak ExtraCards on. It undermines the core promise, so it goes first.
   See Q-001.
2. **Q-002** — the committed strand set, the only candidate fix for live
   steering at 91%/30%. Prototype behind a flag with a fallback.
3. **Q-003** — the softer pacing constraint. Contained, measurable, low risk.

Each is a branch, a measurement, a version bump and a tag.
