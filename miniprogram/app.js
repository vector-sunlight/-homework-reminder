// 作业防忘本 — 应用入口
// 初始化云开发环境，管理全局用户状态

App({
  // 云开发环境初始化标记
  cloudReady: false,

  onLaunch: function () {
    // 初始化云开发环境（需在微信开发者工具中替换为实际环境ID）
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'your-env-id', // TODO: 替换为云开发环境ID
      traceUser: true
    });

    this.cloudReady = true;

    // 自动登录：获取用户 openId 及基础信息
    this.autoLogin();
  },

  // 全局用户数据
  globalData: {
    userInfo: null,    // 微信用户信息（昵称、头像）
    openId: null,      // 当前用户的微信 openId
    classId: null,     // 当前所属班级 _id
    className: null,   // 当前班级名称
    isAdmin: false,    // 是否为管理员
    classInfo: null    // 完整班级信息（含邀请码）
  },

  // 自动登录：调用云函数获取 openId，查询/创建用户记录
  async autoLogin() {
    try {
      // 调用云函数获取 openId
      const res = await wx.cloud.callFunction({ name: 'login' });
      const { openId, user } = res.result;

      this.globalData.openId = openId;

      if (user) {
        // 已有用户记录，同步全局状态
        this.globalData.userInfo = {
          nickName: user.nickname,
          avatarUrl: user.avatarUrl
        };
        this.globalData.classId = user.classId;
        this.globalData.isAdmin = user.role === 'admin';
      }

      // 存储 openId 供各页面使用
      wx.setStorageSync('openId', openId);
    } catch (err) {
      console.error('登录失败:', err);
    }
  },

  // 刷新全局用户信息（加入班级后调用）
  async refreshUserInfo() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { refresh: true }
      });
      const { user } = res.result;
      if (user) {
        this.globalData.userInfo = {
          nickName: user.nickname,
          avatarUrl: user.avatarUrl
        };
        this.globalData.classId = user.classId;
        this.globalData.isAdmin = user.role === 'admin';
      }
    } catch (err) {
      console.error('刷新用户信息失败:', err);
    }
  }
});
