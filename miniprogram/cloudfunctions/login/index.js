// 云函数：用户登录 — 获取 openId、查询或创建用户、加入/创建班级
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext(); // 获取微信 openId
  const { action, refresh, inviteCode, className } = event;

  const usersCol = db.collection('users');
  const classesCol = db.collection('classes');

  // —— 加入班级 ——
  if (action === 'joinClass') {
    if (!inviteCode) return { success: false, message: '邀请码不能为空' };

    // 查找班级
    const classRes = await classesCol.where({ inviteCode }).get();
    if (classRes.data.length === 0) {
      return { success: false, message: '邀请码无效，未找到对应班级' };
    }

    const classInfo = classRes.data[0];

    // 更新用户班级信息
    await usersCol.where({ _openid: OPENID }).update({
      data: {
        classId: classInfo._id,
        updatedAt: new Date()
      }
    });

    // 增加班级成员计数
    await classesCol.doc(classInfo._id).update({
      data: { memberCount: db.command.inc(1) }
    });

    return { success: true };
  }

  // —— 创建班级 ——
  if (action === 'createClass') {
    if (!className) return { success: false, message: '班级名称不能为空' };

    // 生成6位随机邀请码
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 创建班级记录
    const classRes = await classesCol.add({
      data: {
        name: className,
        inviteCode: code,
        createdBy: OPENID,
        memberCount: 0,
        createdAt: new Date()
      }
    });

    // 将创建者加入班级
    await usersCol.where({ _openid: OPENID }).update({
      data: {
        classId: classRes._id,
        updatedAt: new Date()
      }
    });

    await classesCol.doc(classRes._id).update({
      data: { memberCount: db.command.inc(1) }
    });

    return { success: true, classId: classRes._id, inviteCode: code };
  }

  // —— 查询或创建用户 ——
  let userRes = await usersCol.where({ _openid: OPENID }).get();
  let user = userRes.data[0];

  if (!user) {
    // 新用户，创建记录
    const newUser = {
      _openid: OPENID,
      role: 'student',
      nickname: '微信用户',
      avatarUrl: '',
      classId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await usersCol.add({ data: newUser });
    user = newUser;
  }

  // 如果需要返回班级详细信息
  let classInfo = null;
  if (user.classId) {
    try {
      const cRes = await classesCol.doc(user.classId).get();
      classInfo = cRes.data;
    } catch (e) {
      // 班级可能已删除
    }
  }

  return {
    openId: OPENID,
    user: {
      ...user,
      classInfo
    }
  };
};
