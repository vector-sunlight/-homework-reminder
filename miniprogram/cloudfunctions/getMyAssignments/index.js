// 云函数：获取我的作业 — 联表查询 user_assignments + assignments
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { userId } = event;
  const { OPENID } = cloud.getWXContext();

  if (!userId || OPENID !== userId) {
    return { assignments: [] };
  }

  // 获取用户所有的作业关联记录
  const uaRes = await db.collection('user_assignments')
    .where({ userId: OPENID })
    .orderBy('syncedAt', 'desc')
    .get();

  if (uaRes.data.length === 0) {
    return { assignments: [] };
  }

  // 提取 assignmentId 列表
  const ids = uaRes.data.map(item => item.assignmentId);

  // 批量查询对应的作业详情（每次最多查 100 条）
  const assignmentsMap = {};
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const res = await db.collection('assignments')
      .where({ _id: db.command.in(batch), status: db.command.neq('deleted') })
      .get();
    res.data.forEach(a => { assignmentsMap[a._id] = a; });
  }

  // 合并数据：将作业详情合并到用户记录中
  const merged = uaRes.data
    .filter(ua => assignmentsMap[ua.assignmentId]) // 过滤已删除的作业
    .map(ua => ({
      ...assignmentsMap[ua.assignmentId],
      userAssignmentId: ua._id,
      status: ua.status,
      syncedAt: ua.syncedAt,
      completedAt: ua.completedAt
    }));

  return { assignments: merged };
};
