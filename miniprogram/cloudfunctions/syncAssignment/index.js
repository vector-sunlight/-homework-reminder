// 云函数：同步作业 — 用户认领作业到个人列表
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { userId, assignmentId } = event;
  const { OPENID } = cloud.getWXContext();

  // 校验用户身份：只能操作自己的记录
  if (OPENID !== userId) {
    return { success: false, message: '无权操作' };
  }

  // 检查是否已同步（防重复）—— 利用联合索引高效查询
  const existRes = await db.collection('user_assignments')
    .where({ userId: OPENID, assignmentId })
    .get();

  if (existRes.data.length > 0) {
    return { success: false, message: '已同步过该作业' };
  }

  // 写入同步记录
  await db.collection('user_assignments').add({
    data: {
      userId: OPENID,
      assignmentId,
      status: 'pending',
      syncedAt: new Date(),
      completedAt: null,
      remindedAt: { '24h': null, '6h': null, '1h': null }
    }
  });

  // 作业同步计数 +1
  await db.collection('assignments').doc(assignmentId).update({
    data: { syncCount: db.command.inc(1) }
  });

  return { success: true };
};
