// 云函数：发布作业 — 创建作业记录并关联班级
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { courseName, title, content, images, ddl, classId, publisherId } = event;
  const { OPENID } = cloud.getWXContext();

  // 参数校验
  if (!courseName || !title || !content || !ddl || !classId) {
    return { success: false, message: '缺少必要参数' };
  }

  // 校验用户属于该班级
  const userRes = await db.collection('users').where({ _openid: OPENID }).get();
  if (userRes.data.length === 0) {
    return { success: false, message: '用户不存在' };
  }

  const user = userRes.data[0];

  // 写入作业记录
  const assignment = {
    courseName: courseName.trim(),
    title: title.trim(),
    content: content.trim(),
    images: images || [],
    publisherId: OPENID,
    publisherName: user.nickname || '未知用户',
    classId,
    ddl: new Date(ddl),
    syncCount: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const res = await db.collection('assignments').add({ data: assignment });

  return {
    success: true,
    assignmentId: res._id
  };
};
