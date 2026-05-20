// 云函数：获取作业详情 — 作业完整信息 + 当前用户同步状态
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { assignmentId, userId } = event;
  const { OPENID } = cloud.getWXContext();

  // 查询作业
  const res = await db.collection('assignments').doc(assignmentId).get();
  if (!res.data) {
    return { success: false, message: '作业不存在' };
  }

  // 查询当前用户是否已同步/已完成
  let isSynced = false;
  let isCompleted = false;

  if (userId) {
    const uaRes = await db.collection('user_assignments')
      .where({ userId, assignmentId })
      .get();

    if (uaRes.data.length > 0) {
      isSynced = true;
      isCompleted = uaRes.data[0].status === 'completed';
    }
  }

  return {
    assignment: res.data,
    isSynced,
    isCompleted
  };
};
