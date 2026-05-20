# 作业防忘本 — 设计文档

> 2026-05-20 | 基于可行性研究报告 & 项目开发计划

## 技术栈

| 层 | 选型 |
|---|------|
| 前端框架 | 微信小程序原生 (WXML + WXSS + JavaScript) |
| UI 组件库 | Vant Weapp |
| 后端 | 微信云开发 (云函数 + 云数据库 + 云存储) |
| 状态管理 | app.js globalData + 页面级 data |
| 定时任务 | 云函数定时触发器 |

## 项目结构

```
miniprogram/
├── app.js / app.json / app.wxss
├── pages/
│   ├── homework-wall/     # 作业墙（Tab 首页）
│   ├── my-homework/       # 我的作业（Tab）
│   ├── profile/           # 个人中心（Tab）
│   ├── publish/           # 发布作业
│   ├── detail/            # 作业详情
│   └── admin/             # 管理员面板
├── components/
│   ├── assignment-card/   # 作业卡片
│   ├── deadline-badge/    # DDL 倒计时徽章
│   └── empty-state/       # 空状态占位
├── utils/
│   ├── cloud.js           # 云函数调用封装
│   ├── format.js          # 日期/时间格式化
│   └── constants.js       # 常量定义
└── cloudfunctions/
    ├── login/
    ├── publishAssignment/
    ├── syncAssignment/
    ├── markComplete/
    ├── getWallAssignments/
    ├── getMyAssignments/
    ├── getAssignmentDetail/
    ├── sendReminder/      # 定时触发
    ├── reportAbuse/
    └── adminResolve/
```

## 数据库集合

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | string | 微信 openId（自动） |
| role | string | student / admin |
| nickname | string | 微信昵称 |
| avatarUrl | string | 微信头像 |
| classId | string | 所属班级 _id |
| createdAt | date | 创建时间 |

### classes
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 班级名称 |
| inviteCode | string | 6位邀请码 |
| createdBy | string | 创建者 openId |
| memberCount | number | 成员数 |
| createdAt | date | 创建时间 |

### assignments
| 字段 | 类型 | 说明 |
|------|------|------|
| courseName | string | 课程名称 |
| title | string | 作业标题 |
| content | string | 作业内容 |
| images | array[string] | 云存储图片 URL |
| publisherId | string | 发布者 openId |
| publisherName | string | 发布者昵称 |
| classId | string | 所属班级 _id |
| ddl | date | 截止时间 |
| syncCount | number | 同步人数 |
| status | string | active / expired / deleted |
| createdAt | date | 创建时间 |

### user_assignments
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户 openId |
| assignmentId | string | 作业 _id |
| status | string | pending / completed |
| syncedAt | date | 同步时间 |
| completedAt | date | 完成时间 |
| remindedAt | object | {24h, 6h, 1h} 提醒发送时间 |

### reports
| 字段 | 类型 | 说明 |
|------|------|------|
| assignmentId | string | 被举报作业 _id |
| reporterId | string | 举报者 openId |
| reason | string | 举报原因 |
| status | string | pending / resolved / dismissed |
| createdAt | date | 创建时间 |

## 页面路由

| 路径 | 页面 | Tab |
|------|------|-----|
| pages/homework-wall/index | 作业墙 | 是 |
| pages/my-homework/index | 我的作业 | 是 |
| pages/profile/index | 个人中心 | 是 |
| pages/publish/index | 发布作业 | 否 |
| pages/detail/index | 作业详情 | 否 |
| pages/admin/index | 管理员面板 | 否 |

## 数据流

用户登录 → 云函数 login() 获取 openId + 用户信息
  ↓
作业墙 ← 云函数 getWallAssignments(classId) 拉取班级所有作业
  ↓
同步作业 → 云函数 syncAssignment(userId, assignmentId) 写入 user_assignments
  ↓
DDL 提醒 ← 定时触发器 sendReminder() 每小时扫描，匹配 24h/6h/1h 节点发送模板消息
  ↓
完成打卡 → 云函数 markComplete(userId, assignmentId) 更新状态
  ↓
举报 → 云函数 reportAbuse(assignmentId, reason) 写入 reports 集合
  ↓
管理员处理 → 云函数 adminResolve(reportId, action) 忽略或删除

## 安全规则

- 云数据库权限：读（仅同班级），写（仅本人记录 + 管理员）
- 用户仅通过 openId 标识，不存储真实姓名/手机号
- 云函数内校验所有操作权限
- 图片上传需内容审核（云开发自带）
