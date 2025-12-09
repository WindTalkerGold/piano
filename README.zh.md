# MIDI 乐谱库管理器

一个本地优先的网页应用程序，供钢琴爱好者上传 MIDI 或 MXL 文件，使用 MuseScore CLI 自动将其转换为乐谱（MXL 和 PDF 格式），并管理/搜索他们的音乐库。

## 功能特性

- **MIDI/MXL 上传**：用于上传 `.mid`/`.midi` 或 `.mxl` 文件的网页界面
- **自动转换**：使用 MuseScore CLI 进行转换（MIDI → MXL → PDF 或 MXL → PDF，并可选择生成 MIDI）
- **库管理**：浏览、搜索和组织您的乐谱收藏
- **PDF 预览**：直接在浏览器中查看乐谱
- **文件下载**：下载 PDF 和 MXL 文件
- **本地存储**：所有文件均本地存储，附带 JSON 元数据
- **无需数据库**：基于文件的存储，无外部依赖

## 技术栈

- **Next.js 14**（App Router）配合 TypeScript
- **Tailwind CSS** 用于样式设计
- **Lucide React** 用于图标
- **Formidable** 用于文件上传解析
- **fs-extra** 用于文件系统操作
- **MuseScore CLI** 用于 MIDI 转换

## 先决条件

1. **Node.js** 18+ 和 npm
2. 系统已安装 **MuseScore**
   - Windows：从 [musescore.org](https://musescore.org) 安装 MuseScore 4
   - Linux：`sudo apt install musescore` 或类似命令
   - macOS：`brew install musescore` 或从网站下载

## 快速开始

1. **克隆并安装**
   ```bash
   git clone <repository-url>
   cd midi-library-manager
   npm install
   ```

2. **配置环境**
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local 文件，设置您的 MuseScore 路径
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **打开浏览器**
   导航至 `http://localhost:3000`

## 配置

### 环境变量

创建 `.env.local` 文件，内容如下：

```env
# MuseScore CLI 可执行文件路径
MUSESCORE_PATH="C:\Program Files\MuseScore 4\bin\MuseScore4.exe"  # Windows
# MUSESCORE_PATH="mscore"  # Linux/macOS

# 乐谱库存储目录（相对于项目根目录）
LIBRARY_PATH="./library"

# 最大上传大小（字节，默认：50MB）
MAX_UPLOAD_SIZE=52428800
```

### MuseScore 路径示例

- **Windows**：`"C:\Program Files\MuseScore 4\bin\MuseScore4.exe"`
- **Linux**：`"mscore"`
- **macOS**：`"/Applications/MuseScore 4.app/Contents/MacOS/mscore"`

## 项目结构

```
midi-library-manager/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（上传、库、搜索、下载）
│   ├── upload/            # 上传页面
│   ├── library/           # 乐谱库页面
│   ├── preview/[id]/      # PDF 预览页面
│   └── components/        # React 组件
├── lib/                   # 核心应用逻辑
│   ├── storage.ts        # 文件系统操作
│   ├── converter.ts      # MuseScore CLI 调用
│   ├── metadata.ts       # meta.json 处理
│   └── types.ts          # TypeScript 接口
├── library/              # 存储目录（运行时创建）
├── public/               # 静态资源
└── ...配置文件
```

## 使用说明

### 上传 MIDI/MXL 文件

1. 导航至 `/upload`
2. 拖放或选择 `.mid`/`.midi` 或 `.mxl` 文件
3. 点击“上传并转换”
4. 系统将：
   - 保存上传的文件（MIDI 或 MXL）
   - 如果上传的是 MIDI 文件，使用 MuseScore 转换为 MXL
   - 使用 MuseScore 将 MXL 转换为 PDF
   - 可选择将 MXL 转换为 MIDI 文件
   - 创建元数据文件
   - 重定向到乐谱库

### 浏览乐谱库

- 在 `/library` 查看所有曲目
- 按标题、文件名或标签搜索
- 点击任意曲目以预览 PDF
- 下载 PDF/MXL 文件
- 删除曲目

### 预览乐谱

- 点击乐谱库中的任意曲目
- PDF 预览在浏览器中加载
- 提供 PDF 和 MXL 的下载按钮

## 开发

### 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 创建生产构建
- `npm start` - 启动生产服务器
- `npm run lint` - 运行 ESLint（如果已配置）

### 文件存储

每个曲目在 `./library/` 中都有一个唯一的文件夹：

```
library/
├── {uuid}/
│   ├── original.mid      # 上传的 MIDI 文件
│   ├── score.mxl        # 生成的 MXL（MusicXML）
│   ├── score.pdf        # 生成的 PDF 乐谱
│   └── meta.json        # 元数据（标题、日期、标签）
```

### API 端点

- `POST /api/upload` - 上传并转换 MIDI 文件
- `GET /api/library` - 列出所有曲目
- `DELETE /api/library?pieceId={id}` - 删除曲目
- `GET /api/search?q={query}` - 搜索曲目
- `GET /api/download?pieceId={id}&type={pdf|mxl|mid}` - 下载文件

## 故障排除

### MuseScore 问题

1. **命令未找到**：确保 MuseScore 已安装且 `.env.local` 中的路径正确
2. **转换失败**：检查 MuseScore 版本是否支持 CLI 转换
3. **权限错误**：确保 MuseScore 可执行文件具有执行权限

### 文件上传问题

1. **上传失败**：检查文件大小限制（`MAX_UPLOAD_SIZE`）
2. **文件类型错误**：仅接受 `.mid`/`.midi` 文件
3. **存储空间不足**：确保磁盘空间可用

## 本地网络访问

该应用程序可以从本地网络上的其他设备（例如 Android 平板电脑、手机、其他计算机）访问。

### 设置说明

1. **启动开发服务器**（已配置为监听所有网络接口）：
   ```bash
   npm run dev
   ```

2. **查找您计算机的本地 IP 地址**：
   - **Windows**：在命令提示符中运行 `ipconfig` 并查找“IPv4 地址”
   - **macOS/Linux**：运行 `ifconfig` 或 `ip addr` 并查找您的网络接口 IP

3. **从其他设备访问**：
   - 在您的 Android 平板电脑/其他设备上打开网页浏览器
   - 导航至 `http://[您的本地IP]:3000`（将 `[您的本地IP]` 替换为您的实际 IP）
   - 示例：`http://192.168.1.100:3000`

### 重要注意事项

- **防火墙**：确保您的防火墙允许端口 3000 上的传入连接
- **端口配置**：通过设置 `PORT` 环境变量更改端口（例如 `PORT=8080 npm run dev`）
- **网络**：所有设备必须位于同一本地网络（同一 WiFi）
- **生产环境**：如需永久访问，请考虑在生产模式下构建并运行 `npm run build && npm start`

## 许可证

MIT

## 致谢

- [MuseScore](https://musescore.org) 用于优秀的乐谱软件
- [Next.js](https://nextjs.org) 用于 React 框架
- [Tailwind CSS](https://tailwindcss.com) 用于样式设计