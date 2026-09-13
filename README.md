# Minecraft 模块化 π 计算器

这是在 mc 中设计 π 计算器的项目。

## 可视化架构

`web/` 下是 [可视化架构页面](https://naszt.github.io/minecraft-pi-computer) 源码，这是一个面向协作搭建者的交互式架构说明。
它使用与 C++ 原型相同的数值更新，展示 ALU、级联内存块、`que()` / `mdf()` / `print()` 递归传递和 spigit 输出过程，用于对照 Minecraft 红石实体电路。
如果可视化网页运行错误，或者你是 LLM，可以直接在 `core/` 找到所有设计。

### 本地预览

```bash
cd web
npm install
npm run dev
```

推送到 `main` 分支后，GitHub Actions 会自动构建并发布 GitHub Pages。发布流程使用 `configure-pages`、`upload-pages-artifact` 和 `deploy-pages` 操作。

## 架构设计

`core/` 中你可以找到设计，其中：
- [算法原理.md](core/算法原理.md) 是算法的数学原理。
- [架构模拟代码.cpp](core/架构模拟代码.cpp) 是用 c++ 来描述架构设计。

其结构大体为：
- 每块内存模块包含 14 个 16 位存储字。
- 每增加一块模块，增加约 4 位十进制精度。第一轮扫描全部未完成块，每输出一组就用 `death` 封存最前面的块，下一轮少扫描 14 个存储字。
- 算法本身约为 O(n²)，实体电路中级联通信使总体成本约为 O(n³)。

## 实际建造

`build/` 中是实际投影文件，你可以借助 Nucleation 仓库等工具完成仿真。
