# MarkEdit Preview Theme Pack

一个跨 MarkEdit **预览模式**与 **Markdown 源码模式**的插件，内置五套可切换预览主题：ITS、Maple Light、Maple Dark、Obsidianite、Obsidianite Brackets。

切换位置：**扩展功能 > Preview Theme**（当前主题会打勾，点击立即生效）。

折叠控制：**扩展功能 > 折叠层级**，包含「全部折叠 / 全部打开 / 折叠到 H1–H6」，预览和源码模式都可用。预览中标题左侧三角默认隐藏，hover 标题行时显示，点击即可折叠；源码模式使用 MarkEdit 自带的折叠三角，菜单勾选状态会跟随手动折叠变化。安装脚本也把它注册为可拖入工具栏的菜单按钮。

## 安装 / 重建

### 自动安装（推荐）

```bash
cd markedit-preview-theme-pack   # 或你的本地目录名
./scripts/install-theme-pack.sh
```

脚本会构建 `dist/markedit-theme-pack.js`、安装到 MarkEdit、更新扩展配置，并清理旧的独立 ITS 插件（备份到 `/tmp`）。安装后重启 MarkEdit。

### 手动安装生成物

如果只想安装已经构建好的 `dist/markedit-theme-pack.js`（仓库里已提交这个文件），可以不运行安装脚本：

1. 把生成物复制到 MarkEdit 的扩展脚本目录（目录不存在时先创建）：

   ```bash
   mkdir -p ~/Library/Containers/app.cyan.markedit/Data/Documents/scripts
   cp dist/markedit-theme-pack.js \
     ~/Library/Containers/app.cyan.markedit/Data/Documents/scripts/
   ```

2. 完全退出并重新打开 MarkEdit。扩展脚本只在启动时加载，重启后才会生效。
3. 打开菜单 **扩展功能 > 管理扩展功能…**，确认 **markedit-theme-pack** 处于启用状态。新放进 `scripts/` 的脚本通常会被自动收编；如果列表里是关闭状态，手动打开开关即可。
4. 用 **扩展功能 > Preview Theme** 选择主题，用 **扩展功能 > 折叠层级** 使用折叠菜单。

手动复制只安装插件本身，不会自动注册「折叠层级」工具栏按钮。需要工具栏入口时，把下面这段加到 `~/Library/Containers/app.cyan.markedit/Data/Documents/settings.json` 的 `editor.customToolbarItems` 数组中，重启后在「自定义工具栏」里拖入：

```json
{
  "title": "折叠层级",
  "icon": "chevron.up.chevron.down",
  "menuName": "折叠层级"
}
```

> 如果之前装过独立的 ITS 插件，请删除或禁用 `scripts/markedit-theme-its-preview.js`，避免两套 ITS CSS 同时注入。主题包已内嵌 ITS，不再依赖那个文件。

## 五套预览

以下截图都来自同一个交互样张，点击图片可以查看原图。样张本身支持顶部实时切换主题：[pages/obsidian-themes.html](pages/obsidian-themes.html)。

### ITS

经典 ITS 预览样式，标题带装饰线；勾选 `autoFold` 时 H3 及以下会自动折叠。

[<img src="previews/presets/theme-its.png" width="680" alt="ITS 预览">](previews/presets/theme-its.png)

### Maple Light

Maple 的列表体系，浅色；灰色主轨始终显示，hover 行出现绿色 active 分支。

[<img src="previews/presets/theme-maple-light.png" width="680" alt="Maple Light 预览">](previews/presets/theme-maple-light.png)

### Maple Dark

Maple Light 的深色版本，列表导轨、空心圆点和任务框沿用同一套几何规则。

[<img src="previews/presets/theme-maple-dark.png" width="680" alt="Maple Dark 预览">](previews/presets/theme-maple-dark.png)

### Obsidianite

深色霓虹风格：7px 实心圆点、14px 任务框，圆点和方框都落在导轨中心线上。

[<img src="previews/presets/theme-obsidianite.png" width="680" alt="Obsidianite 预览">](previews/presets/theme-obsidianite.png)

### Obsidianite Brackets

Obsidianite 的括号变体：竖线换成右侧 teal 括号，包住本级和所有子级；层级标记逐级变小。

[<img src="previews/presets/theme-obsidianite-bracket.png" width="680" alt="Obsidianite Brackets 预览">](previews/presets/theme-obsidianite-bracket.png)

## 目录

```
.
├── src/
│   ├── theme-pack-main.js        # 菜单、主题切换、折叠、持久化
│   ├── theme-pack-themes.css     # Maple / Obsidianite / Brackets CSS
│   └── its/
│       └── markedit-theme-its-preview.js  # ITS 源码（构建时提取 CSS）
├── scripts/
│   ├── build-theme-pack.js       # 生成 dist/markedit-theme-pack.js
│   └── install-theme-pack.sh     # 构建 + 安装 + 清理旧插件
├── dist/
│   └── markedit-theme-pack.js    # 生成的可安装插件
├── pages/
│   ├── obsidian-themes.html      # 五主题交互样张
│   └── theme-pack-harness.html   # mock MarkEdit 联调页
├── previews/
│   ├── presets/                  # 五张整页预览
│   ├── details/                  # 列表、任务、括号细节
│   └── legacy-its/               # 旧 ITS harness 截图
├── docs/
│   └── theme-pack.md             # 安装、主题切换、配置、开发说明
├── archive/
│   ├── harness.html              # 旧 ITS harness
│   ├── prototype.html            # 早期原型
│   └── install-legacy-its.sh     # 旧独立 ITS 安装器（默认拒绝执行）
└── test.md                       # 本地测试文件（已加入 .gitignore，不随仓库分发）
```

详细说明见 [docs/theme-pack.md](docs/theme-pack.md)。

> 勿给 `.markdown-body` 设置 `position` / `min-height`：MarkEdit-preview 的覆盖模式依赖 `.markdown-body.overlay { position:absolute; inset:0; }`，覆盖它会让预览看起来仍是源码。
