# Changelog

All notable changes to this project. Each release section is copied into the GitHub Release notes.
本项目的重要变更记录。每个版本的段落会自动写入 GitHub Release 说明。

## [2.0.0]

A complete rewrite with a new interface, stricter rules and automatic releases.
全面重写：全新界面、更严格的规则判定、自动化发布。

**New / 新功能**

- Bilingual interface (中文 / English) with light ("Schale") and dark themes. · 中英双语界面，提供明亮（Schale 风格）与暗色主题。
- Live drop preview: slots turn green or red while dragging, and rejected drops explain why. · 拖动时槽位实时显示绿 / 红，被拒绝的操作会提示原因。
- Undo / redo for every board change (`Ctrl+Z` / `Ctrl+Shift+Z`). · 所有禁选操作可撤销 / 重做。
- The draft, player names, avatars and scores survive a restart; v1 settings are migrated. · 禁选面板、玩家名称、头像、比分在重启后保留；自动迁移 v1 设置。
- Server filter (JP / Global / CN), Korean names, attack/armor type filters, alias search. · 新增服务器筛选（日服 / 国际服 / 国服）、韩文名称、攻击 / 防御类型筛选、别名搜索。
- Offline roster cache, timer pause/resume with countdown sounds, keyboard shortcuts, fullscreen, adjustable card size. · 学生列表离线缓存；计时可暂停 / 继续并带提示音；快捷键；全屏；卡片大小可调。
- Right-click menu: archive, mark as free, protect. Free & Protected panel is now a docked sidebar. · 右键菜单：存档、设为自由学生、加入保护位；自由 & 保护面板改为侧栏。
- Portable `.exe`, web version on GitHub Pages, in-app update notice. · 提供便携版 exe、GitHub Pages 网页版，以及应用内更新提示。

**Fixed / 修复**

- The same student could be banned twice, or moved from a ban into a team without being removed from the ban. · 同一学生可被重复禁用、从禁用位拖到阵容时未从禁用位移除。
- Pausing the timer and pressing start again restarted it from the full duration. · 暂停后再开始，计时会从头开始。
- Composite armor badges were grey, because the data uses `CompositeArmor`. · 复合装甲图标显示为灰色（数据中为 `CompositeArmor`）。
- Switching the name language left old names in filled slots. · 切换名称语言后，已放入槽位的学生仍显示旧名称。
- Dropping avatar images didn't work in the desktop app. · 桌面版无法拖入头像图片。
- Turning off special rules didn't check Striker/Special slot types. · 退出特殊规则时未检查主力 / 支援槽位类型。
- Fonts were loaded from Google Fonts, which is slow or blocked in some regions. They're now bundled. · 字体改为本地打包，不再依赖 Google Fonts（部分地区无法访问）。

## [1.0.0]

Initial release. · 首个版本。
