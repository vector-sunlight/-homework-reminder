// 云函数：获取作业墙 — 按 DDL 排序，支持课程筛选和分页
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { classId, courseFilter, page = 0, pageSize = 20 } = event;

  if (!classId) {
    return { assignments: [], hasMore: false };
  }

  // 构建查询条件：同班级 + 未删除
  const where = {
    classId,
    status: db.command.in(['active', 'expired'])
  };

  // 课程筛选
  if (courseFilter) {
    where.courseName = courseFilter;
  }

  // 按 DDL 升序（临近的排前面），已过期的排后面
  const res = await db.collection('assignments')
    .where(where)
    .orderBy('ddl', 'asc')
    .skip(page * pageSize)
    .limit(pageSize)
    .get();

  // 检查是否还有更多
  const countRes = await db.collection('assignments')
    .where(where)
    .count();

  const hasMore = (page + 1) * pageSize < countRes.total;

  return {
    assignments: res.data,
    hasMore,
    total: countRes.total
  };
};
