# 开发文档

[English](development.md) · **简体中文**

## 技术栈

| 层 | 选型 |
|---|---|
| 界面 | React 19、TypeScript（strict）、Tailwind CSS 4 |
| 状态 | Zustand 5 + `persist`（localStorage） |
| 拖拽 | dnd-kit（指针传感器、拖拽浮层） |
| 构建 | Vite 8 |
| 桌面壳 | Tauri 2（Rust、WebView2），NSIS 安装包 |
| 质量 | Biome（检查 + 格式化）、`tsc`、Vitest |
| 包管理 | pnpm（版本固定在 `package.json` 的 `packageManager` 字段） |

## 开始开发

```bash
corepack enable          # 或用其他方式安装 pnpm
pnpm install
pnpm dev                 # http://localhost:1420
```

开发桌面版需要安装 [Rust](https://rustup.rs) 和 [Tauri 环境依赖](https://v2.tauri.app/zh-cn/start/prerequisites/)（Windows 上为 MSVC 构建工具和 WebView2），然后：

```bash
pnpm tauri dev           # 桌面窗口，支持热重载
pnpm tauri build         # → src-tauri/target/release/bundle/nsis/*.exe
```

## 脚本

| 脚本 | 作用 |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | Vite 开发服务器 / 生产构建 / 预览构建结果 |
| `pnpm check` | CI 运行的全部检查：`biome ci`、`tsc --noEmit`、`vitest run`、版本一致性 |
| `pnpm lint` / `pnpm format` | Biome 检查 / 自动修复 |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm version:bump <patch\|minor\|major\|x.y.z>` | 同步修改 `package.json`、`Cargo.toml`、`Cargo.lock` 中的版本号 |

## 目录结构

```
src/
├── App.tsx               # 布局、加载学生列表、主题同步、更新检查
├── main.tsx
├── types.ts              # Board、SlotRef、Student 等类型与常量
├── lib/
│   ├── rules.ts          # ★ 纯函数禁选规则引擎（applyDrop、findViolations…）
│   ├── schaledb.ts       # SchaleDB 获取、解析、缓存、搜索
│   ├── legacy.ts         # 迁移 v1.x 的 localStorage 数据
│   ├── update.ts         # GitHub 新版本检查
│   ├── avatar.ts, sound.ts, platform.ts
├── store/
│   ├── draft.ts          # 禁选面板 + 玩家 + 撤销 / 重做历史（持久化）
│   ├── settings.ts       # 用户设置（持久化）
│   ├── roster.ts         # 学生列表，先用缓存再后台刷新
│   └── timer.ts          # 基于截止时间的倒计时
├── dnd/                  # DndContext 根组件和拖放数据类型
├── components/           # Header、BanBar、Roster、TeamPanel、Scoreboard…
│   └── ui/               # Dialog、ContextMenu、Portrait、TypeBadges
├── hooks/                # 快捷键、面板索引
├── i18n/                 # zh.ts（键的来源）与 en.ts
└── styles/index.css      # 主题变量（明亮 / 暗色）与组件样式
src-tauri/                # Tauri 壳（Rust）、配置、权限、图标
scripts/                  # version.mjs、release-notes.mjs
.github/workflows/        # ci.yml、release.yml
```

## 禁选逻辑

面板就是纯数据：数组里存放学生 ID（或 `null`）。

```ts
interface Board {
  bans: { attacker: Slot[]; shared: Slot[]; defender: Slot[] };
  picks: { attacker: Slot[]; defender: Slot[] }; // 固定 6 个；4+2 模式下 0–3 为主力位，4–5 为支援位
  protected: Slot[];                               // 4 个
}
```

每次拖放最终只调用 `src/lib/rules.ts` 中的一个函数：`applyDrop(board, source, target, studentId, ctx)`。

1. 先在面板副本上执行操作：列表 → 槽位为放入；槽位 → 槽位为交换；保护位 → 其他槽位为复制；槽位 → 列表为清空。
2. 对操作前后的面板分别运行 `findViolations()`。
3. 如果操作产生了新的违规，就拒绝它并返回违规代码（界面上显示为本地化的提示）；否则提交新面板，并把旧面板压入撤销栈。

同一套函数还负责拖动时的绿 / 红预览、违规槽位的红色高亮，以及「无法退出特殊规则」的判断。规则是作用于纯数据的纯函数，因此在 `rules.test.ts` 中可以脱离界面直接测试。

槽位只存 ID 而不存整个学生对象，所以切换名称语言后所有槽位会立即更新，保存的数据也很小。

## 持久化

| 键 | 内容 |
|---|---|
| `ba-draft:settings` | 偏好设置、禁用数量、自由学生与存档 ID |
| `ba-draft:match` | 面板、玩家（名称、头像 data URL、比分）、特殊规则状态 |
| `ba-draft:roster:<语言>` | 精简后的学生列表缓存，用于离线 |

升级后第一次启动时，`lib/legacy.ts` 会读取 v1.x 的键（`ba_draft_*`），保留主办方的存档、自由学生、保护位和禁用设置。Tauri 的 bundle identifier 保持不变（`com.badraft.tool`），因此 WebView2 中的存储会延续下来。

## 新增界面文本

1. 在 `src/i18n/zh.ts` 中添加键和中文文本。
2. 在 `src/i18n/en.ts` 中添加英文文本。缺少任何一个键都会导致 TypeScript 报错。
3. 在组件中使用 `const t = useT(); t("my.key", { name })`；在 React 之外使用 `src/i18n` 导出的 `t()`。

## 桌面壳说明

- `tauri.conf.json` 的版本号直接读取 `../package.json`，版本只有一个来源。
- 需要设置 `dragDropEnabled: false`，Windows 上的 HTML5 文件拖放（玩家头像）才能传到页面。
- CSP 只允许 SchaleDB（数据和图片）与 GitHub API（更新检查）。
- `capabilities/default.json` 只授予界面实际用到的权限：打开外部链接和全屏。
- npm 的 `@tauri-apps/*` 包与 Rust 的 `tauri*` crate 必须保持相同的次版本号，否则 Tauri CLI 会拒绝构建。请用 `pnpm up "@tauri-apps/*" --latest`，并在 `src-tauri/` 下运行 `cargo update`，一起升级。

## CI/CD

两个 workflow 都运行在 GitHub 托管的 Runner 上，公开仓库免费且不计时长。它们**从不上传 workflow artifact**，因此不占用 Actions 的 artifact 存储。唯一用到的存储是依赖缓存（pnpm store 与 Rust `target/`），由 GitHub 单独管理并自动清理。

### `ci.yml`：每个 PR 和推送到 `main` 时运行

| 任务 | Runner | 触发条件 | 耗时 |
|---|---|---|---|
| 代码检查、类型检查、测试、构建 | ubuntu | 始终（仅修改文档时除外） | 约 1 分钟 |
| 桌面壳检查（`cargo clippy`） | windows | 仅当 `src-tauri/`、`package.json` 或 lockfile 有改动 | 有缓存时约 3 分钟，无缓存时更久 |

只修改 Markdown 或 `docs/` 的推送不会触发 CI。同一分支上被新提交取代的运行会被自动取消。

### `release.yml`：`main` 上的 `package.json` 改动时运行

```
prepare ──► verify（ubuntu：pnpm check）───────────────┐
        └─► build-windows（tauri build → 草稿 Release）┴─► publish（发布草稿、部署网页版）
                                                         └─► discard（任何一步失败则删除草稿）
```

1. **prepare** 读取版本号并检查 `v<版本>` 标签是否存在。如果已存在（例如只是升级了依赖），后续步骤都不会运行。
2. **verify** 与 **build-windows** 并行运行。Windows 任务构建 NSIS 安装包，复制便携版 exe，生成 `SHA256SUMS.txt`，并直接上传到一个**草稿** GitHub Release。Release 附件不计入 Actions 存储。
3. 两者都成功后，**publish** 才会运行：正式发布草稿（标记为 *latest*；`2.1.0-beta.1` 这类版本标记为 *pre-release*），并把网页版推送到 `gh-pages` 分支。
4. 如果检查失败，**discard** 会删除草稿，有问题的构建永远不会成为正式版本。

更新说明由三部分组成：`scripts/release-notes.mjs` 生成的下载表格、`CHANGELOG.md` 中对应版本的段落，以及 GitHub 自动生成的已合并 PR 与提交列表。

### 发布流程

```bash
pnpm version:bump minor          # 2.0.0 → 2.1.0（同步修改 package.json、Cargo.toml、Cargo.lock）
# 可选：在 CHANGELOG.md 中添加 "## [2.1.0]" 段落
git commit -am "chore: release v2.1.0"
git push                         # 推送到 main（直接推送或合并 PR）
```

预发布版本（`pnpm version:bump 2.1.0-beta.1`）会作为 GitHub pre-release 发布，不会更新网页版，也不会触发应用内的更新提示。发布失败时，可以在 Actions 页面重新运行该 workflow（可重复执行），或使用 **Run workflow** 手动触发。

### 仓库一次性设置

- **Settings → Pages**：Source 选 *Deploy from a branch*，分支选 `gh-pages` / root。只有网页版需要；`gh-pages` 分支会在第一次发布后出现。
- **Settings → Actions → General → Workflow permissions**：workflow 会自行申请 `contents: write`，保持默认的只读设置即可。
