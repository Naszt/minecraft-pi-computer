# Minecraft 模块化 π 计算机

这是一个面向协作搭建者的交互式架构说明。它把 C++ 原型中的 ALU、级联内存块、QUE / MDF / STEP / PRINT 总线和水龙头输出过程可视化，用于对照 Minecraft 红石实体电路。

## 核心规则

- 每块内存模块包含 14 个 16 位存储字。
- 每增加一块模块，增加约 4 位十进制精度。
- 算法本身约为 O(n²)，实体电路中级联通信使总体成本约为 O(n³)。
- 正确内存布局需使中继器错位，避免相邻信号串扰。

## 仓库结构

- `web/`：交互式可视化页面。
- `原理模式.cpp`：原型计算与模块通信代码。
- `代码原理.md`：数学推导与 Spigot 算法说明。
- `可视化.png`：原始手绘架构草图。

## 本地预览

```bash
cd web
npm install
npm run dev
```

推送到 `main` 分支后，GitHub Actions 会自动构建并发布 GitHub Pages。发布流程使用 GitHub 官方推荐的 `configure-pages`、`upload-pages-artifact` 和 `deploy-pages` 操作。
