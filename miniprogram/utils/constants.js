// 全局常量定义

// 作业状态
const ASSIGNMENT_STATUS = {
  ACTIVE: 'active',    // 进行中
  EXPIRED: 'expired',  // 已截止
  DELETED: 'deleted'   // 已删除
};

// 用户作业状态
const USER_ASSIGNMENT_STATUS = {
  PENDING: 'pending',     // 待完成
  COMPLETED: 'completed'  // 已完成
};

// 用户角色
const USER_ROLE = {
  STUDENT: 'student',
  ADMIN: 'admin'
};

// 举报状态
const REPORT_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

// DDL 提醒节点（提前小时数）
const REMINDER_NODES = [24, 6, 1];

// DDL 状态级别
const DDL_LEVEL = {
  SAFE: 'safe',
  WARNING: 'warning',
  DANGER: 'danger',
  EXPIRED: 'expired'
};

// 分页大小
const PAGE_SIZE = 20;

module.exports = {
  ASSIGNMENT_STATUS,
  USER_ASSIGNMENT_STATUS,
  USER_ROLE,
  REPORT_STATUS,
  REMINDER_NODES,
  DDL_LEVEL,
  PAGE_SIZE
};
