# Day 7-8：集成 OSMD 与播放光标问题处理（两天）

这两天的目标：在播放 MIDI/MXL 乐谱时，使用 OpenSheetMusicDisplay（OSMD）实现可见并随播放移动的光标（cursor），并让渲染与播放体验稳定可用。

## 选择与集成（Day 7）
- 通过 LLM 推荐采用开源库 OSMD：https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- 参考以往思路，先在 `public/osmd-demo.html` 搭建静态页面验证：确认 OSMD 能正确渲染并配合音频播放。
- 集成到 Next.js 页面时遇到加载问题：前端调用的乐谱 URL 不显示（空白）。多次尝试后，LLM怀疑 OSMD 对后缀名存在解析依赖（是否必须以 `.mxl` 结尾不完全确定）。

- 【需要人工介入】上述“.mxl 后缀”问题在集成阶段由人工接管并最终确认与修正，LLM 未能完全自动解决。

## 光标不可见与样式冲突（Day 8）
- 现象：MXL 可正常播放，但乐谱上的光标不移动或不可见。
- 调试发现：Tailwind 的预设样式（preflight）为 `img` 设置了 `height: auto`，而 OSMD 渲染流程也会为内部元素施加高度控制；两者叠加导致高度计算出现异常（例如被压到 1px），最终光标不可见或不随播放移动。
- 解决：
  - 在预览页使用 CSS 级联层（`@layer base`）进行精确覆盖，取消 Tailwind 在该页对 `img`、`video` 的 `height: auto` 影响（使用 `height: revert-layer !important;`）。
  - 必要时局部隔离 OSMD 容器的样式（例如 `.osmd-host { box-sizing: content-box; position: relative; }`），避免全局规则影响光标定位与绘制。
  - 优化播放控制交互：为 Play / Pause / Stop 按钮增加 Tailwind 的 `disabled:` 状态样式，点击播放后禁用 Play 并启用 Pause/Stop；暂停或停止后按需恢复；将控制区（含节拍滑条与 BPM 显示）移至标题行右侧，移除全屏相关逻辑与按钮，简化 UI。
- 【需要人工介入】样式冲突与光标不可见问题的最终定位与解法（禁用或精准覆盖 Tailwind 的预设规则）由人工接管完成，LLM 在此场景下未能一次性自动修复。



## 结果与总结
- 现在 MXL 播放时，光标可以正常显示并随播放移动。
- UI 布局与交互稳定：按钮状态切换有明确的视觉反馈，控制区位置更便于操作。
- OSMD 成为统一的渲染与播放组件，替换了原先的 `html-midi-player` 与 PDF 预览组件。
- 本次工作跨两天完成（Day 7 & Day 8），多次迭代验证后，通过精准覆盖 Tailwind 的个别预设规则以及路由后缀调整，最终解决了光标显示与移动问题。