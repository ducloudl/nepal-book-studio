# 📔 尼泊尔手工本工作室 (Nepal Book Studio)

> 一个高级数字手工本创作平台 —— 制作你独一无二的手工本，分享给心爱的人

## ✨ 特性

- 🎨 **13个精美主题** — 月亮、玫瑰、烟花、太阳、海浪、星空、花开、甜心、日落、森林、薰衣草、封面、终章
- 📝 **7套商用模板** — 情侣表白、闺蜜友情、感恩致谢、旅行记忆、生日祝福、婚礼纪念、宝宝成长
- 🖱️ **拖拽编辑器** — 自由拖放文字/贴纸/图片，双击编辑，图层管理
- ⏮️ **撤销重做** — Ctrl+Z/Y，不担心操作失误
- 🖼️ **图片上传** — 拖放/粘贴/选择，支持本地图片
- 📖 **3D翻页预览** — CSS 3D动画，全景沉浸式阅读
- 📤 **多种分享** — URL链接分享、JSON导出导入
- 🖥️ **后端API** — Express服务器，公开画廊，访问统计
- 📱 **响应式** — 桌面/平板/手机全适配
- 🎨 **Glassmorphism** — 高级磨砂玻璃设计系统

## 🚀 快速开始

### 前端（离线可用）
```bash
# 双击 index.html 即可使用
open index.html  # macOS
start index.html # Windows
```

### 后端（分享服务）
```bash
cd server
npm install
node index.js
# 服务运行在 http://localhost:3456
```

## 📦 项目结构

```
nepal-book-studio/
├── index.html          # 入口页面
├── css/
│   └── style.css       # 1951行商用级设计系统
├── js/
│   ├── themes.js       # 主题/贴纸/模板引擎
│   ├── storage.js      # 本地存储 + 分享
│   ├── editor.js       # 拖拽编辑器 + 撤销重做
│   ├── viewer.js       # 3D翻页预览器
│   └── app.js          # 路由/书架管理
└── server/
    ├── index.js        # Express API 服务器
    ├── package.json
    └── vercel.json     # Vercel 部署配置
```

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JS
- **后端**: Express.js + lowdb
- **设计**: Glassmorphism + CSS Variables + 微交互
- **存储**: localStorage (前端) + JSON/SQLite (后端)

## 📄 License

MIT
