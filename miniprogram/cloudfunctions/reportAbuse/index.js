// 云函数：举报作业
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { assignmentId, reporterId, reason } = event;
  const { OPENID } = cloud.getWXContext();

  if (!assignmentId || !reason) {
    return { success: false, message: '缺少必要参数' };
  }

  // 检查作业是否存在
  try {
    await db.collection('assignments').doc(assignmentId).get();
  } catch (e) {
    return { success: false, message: '作业不存在' };
  }

  // 检查是否已举报（防止重复）
  const existRes = await db.collection('reports')
    .where({ assignmentId, reporterId: OPENID })
    .get();

  if (existRes.data.length > 0) {
    return { success: false, message: '您已举报过此作业' };
  }

  // 写入举报记录
  await db.collection('reports').add({
    data: {
      assignmentId,
      reporterId: OPENID,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date()
    }
  });

  return { success: true };
};
