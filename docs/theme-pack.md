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

**扩展功能 > Preview Theme > 默认（不套用） / ITS / Maple Light / Maple Dark / Obsidianite / Obsidianite Brackets**

当前主题会在菜单里打勾，点击后立即生效，不需要重启。「默认（不套用）」表示主题包不参与样式，见下一节。

选择会写入：

```
~/Library/Containers/app.cyan.markedit/Data/Documents/.markedit-theme-pack.json
```

下次启动会优先恢复这个文件里的主题。删掉该文件后，会回退到 `settings.json` 里的 `theme`。

## 默认（不套用）档位

菜单第一项 **扩展功能 > Preview Theme > 默认（不套用）** 不是一个主题：选中后插件会把 `.markdown-body` 上的 `data-preview-theme`、`data-theme-pack-tone`、`data-theme-pack-mermaid-paint` 和页面 `data-theme-pack-surface` 全部摘掉，并把 `color-scheme` 清空。主题包的所有 CSS 规则都限定在 `[data-preview-theme]` 作用域里，所以摘掉属性就等于完全不介入——预览样式交还给 MarkEdit-preview 的 GitHub base 和你另外安装的主题扩展（例如 catppuccin / nushu / vscode）。

- 折叠层级、列表折叠、源码模式折叠、表头吸顶这些**行为**功能在该模式下照常工作。
- 标题折叠三角在该模式下没有主题装饰（用浏览器默认按钮样式），功能不受影响。
- 导出当前主题 HTML 在该模式下导出的是未套主题的预览原样，文件名后缀为 `-default.html`。

## 表头吸顶（sticky table header）

长表格向下滚动时，表头行会停在预览区顶部。开关在 `settings.json`：

```json
"extension.markeditThemePack": {
  "stickyTableHeader": true
}
```

改成 `false` 后需要重启 MarkEdit 生效（安装脚本会给已有配置补上这个键，默认 `true`）。

实现要点：

- 吸顶是**行为**而不是配色，所以它挂在独立属性 `[data-theme-pack-table-sticky]` 上，规则用 `:where(thead th)` 把特异性压到只剩这个属性——每套主题自己的表头背景/文字色规则更具体，仍然生效；表头底色取 `--bgColor-muted → --color-bg-subtle → canvas`（GitHub 同款回退链，`canvas` 跟随当前深浅色），文字色不覆盖，因此**在「默认（不套用）」档位和别人的主题下也照样吸顶**。
- GitHub base 原本给每个 `<table>` 加了 `display: block; width: fit-content; overflow: auto`（宽表横向滚动）。这会让表格自己变成滚动容器，吸顶就失效，所以开启吸顶时改回 `display: table; width: auto; max-width: 100%; overflow: visible`。
- **代价**：非常宽的表格不再有自己的横向滚动条，而是把页面撑宽、由预览整体横向滚动。CSS 无法同时做到「表格内横向滚动」和「表头跟随页面吸顶」（`overflow-x: auto` 必然让该轴之外的 `overflow-y` 也变成 `auto`）。需要 GitHub 原来的行为就把 `stickyTableHeader` 设为 `false`。
- **贴顶位置要减掉 pane 的 padding-top**：WebKit 把 sticky 停在滚动容器的**内容框**上，而容器的 `padding-top` 会跟内容一起滚走，所以 `top: 0` 会让表头停在 padding 之下、上面露出一条能看见滚动内容的空隙。WKWebView 实测：padding 36 → 停在 36，25 → 停在 25，0 → 0。MarkEdit-preview 恰好让 `.markdown-body` 自己滚动（`overflow: scroll`）并且每套主题都带顶部 padding，所以插件按运行时量到的 `paddingTop` 写入 `--theme-pack-sticky-top: -36px`（harness 实测 Obsidianite -36px、ITS -25px，容器不滚时回到 0px），CSS 用 `top: var(--theme-pack-sticky-top, 0px)`。导出的 HTML 由文档滚动，所以导出时把该变量强制写成 `0px`（`MarkEditGetHtml` 会把面板的行内样式一起复制过来，不覆盖就会把表头顶出可视区）。
- **分隔线只留一条**：表头底色必须不透明，而 `border-collapse: collapse` 下吸顶单元格不画边框，所以表头底边用 `box-shadow: inset 0 -1px 0 …` 画；同时把表头的 `border-bottom` 和首行单元格的 `border-top` 置 0（用 `!important`，因为各主题在后面又用 `border` 简写重申了一遍），否则正常显示时 inset 线和真实边框会隔 1px 变成双线。Maple 是 `border-collapse: separate`，绿色表头块本身就是边界，所以它的 `box-shadow` 关掉（否则灰线会画在绿色块内部）。
- Obsidianite 表头底色从 7% accent 提到 **16%**（body 单元格是 `--ob-panel`，偶数行 4%），表头和正文的层次更明显；吸顶的分隔线用 50% teal。
- Maple 表格原先靠 `overflow: hidden` 裁圆角，这同样会破坏吸顶；现在圆角由四个角上的单元格自己带（`thead th:first/last-child` 上圆角、`tbody tr:last-child td:first/last-child` 下圆角），外观不变。
- 导出 HTML 会带上同样的属性和规则，所以在浏览器里滚动也吸顶；打印成 PDF 时 Chrome/Safari 会自己把 `thead` 重复到每一页。

## 折叠层级菜单

菜单路径：**扩展功能 > 折叠层级**，预览模式和 Markdown 源码模式都可以使用。选项语义：

- **全部折叠**：把每一级标题区块都折叠（嵌套折叠）。展开 H1 后，H2 仍然是折叠状态；再展开 H2，H3 仍然折叠，可以这样逐层展开。
- **全部打开**：一次展开所有标题区块（源码模式中只展开标题折叠，代码块折叠不受影响）。
- **折叠到 H1–H6**：把 Hx 及更深的**每一级**标题区块折叠。H1–H(x-1) 的标题与正文保持原样；Hx 标题行仍然可见，只收起它下面的正文和更深层子区块；展开 Hx 后，H(x+1) 仍保持折叠，同样可以逐层展开。例如「折叠到 H3」保留 H1/H2 的内容完整显示，折叠 H3、H4…H6 每一级。
- 如果文档中没有 Hx 或更深的标题，该级别选项会禁用（例如只有 H1–H3 时，H3 可用，H4–H6 不可用）。

预览模式的主题标题折叠：标题左侧的三角默认隐藏，鼠标 hover 标题行时才显示，点击即可折叠/展开；标题左侧保留 32px 的透明 hover 区域，三角自身还有 8px 的点击热区，所以从标题移动到三角时不会消失，也更容易点中。ITS 的标题三角也改为 hover 显示。

源码模式直接操作 CodeMirror 折叠状态：菜单会按当前文档重新计算折叠，并在操作后同步行号槽的折叠三角；手动点击三角折叠/展开后，菜单的勾选状态也会随之更新。源码模式不会在打开文档时自动折叠，只有点击菜单项才会生效。ITS 的 `autoFold` 启动设置仍然只作用于 ITS 预览；预览标题状态会在预览重渲染和主题切换时保留，但不会跨应用重启保存（ITS 的自动折叠除外）。

从源码模式切换到预览模式时，插件会按当前光标/可视行在预览里定位到对应的 `data-line-from` 块，并调用 Bidirectional Preview Sync 的 `beginPreviewScroll` 标记滚动来源，避免把预览滚动反向同步到编辑器；等待预览重渲染和装饰完成后再校正一次位置。

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

## 明暗 tone 自动配色

每套主题只声明一个 `tone`：

| 主题 | tone | 含义 |
| --- | --- | --- |
| ITS | `auto` | 跟随系统深浅色 |
| Maple Light | `light` | 始终浅色 |
| Maple Dark / Obsidianite / Obsidianite Brackets | `dark` | 始终深色 |

插件把解析后的值写到 `.markdown-body[data-theme-pack-tone="dark|light"]`（`auto` 会在这里落成具体的 light/dark，系统切换深浅色时重新解析），派生配色全部由它决定：

- 代码块 token：`--code-fg / --code-keyword / --code-string / --code-comment / --code-addition …`，浅色用 GitHub Light，深色用 GitHub Dark；Maple Dark、Obsidianite 在各自的主题块里再覆盖一次，保留主题自己的色相。
- mermaid：MarkEdit-preview 用 mermaid v12 的 neo 外观，图表配色写在 SVG 自带的 `#mermaid-xxx …` 样式里，只看宿主深浅色。插件用 `[data-theme-pack-mermaid-paint]` 控制覆盖，规则是 **只有深色主题才覆盖**（`shouldPaintMermaid(tone) => tone === "dark"`）：深色主题在浅色宿主下会拿到淡紫/白的原生图，接近黑底黑字，必须重画；浅色主题则一律保留 mermaid 自己的配色（淡紫 actor + 黄便签），因为那套颜色比主题色更耐看，覆盖它会把 `classDef` 的彩色节点压平、还会让图表和奶油底色糊在一起。代价是：浅色主题 + 深色宿主时图会是 mermaid 的深色调色板（图内自洽，只是和页面明暗不一致）。
- ITS 原本用 `@media (prefers-color-scheme: dark)` 切换自己的 `--its-*` 变量；构建时（`unwrapItsDarkAppearance`）会把这一段改写成 `[data-theme-pack-tone="dark"]` 选择器，让深浅色只有一个来源。这样导出的 HTML 把当时看到的 tone 冻结下来，换一台深浅色相反的机器打开也不会出现「深色代码块 + 浅色正文」的错位。

新增主题时只需要在 `THEMES` 里给出 `tone`，代码块与 mermaid 会自动套用对应调色板；只有想要不同的主题色时才在 CSS 里覆盖 `--code-*` / `--mermaid-*`。

不启动 MarkEdit 也能检查配色：在仓库根目录 `python3 -m http.server`，打开 `pages/tone-check.html`，页面会直接从 `dist/markedit-theme-pack.js` 里取出 CSS，为每套主题写死一个 tone 面板；「宿主切到深色」勾选框切换的是替身 SVG 的 mermaid 原生调色板，用来演示深色主题被覆盖、浅色主题不被覆盖。`pages/theme-pack-harness.html` 加载真正的 highlight.js 与 mermaid（走 jsDelivr），文档里包含 Python/JSON/Bash/diff 代码块、对齐表格、时序图（autonumber + note）、含 `classDef` 的流程图、状态图、饼图、嵌套引用、`details`、相对路径图片和脚注，能直接看到实际效果。浏览器的系统深浅色不一定等于 MarkEdit 的，所以 harness 支持 `?host=light|dark` 固定这个输入（同时切换 hljs 样式表和 mermaid 初始化主题），页面顶部会显示当前宿主外观。

## 导出主题 HTML / PDF

菜单：**扩展功能 > Preview Theme > 导出当前主题 HTML…**

导出过程会调用 MarkEdit-preview 的 `window.MarkEditGetHtml(true)` 取得完整 HTML，然后：

1. 在 `.markdown-body` 上写入当前主题的 `data-preview-theme`、解析后的 `data-theme-pack-tone`，深色主题再补一个 `data-theme-pack-mermaid-paint`（决定导出的图要不要重画）；
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
  "stickyTableHeader": true,
  "debug": false
}
```

- `theme`：`none`（默认，不套用）/ `its` / `maple-light` / `maple-dark` / `obsidianite` / `obsidianite-bracket`，作为没有状态文件时的初始主题。
- `autoFold`、`autoFoldLevel`：只对 ITS 生效，保持原 ITS 插件的 H3 自动折叠行为。
- `listFolding`：所有主题的列表折叠（hover 才显示三角）。
- `stickyTableHeader`：长表格表头吸顶，默认 `true`；改成 `false` 会恢复 GitHub 的「表格自带横向滚动条、表头随页面滚走」行为。改完需重启 MarkEdit。
- `debug`：写入 `Documents/debug/theme-pack-debug.json`，包含当前主题、计算后的背景色、标记尺寸、括号边框、任务框中心偏差等，便于微调。

> 菜单选择会覆盖 `settings.json` 里的 `theme`。如果想让 settings 里的值生效，先删除 `.markedit-theme-pack.json`。

## 开发文件

| 文件 | 用途 |
| --- | --- |
| `../src/theme-pack-main.js` | 插件行为：菜单、主题切换、折叠、Maple hover 分支、持久化、debug |
| `../src/theme-pack-themes.css` | Maple / Obsidianite / Brackets 的 scoped CSS |
| `../src/its/markedit-theme-its-preview.js` | 原 ITS 插件源码；build 时提取其中的 ITS CSS。项目里保留，安装目录中的同名副本会被删除 |
| `../scripts/build-theme-pack.js` | 拼接 CSS + JS，生成 `../dist/markedit-theme-pack.js` 并做语法检查；同时把 ITS 的 `prefers-color-scheme` 深色块改写成 `[data-theme-pack-tone="dark"]` |
| `../scripts/install-theme-pack.sh` | 构建、安装、更新 extensions/settings，并清理旧 ITS 安装 |
| `../pages/theme-pack-harness.html` | 带 GitHub base 与 mock MarkEdit 的浏览器联调页：主题按钮、折叠按钮，外加 highlight.js + mermaid（jsDelivr）渲染的代码块/diff/表格/时序图/流程图/状态图/饼图/引用/图片/脚注，尽量复现 MarkEdit-preview 的真实渲染链 |
| `../pages/tone-check.html` | 六个面板（含 ITS 浅/深）直接写死 `data-theme-pack-tone`，不用启动 MarkEdit 就能核对代码块与 mermaid 的 tone 配色；「模拟深色宿主」复选框用来演示 `data-theme-pack-mermaid-paint` |
| `../dist/markedit-theme-pack.js` | 生成的安装文件（不要直接改 CSS） |

CSS 全部限定在 `.markdown-body[data-preview-theme="..."]` 下，不会影响编辑器或其它扩展。

> **不要给 `.markdown-body` 本身设置 `position` / `display` / `min-height`。**
> MarkEdit-preview 的覆盖模式依赖
> `.markdown-body.overlay { position: absolute; inset: 0; display: block; z-index: 10000; }`。
> 一旦在主题 CSS 里把 `position` 改成 `relative`，预览会被挤进普通文档流，菜单虽然显示“预览（覆盖）”，屏幕上却还是源码，看起来像切换失效。

## 已知边界

- 数字列表（`<ol>`）使用原生数字作为标记；装饰圆点/导轨只作用于无序列表（`<ul>`）。Brackets 的数字列表仍保留括号，但括号会放在数字右侧；折叠三角也按数字列表重新定位。
- Maple 表格显式设置表头、单元格背景和文字颜色，避免宿主处于深色外观时 GitHub 深色表格变量透入；表头仍为主题绿色，偶数行使用主题底色混合。
- 代码块 token 颜色按 `data-theme-pack-tone` 取值，不再按主题硬编码。背景是：MarkEdit-preview 在宿主为浅色外观时注入 GitHub 浅色 highlight.js 调色板，字符串（`#032f62`）和注释在深色预览背景上几乎不可读。深色 tone 用 GitHub Dark，Maple Dark / Obsidianite 再覆盖成各自主题色相；行内代码颜色不受影响。
- mermaid 的配色只看宿主外观，不看主题：浅色宿主 + 深色主题会拿到淡紫底、深色文字的图，放在深色页面上接近一片黑。插件只在深色 tone 下用 `--mermaid-*` 重写 SVG 的常见元素（actor、node、cluster、edgeLabel、marker、message/loop/label 文本、lifeline、sequence number 圆圈等），文本换成更亮的主题前景色；便签改成低饱和琥珀底 + 琥珀字，不再用刺眼的纯黄块，并关闭 mermaid 的 drop-shadow 滤镜。**浅色主题一律不覆盖**，保留 mermaid 原生配色与 `classDef` 彩色节点——实测这套比按主题重画的效果更好；副作用是深色宿主 + 浅色主题时图仍是 mermaid 自己的深色版（图内自洽，只是与页面明暗不一致）。
- Obsidianite/Brackets 的表格显式设置深色表面：表头是 7% accent 混合 `--ob-panel`，正文使用 `--ob-panel`，偶数行叠加 4% accent；表格内的行内代码用 10% accent 背景与单元格区分。这样不会让 GitHub 的浅色表格变量在深色主题里透出白底。
- 表头吸顶开启时，表格从 GitHub base 的 `display:block; overflow:auto` 改回普通表格盒子（否则吸顶无效）。副作用是很宽的表格会撑宽页面、由页面横向滚动，而不是表格内部出现横向滚动条；不想要吸顶就把 `stickyTableHeader` 设为 `false`。表头贴顶位置已按面板 `padding-top` 反向补偿，表头分隔线也只保留一条（详见上一节）。
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
