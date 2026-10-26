# MarkEdit Preview Theme Pack

一个 MarkEdit 插件，内置五套**预览主题**，把标题折叠层级控制扩展到 **Markdown 源码模式**，并支持把当前主题导出为独立 HTML（可用浏览器打印成 PDF）：

| 主题 | 说明 |
| --- | --- |
| ITS | 原有的 ITS 预览样式，H3 及以下自动折叠 |
| Maple Light | Maple 列表体系，浅色；灰轨始终显示，hover 行出现绿色 active 分支 |
| Maple Dark | 同上，深色 |
| Obsidianite | 深色霓虹、7px 点、14px 任务框、点/框居中的导轨 |
| Obsidianite Brackets | Obsidianite 的副本：竖线换成右侧 teal 括号，包住本级与所有子级；标记逐级变小 |

## 为什么是一个插件

五套主题都会修改同一个 `.markdown-body`。如果拆成多个插件，它们会同时往预览里注入 CSS，最终效果取决于加载顺序；切换主题还得去扩展管理里启用/禁用并重启，容易互相打架。合并成一个插件后：

- 同一时间只有一个主题的 CSS 作用域生效；
- 切换主题不需要重启；
- 折叠状态、任务框、列表装饰只维护一套逻辑。

## 安装

```bash
cd markedit-preview-theme-pack   # 或你的本地目录名
./scripts/install-theme-pack.sh
```

安装脚本会：

1. 运行 `scripts/build-theme-pack.js` 生成 `dist/markedit-theme-pack.js`；
2. 复制到 MarkEdit 的 `scripts/`；
3. 在 `extensions.json` 中启用 `markedit-theme-pack`，并**移除原来的 `markedit-theme-its-preview` 条目和安装目录里的旧脚本**（避免两套 ITS CSS 重复；旧脚本会备份到 `/tmp`）；
4. 在 `settings.json` 中确保存在 `extension.markeditThemePack` 默认配置；
5. 备份 `extensions.json` 和 `settings.json` 到 `/tmp/markedit-theme-pack-backup-*`。

安装后退出并重新打开 MarkEdit。

## 切换主题

菜单路径：

**扩展功能 > Preview Theme > ITS / Maple Light / Maple Dark / Obsidianite / Obsidianite Brackets**

当前主题会在菜单里打勾，点击后立即生效，不需要重启。

选择会写入：

```
~/Library/Containers/app.cyan.markedit/Data/Documents/.markedit-theme-pack.json
```

下次启动会优先恢复这个文件里的主题。删掉该文件后，会回退到 `settings.json` 里的 `theme`。

## 折叠层级菜单

菜单路径：**扩展功能 > 折叠层级**，预览模式和 Markdown 源码模式都可以使用。选项语义：

- **全部折叠**：把每一级标题区块都折叠（嵌套折叠）。展开 H1 后，H2 仍然是折叠状态；再展开 H2，H3 仍然折叠，可以这样逐层展开。
- **全部打开**：一次展开所有标题区块（源码模式中只展开标题折叠，代码块折叠不受影响）。
- **折叠到 H1–H6**：把 Hx 及更深的**每一级**标题区块折叠。H1–H(x-1) 的标题与正文保持原样；Hx 标题行仍然可见，只收起它下面的正文和更深层子区块；展开 Hx 后，H(x+1) 仍保持折叠，同样可以逐层展开。例如「折叠到 H3」保留 H1/H2 的内容完整显示，折叠 H3、H4…H6 每一级。
- 如果文档中没有 Hx 或更深的标题，该级别选项会禁用（例如只有 H1–H3 时，H3 可用，H4–H6 不可用）。

预览模式的主题标题折叠：标题左侧的三角默认隐藏，鼠标 hover 标题行时才显示，点击即可折叠/展开；标题左侧保留 32px 的透明 hover 区域，三角自身还有 8px 的点击热区，所以从标题移动到三角时不会消失，也更容易点中。ITS 的标题三角也改为 hover 显示。

源码模式直接操作 CodeMirror 折叠状态：菜单会按当前文档重新计算折叠，并在操作后同步行号槽的折叠三角；手动点击三角折叠/展开后，菜单的勾选状态也会随之更新。源码模式不会在打开文档时自动折叠，只有点击菜单项才会生效。ITS 的 `autoFold` 启动设置仍然只作用于 ITS 预览；预览标题状态会在预览重渲染和主题切换时保留，但不会跨应用重启保存（ITS 的自动折叠除外）。

### 工具栏按钮

MarkEdit 没有扩展级工具栏 API。安装脚本会在 `settings.json` 的 `editor.customToolbarItems` 中注册一个菜单型工具栏项：

```json
{
  "title": "折叠层级",
  "icon": "chevron.up.chevron.down",
  "menuName": "折叠层级"
}
```

重启 MarkEdit 后，右键工具栏 → **Customize Toolbar**（自定义工具栏），把「折叠层级」拖入工具栏即可；它点开就是上面的完整选项菜单。

## 导出主题 HTML / PDF

菜单：**扩展功能 > Preview Theme > 导出当前主题 HTML…**

导出过程会调用 MarkEdit-preview 的 `window.MarkEditGetHtml(true)` 取得完整 HTML，然后：

1. 在 `.markdown-body` 上写入当前主题的 `data-preview-theme`；
2. 把主题包 CSS 追加到文档末尾，覆盖 MarkEdit-preview 的 GitHub base CSS；
3. 把文档目录下的本地相对图片读成 base64 data URL（`MarkEdit.getFileObject`），让 HTML 尽量成为单文件；
4. 追加导出页样式：屏幕端最大宽度 900px，打印端 A4、16mm/14mm 页边距、`print-color-adjust: exact`，代码块 `pre-wrap` 换行，表格/图片尽量不跨页；
5. 用 `MarkEdit.showSavePanel` 保存为 `<文档名>-<主题>.html`。如果当前 MarkEdit 没有保存面板，则把 HTML 复制到剪贴板。

PDF 不在扩展里生成，直接用浏览器打开导出的 HTML，`Cmd+P` → **存储为 PDF**。Chrome / Edge 的打印对话框如果显示「背景图形 / Background graphics」，请勾选；深色主题需要它才能把整页背景印出来。

边界：

- 远程图片保留原 URL，不会下载内联；mermaid 仍依赖 MarkEdit-preview 导出的 jsDelivr 脚本，需要联网。
- 字体使用系统已有字体；Obsidianite 的 Rubik 没有内嵌，缺字体时会回退到系统无衬线字体。
- MarkEdit 自带「文件 > 共享 > 导出到 PDF」和本仓库外部的 `PDF Export` 扩展都使用各自的模板，不会读取预览主题 CSS；主题化 PDF 请走浏览器打印。

## settings.json 配置

```json
"extension.markeditThemePack": {
  "theme": "obsidianite-bracket",
  "autoFold": true,
  "autoFoldLevel": 3,
  "listFolding": true,
  "debug": false
}
```

- `theme`：`its` / `maple-light` / `maple-dark` / `obsidianite` / `obsidianite-bracket`，作为没有状态文件时的初始主题。
- `autoFold`、`autoFoldLevel`：只对 ITS 生效，保持原 ITS 插件的 H3 自动折叠行为。
- `listFolding`：所有主题的列表折叠（hover 才显示三角）。
- `debug`：写入 `Documents/debug/theme-pack-debug.json`，包含当前主题、计算后的背景色、标记尺寸、括号边框、任务框中心偏差等，便于微调。

> 菜单选择会覆盖 `settings.json` 里的 `theme`。如果想让 settings 里的值生效，先删除 `.markedit-theme-pack.json`。

## 开发文件

| 文件 | 用途 |
| --- | --- |
| `../src/theme-pack-main.js` | 插件行为：菜单、主题切换、折叠、Maple hover 分支、持久化、debug |
| `../src/theme-pack-themes.css` | Maple / Obsidianite / Brackets 的 scoped CSS |
| `../src/its/markedit-theme-its-preview.js` | 原 ITS 插件源码；build 时提取其中的 ITS CSS。项目里保留，安装目录中的同名副本会被删除 |
| `../scripts/build-theme-pack.js` | 拼接 CSS + JS，生成 `../dist/markedit-theme-pack.js` 并做语法检查 |
| `../scripts/install-theme-pack.sh` | 构建、安装、更新 extensions/settings，并清理旧 ITS 安装 |
| `../pages/theme-pack-harness.html` | 带 GitHub base 与 mock MarkEdit 的浏览器联调页，支持主题切换 |
| `../dist/markedit-theme-pack.js` | 生成的安装文件（不要直接改 CSS） |

CSS 全部限定在 `.markdown-body[data-preview-theme="..."]` 下，不会影响编辑器或其它扩展。

> **不要给 `.markdown-body` 本身设置 `position` / `display` / `min-height`。**
> MarkEdit-preview 的覆盖模式依赖
> `.markdown-body.overlay { position: absolute; inset: 0; display: block; z-index: 10000; }`。
> 一旦在主题 CSS 里把 `position` 改成 `relative`，预览会被挤进普通文档流，菜单虽然显示“预览（覆盖）”，屏幕上却还是源码，看起来像切换失效。

## 已知边界

- 数字列表（`<ol>`）使用原生数字作为标记；装饰圆点/导轨只作用于无序列表（`<ul>`）。Brackets 的数字列表仍保留括号，但括号会放在数字右侧；折叠三角也按数字列表重新定位。
- Maple 表格显式设置表头、单元格背景和文字颜色，避免宿主处于深色外观时 GitHub 深色表格变量透入；表头仍为主题绿色，偶数行使用主题底色混合。
- 深色三主题（Maple Dark / Obsidianite / Obsidianite Brackets）显式覆盖了 highlight.js 的代码 token 颜色。MarkEdit-preview 在宿主为浅色外观时会注入 GitHub 浅色调色板，字符串（`#032f62`）和注释在深色代码背景上几乎不可读；现在 Maple Dark 使用 GitHub Dark 调色，Obsidianite/Brackets 使用青/粉/琥珀调色。行内代码颜色不受影响。
- Obsidianite/Brackets 的表格显式设置深色表面：表头是 7% accent 混合 `--ob-panel`，正文使用 `--ob-panel`，偶数行叠加 4% accent；表格内的行内代码用 10% accent 背景与单元格区分。这样不会让 GitHub 的浅色表格变量在深色主题里透出白底。
- ITS 的标题自动折叠只属于 ITS；Maple/Obsidianite 只折叠列表，与之前的样张一致。
- Maple 的 active 分支是 hover 行为；静态截图里的 active 行是用 demo 路径生成的。
- Obsidianite 是深色主题，会同时设置页面 overscroll 背景；Maple 浅色/深色也会同步预览页背景。
- 旧的独立 ITS 安装器已归档为 `../archive/install-legacy-its.sh`，默认拒绝执行；只有显式加 `--force` 才会重新安装，且会与主题包重复。正常使用主题包时不要运行它。主题包已内嵌 ITS，不再依赖安装目录里的 `markedit-theme-its-preview.js`。

## 截图

五套预设的样张（同一个 [`pages/obsidian-themes.html`](../pages/obsidian-themes.html) 文档，顶部可直接切换）：

- [ITS](../previews/presets/theme-its.png)（样张固定浅色；插件内 ITS 跟随系统深浅色）
- [Maple Light](../previews/presets/theme-maple-light.png)
- [Maple Dark](../previews/presets/theme-maple-dark.png)
- [Obsidianite](../previews/presets/theme-obsidianite.png)
- [Obsidianite Brackets](../previews/presets/theme-obsidianite-bracket.png)
- [Brackets 括号细节](../previews/details/theme-obsidianite-bracket-curve.png)
