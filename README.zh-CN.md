<div align="center">

# BA 禁选工具

[English](README.md) · **简体中文**

用于非官方 **蔚蓝档案（Blue Archive）** PvP 比赛的禁用 / 选择（Ban/Pick）面板。<br>
专为主办方和解说设计：把学生拖进禁用位和阵容，规则由工具自动判定。

[![CI](https://github.com/Kazeshima/BA-BP/actions/workflows/ci.yml/badge.svg)](https://github.com/Kazeshima/BA-BP/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Kazeshima/BA-BP?label=%E4%B8%8B%E8%BD%BD)](https://github.com/Kazeshima/BA-BP/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[**下载 Windows 版**](https://github.com/Kazeshima/BA-BP/releases/latest) · [**在线使用**](https://kazeshima.github.io/BA-BP/) · [使用指南](docs/user-guide.zh-CN.md)

<img src="docs/images/screenshot-light-zh.webp" alt="明亮主题（中文界面）" width="49%"> <img src="docs/images/screenshot-dark-en.webp" alt="暗色主题（英文界面）" width="49%">

</div>

## 功能

- **完整学生列表**：数据来自 [SchaleDB](https://schaledb.com)，名称可选 简中（民译）/ 简中（国服）/ 繁中 / 日本語 / 한국어 / English，并可按日服、国际服、国服的实装情况筛选。数据会缓存，断网也能用。
- **拖拽禁选**：双方各自的禁用位、最多 80 个共享禁用位；阵容支持 **4 主力 + 2 支援** 和 **6 通用** 两种模式。
- **拖动时即时判定规则**：拖动过程中槽位会显示绿色（可放）或红色（不可放）。不能选择已禁用的学生，不能重复选择，不能把主力放进支援位。不合法的操作会提示原因。
- **特殊规则模式**：表演赛可解除限制。只有阵容重新合法后才能退出该模式，违规的槽位会以红色高亮。
- **自由学生**（可重复出战、无视禁用）和 **保护位**（永远不能被禁用）。
- 所有禁选操作都支持 **撤销 / 重做**（`Ctrl+Z` / `Ctrl+Shift+Z`）。
- **比分和选择计时**：支持暂停和继续，带进度条和可选的倒计时提示音（`空格` 开始 / 暂停）。
- **局间重置** 保留共享禁用和比分；**完全重置** 从头开始。
- **存档**：把不会出现在比赛中的学生移出主列表。
- **中英双语界面**、**明亮 / 暗色主题**，以及适合直播的全屏模式（`F11`）。
- **自动保存**：禁选面板、玩家名称、头像和设置在重启后都会保留，并自动迁移 v1.x 的设置。
- **轻量桌面应用**（Tauri + WebView2，仅几 MB），提供免安装版 `.exe`，也可在浏览器中使用同样的功能。

## 下载

| | |
|---|---|
| **Windows 安装版** | 在 [Releases](https://github.com/Kazeshima/BA-BP/releases/latest) 下载 `BA-Draft-Tool_<版本>_x64-setup.exe` |
| **Windows 便携版** | `BA-Draft-Tool_<版本>_x64-portable.exe`，无需安装 |
| **网页版** | <https://kazeshima.github.io/BA-BP/>，任何现代浏览器均可 |

桌面版需要 [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)（Windows 10/11 已自带）。程序每天检查一次 GitHub 上的新版本，有更新时会提示。

## 快速上手

1. 打开程序，学生列表会自动从 SchaleDB 加载。
2. **禁用**：把学生从列表拖到红色禁用位（或金色的共享禁用位）。
3. **选择**：把学生拖到双方的出战槽位。点 `4+2` / `6 通用` 切换阵容模式。
4. **修正**：把学生拖回列表、右键槽位，或按 `Ctrl+Z`。
5. **局间**：点 **局间重置**，更新比分，用 **⇄** 交换双方。

完整的规则和快捷键见 [使用指南](docs/user-guide.zh-CN.md)。

## 开发

需要 Node.js 22+ 和 pnpm。构建桌面版还需要 Rust 以及 [Tauri 环境依赖](https://v2.tauri.app/zh-cn/start/prerequisites/)。

```bash
pnpm install
pnpm dev            # 网页版：http://localhost:1420
pnpm tauri dev      # 桌面版（热重载）
pnpm check          # 代码检查 + 类型检查 + 测试 + 版本一致性
pnpm tauri build    # 构建 Windows 安装包
```

**发布完全自动化**。修改版本号并推送到 `main` 即可：

```bash
pnpm version:bump patch     # 或 minor / major / 2.1.0-beta.1
git commit -am "chore: release v2.0.1" && git push
```

CI 会构建安装版和便携版，发布带更新说明的 GitHub Release，并部署网页版。流水线使用免费的 GitHub 托管 Runner，不上传任何 workflow artifact。架构和 CI/CD 设计见 [docs/development.zh-CN.md](docs/development.zh-CN.md)。

## 致谢

学生数据和图片来自 [SchaleDB](https://schaledb.com)。*Blue Archive / 蔚蓝档案* 是 NEXON Games / Yostar 的商标。本项目是非官方的爱好者作品，与上述各方无关。

基于 [MIT 许可证](LICENSE) 开源。
