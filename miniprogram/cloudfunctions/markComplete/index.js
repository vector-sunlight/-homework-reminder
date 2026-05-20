// 云函数：完成打卡 — 标记作业为已完成
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { userId, assignmentId } = event;
  const { OPENID } = cloud.getWXContext();

  // 身份校验：只能标记自己的作业
  if (OPENID !== userId) {
    return { success: false, message: '无权操作' };
  }

  // 查找用户-作业关联记录
  const uaRes = await db.collection('user_assignments')
    .where({ userId: OPENID, assignmentId })
    .get();

  if (uaRes.data.length === 0) {
    return { success: false, message: '未找到该作业记录' };
  }

  // 更新状态为已完成
  await db.collection('user_assignments')
    .doc(uaRes.data[0]._id)
    .update({
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

  return { success: true };
};
