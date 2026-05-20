// 云函数：DDL 提醒 — 定时触发器，每小时扫描即将到期的作业并发送订阅消息
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 提醒节点（提前小时数）
const REMINDER_NODES = [24, 6, 1];

exports.main = async (event) => {
  const now = new Date();

  try {
    // 遍历每个提醒节点
    for (const hours of REMINDER_NODES) {
      // 计算目标时间窗口：now + hours 前后各30分钟
      const targetStart = new Date(now.getTime() + (hours - 0.5) * 60 * 60 * 1000);
      const targetEnd = new Date(now.getTime() + (hours + 0.5) * 60 * 60 * 1000);

      const nodeKey = `${hours}h`;

      // 查找 DDL 在该时间窗口内的活跃作业
      const assignmentsRes = await db.collection('assignments')
        .where({
          ddl: db.command.gte(targetStart).and(db.command.lte(targetEnd)),
          status: 'active'
        })
        .get();

      if (assignmentsRes.data.length === 0) continue;

      for (const assignment of assignmentsRes.data) {
        // 查找已同步但未完成且该节点尚未提醒的用户
        const uaRes = await db.collection('user_assignments')
          .where({
            assignmentId: assignment._id,
            status: 'pending',
            [`remindedAt.${nodeKey}`]: null // 该节点尚未发送提醒
          })
          .get();

        for (const ua of uaRes.data) {
          try {
            // 发送订阅消息提醒
            await cloud.openapi.subscribeMessage.send({
              touser: ua.userId,
              templateId: 'your-template-id', // TODO: 替换为实际的订阅消息模板ID
              data: {
                thing1: { value: assignment.courseName.substring(0, 20) },
                thing2: { value: assignment.title.substring(0, 20) },
                date3: { value: formatReminderTime(assignment.ddl) },
                thing4: { value: getReminderText(hours) }
              },
              page: `/pages/detail/index?assignmentId=${assignment._id}`
            });

            // 更新提醒时间
            await db.collection('user_assignments').doc(ua._id).update({
              data: { [`remindedAt.${nodeKey}`]: now }
            });
          } catch (err) {
            // 单条提醒失败不影响其他提醒（如用户未订阅）
            console.error(`提醒发送失败 (user=${ua.userId}, assignment=${assignment._id}):`, err.message);
          }
        }
      }
    }

    return { success: true, checkedAt: now };
  } catch (err) {
    console.error('sendReminder 执行异常:', err);
    return { success: false, error: err.message };
  }
};

// 格式化 DDL 时间用于模板消息
function formatReminderTime(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 根据提醒节点生成提示文案
function getReminderText(hours) {
  if (hours >= 24) return `还有${Math.round(hours / 24)}天截止`;
  return `还有${hours}小时截止`;
}
