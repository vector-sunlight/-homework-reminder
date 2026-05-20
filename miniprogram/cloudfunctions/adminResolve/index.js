// 云函数：管理员操作 — 举报处理列表、解决举报、删除作业、用户列表
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, reportId, assignmentId } = event;

  // 校验管理员身份
  const userRes = await db.collection('users').where({ _openid: OPENID }).get();
  if (userRes.data.length === 0 || userRes.data[0].role !== 'admin') {
    return { success: false, message: '无权操作' };
  }

  // —— 获取举报列表 ——
  if (action === 'listReports') {
    const reportsRes = await db.collection('reports')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    // 补充举报人和被举报作业的信息
    const enriched = [];
    for (const report of reportsRes.data) {
      const item = { ...report };

      // 获取被举报作业标题
      try {
        const aRes = await db.collection('assignments').doc(report.assignmentId).get();
        item.assignmentTitle = aRes.data ? aRes.data.title : '（已删除）';
      } catch (e) {
        item.assignmentTitle = '（已删除）';
      }

      // 获取举报人昵称
      try {
        const uRes = await db.collection('users').where({ _openid: report.reporterId }).get();
        item.reporterName = uRes.data[0] ? uRes.data[0].nickname : '匿名';
      } catch (e) {
        item.reporterName = '匿名';
      }

      enriched.push(item);
    }

    return { reports: enriched };
  }

  // —— 获取用户列表 ——
  if (action === 'listUsers') {
    // 根据管理员的 classId 获取同班用户
    const adminUser = userRes.data[0];
    const usersRes = await db.collection('users')
      .where({ classId: adminUser.classId })
      .limit(100)
      .get();

    // 补充班级名称
    let className = '';
    if (adminUser.classId) {
      try {
        const cRes = await db.collection('classes').doc(adminUser.classId).get();
        className = cRes.data ? cRes.data.name : '';
      } catch (e) { /* ignore */ }
    }

    const users = usersRes.data.map(u => ({ ...u, className }));

    return { users };
  }

  // —— 忽略举报 ——
  if (action === 'dismiss') {
    if (!reportId) return { success: false, message: '缺少举报ID' };

    await db.collection('reports').doc(reportId).update({
      data: { status: 'dismissed' }
    });

    return { success: true };
  }

  // —— 删除作业（通过举报） ——
  if (action === 'deleteAssignment') {
    if (!assignmentId) return { success: false, message: '缺少作业ID' };

    // 软删除作业（标记为 deleted 而非物理删除）
    await db.collection('assignments').doc(assignmentId).update({
      data: { status: 'deleted', updatedAt: new Date() }
    });

    // 更新举报状态
    if (reportId) {
      await db.collection('reports').doc(reportId).update({
        data: { status: 'resolved' }
      });
    }

    return { success: true };
  }

  return { success: false, message: '未知操作' };
};
