# BA-BP development

## Development artifacts and disk cleanup

- Put disposable build/test output in the existing ignored output directories;
  verify ignore rules before introducing a new scratch directory. Reuse build and
  dependency caches instead of creating a full copy for each attempt.
- Finish each task by removing its temporary extraction/package/test staging and
  superseded rebuildable intermediates after consumers exit. Keep the current
  validated output and any required rollback or frozen comparison executable.
- Before a run expected to write more than 1 GiB, measure free space and current
  output size, set a disk budget, and stop cleanly at that budget. Large retained
  runs need a local manifest recording purpose, source/inputs, reproduction steps,
  retained paths and a review date; report before/after size and deferred cleanup.
- Age and Git ignore status alone do not prove obsolescence. Preserve source,
  uncommitted work, user state, secrets, databases/backups, unique captures and
  required research evidence. Retain complete original measurement samples and
  identities; a summary alone is not a replacement. Verify any evidence archive
  before retiring its originals.
- Before deletion, check Git/worktree status, process ownership and resolved paths.
  Delete only explicit task-owned generated paths inside the intended output root;
  do not follow junctions/symlinks, run blanket `git clean -xfd`, remove a checkout
  by recursive deletion, or prune shared caches/volumes as routine task cleanup.

- Reuse frontend `dist/`, `node_modules/` and Rust `src-tauri/target/`. Retire
  superseded build/package staging while preserving the running app's package,
  saved drafts/settings, cached roster data, tracked public assets and release history.
