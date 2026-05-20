# 作业防忘本

微信小程序 — 学生驱动的班级作业管理平台。任何同学都可以在"作业墙"上发布作业，一键同步到个人列表，DDL 自动提醒，完成打卡。

## 功能

- **作业墙**：班级全部作业，按截止时间排序，支持课程筛选
- **发布作业**：课程名、标题、内容、图片、DDL，任何人可发布
- **作业同步**：一键认领到个人待办列表
- **DDL 提醒**：截止前 24h / 6h / 1h 自动推送微信订阅消息
- **完成打卡**：标记已完成，形成可回溯记录
- **举报 & 管理**：不当内容举报 + 管理员审核面板

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | 微信小程序原生 (WXML + WXSS + JavaScript) |
| UI 组件 | Vant Weapp |
| 后端 | 微信云开发 (云函数 + 云数据库 + 云存储) |
| 定时任务 | 云函数定时触发器 |

## 快速开始

1. `git clone` 本项目
2. 微信开发者工具打开 `miniprogram/` 目录
3. 修改 `project.config.json` 中的 `appid` 为你自己的 AppID
4. 修改 `app.js` 中的 `env` 为你的云开发环境 ID
5. 在云开发控制台创建 5 个数据库集合：`users`、`classes`、`assignments`、`user_assignments`、`reports`
6. 右键每个云函数目录 → 上传并部署
7. 终端进入 `miniprogram/` 执行 `npm install`，然后在开发者工具中「构建 npm」

## 项目结构

```
miniprogram/
├── app.js / app.json / app.wxss
├── pages/              # 6 个页面
│   ├── homework-wall/  # 作业墙（首页 Tab）
│   ├── my-homework/    # 我的作业（Tab）
│   ├── profile/        # 个人中心（Tab）
│   ├── publish/        # 发布作业
│   ├── detail/         # 作业详情
│   └── admin/          # 管理员面板
├── components/         # 3 个组件
├── utils/              # 工具函数
└── cloudfunctions/     # 10 个云函数
```

## 文档

- [设计文档](docs/superpowers/specs/2026-05-20-homework-reminder-design.md)
- [可行性研究报告](作业防忘本--可行性研究报告.docx)
- [项目开发计划](作业防忘本--项目开发计划.docx)
