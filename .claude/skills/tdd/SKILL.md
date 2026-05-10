---
name: tdd
description: ui-components で TDD で進めるための workflow guide。`/tdd <task の説明>` で起動。
disable-model-invocation: true
allowed-tools: Bash(pnpm *) Bash(git *) Read Edit Write Grep Glob
---

# TDD workflow (ui-components、#16)

## Current test status

```
!`pnpm test --run 2>&1 | tail -30`
```

## Currently staged files

```
!`git diff --cached --name-only`
```

## このセッションで既に変更したファイル (uncommitted)

```
!`git diff --name-only`
```

---

## 進め方 (ユーザーから依頼された task: `$ARGUMENTS`)

1. **失敗するテストを先に書く** (RED)
   - `src/lib/**` 配下に対応する `*.test.ts` を新規作成 / 既存に追加。
   - projection 系の純粋ロジック → unit test (vitest)。
   - Svelte component の挙動 → component test (`@testing-library/svelte` + jsdom)。
   - `pnpm test --run` で **新しいテストが fail することを確認**。fail メッセージが期待した assertion に一致しているか確認。
   - 「テストが書けない」「テストが pass してしまう」 場合は、依頼内容が曖昧 / 既存挙動と一致 を疑い、ユーザーに確認。

2. **最小限の実装で pass させる** (GREEN)
   - テストを通す **最小コード**だけ書く。speculative な機能 / 未使用の引数 / 抽象化は禁止。
   - `pnpm test --run` で全 test 緑を確認。
   - `pnpm check` (svelte-check) も忘れず緑に。

3. **必要なら refactor** (REFACTOR)
   - テストが緑のまま実装を整える。

4. **changeset を作る**
   - `pnpm changeset` (interactive) または `.changeset/*.md` を手動作成:
     ```
     ---
     "@tommykey-apps/ui-components": patch | minor | major
     ---
     <変更内容>
     ```
   - patch = bug fix、minor = 新機能 (additive)、major = breaking change

5. **commit / PR**
   - test ファイルと実装ファイルは **同じ commit** に入れる (TDD discipline の証跡)。
   - hook (`.claude/hooks/warn-untested.sh`) が「対応する `*.test.ts` が staged されていない」 と警告したら、test を先に `git add` して staged してから Edit。
   - merge 後に release workflow が「Version Packages」 PR を自動作成、それを merge すると GitHub Packages に publish。

## 注意点

- **境界 / 例外 / null / 0 件 / 大量データ** を最低限カバー。
- **CSS scoped style** の挙動は jsdom では computed style が不完全。`element.classList` / `getAttribute('style')` / `getPropertyValue('--var')` で部分的に確認、最終確認は Storybook (visual) で。
- **drag/resize** 等の pointer event は `setPointerCapture` パターン。test では `vi.spyOn` でモック化。
- **CSS 変数 API**: `--ui-*` プレフィクスで消費アプリが override する設計 (CLAUDE.md 参照)。test では default 値とオーバーライド両方を確認。
- **publish 対象外** (`src/stories/`, `src/routes/`, `.storybook/`) は hook の警告対象外。

## 参考

- CLAUDE.md: 「Publish フロー」「設計方針」
- consumer 側 (resource-planner) の TDD setup: [resource-planner #92 / PR #93](https://github.com/tommykey-apps/resource-planner/pull/93)
