---
'@tommykey-apps/ui-components': patch
---

projection.ts の単体テストを追加(19 ケース、Vitest 4.1)。

- `vite.config.ts` の `test.projects` を `unit`(node環境) + `storybook`(browser) に分離
- coverage 対象を `src/lib/**/*.ts` に絞る(stories / .svelte / dist 除外)
- scripts: `pnpm test` (unit のみ) / `pnpm test:all` (全 project) / `pnpm test:coverage`
- CI workflow に `pnpm test` を `pnpm check` の直後に追加

テストカバー範囲:
- `startOfUnit` / `addUnits` / `unitsBetween` / `dateToX` / `xToDate` / `snapDate` / `viewportColumns`
- `barRect` の境界条件(aligned / not aligned / zero-length)
- `allocateLanes` の lane 割当(non-overlap / 2-lane / 3-lane / lane reuse / empty)
