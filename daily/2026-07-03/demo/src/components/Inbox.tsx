// Placeholder module.
//
// This path held a component from the scaffold's "first run" (Gavel) demo, which
// this run supersedes. The sync workflow (`sync-cursor-output.yml`) merges the
// daily/ tree into main via `cp -R` and cannot delete files, so removing this
// file on the branch would leave a stale, non-compiling copy on main and break
// the Pages build. Keeping it as an empty module neutralizes it (tree-shaken out;
// never imported by the Contextlens App).
export {}
