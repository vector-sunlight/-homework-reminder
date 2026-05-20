// 个人中心页面 — 用户信息、班级管理、管理员入口、统计
const { callCloud } = require('../../utils/cloud');

Page({
  data: {
    userInfo: null,       // 用户信息
    hasClass: false,      // 是否已加入班级
    className: '',        // 班级名称
    inviteCode: '',       // 班级邀请码
    isAdmin: false,       // 是否管理员
    stats: {              // 作业统计
      completed: 0,
      pending: 0
    },
    showJoinDialog: false,// 是否显示加入班级弹窗
    inviteInput: '',      // 邀请码输入值
    showCreateDialog: false, // 是否显示创建班级弹窗
    createClassName: ''   // 新班级名称输入值
  },

  onShow() {
    this.loadProfile();
  },

  // 加载个人信息
  async loadProfile() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;

    // 设置用户基本信息
    this.setData({
      userInfo,
      hasClass: !!app.globalData.classId,
      className: app.globalData.className || '',
      isAdmin: app.globalData.isAdmin
    });

    // 如果有班级，加载班级详细信息和统计数据
    if (app.globalData.classId) {
      this.loadClassInfo();
      this.loadStats();
    }
  },

  // 加载班级信息（邀请码等）
  async loadClassInfo() {
    try {
      const app = getApp();
      const res = await callCloud('login', {
        refresh: true
      });
      if (res.user && res.user.classInfo) {
        this.setData({
          className: res.user.classInfo.name,
          inviteCode: res.user.classInfo.inviteCode
        });
        app.globalData.className = res.user.classInfo.name;
        app.globalData.classInfo = res.user.classInfo;
      }
    } catch (err) {
      console.error('加载班级信息失败:', err);
    }
  },

  // 加载作业统计
  async loadStats() {
    try {
      const app = getApp();
      const res = await callCloud('getMyAssignments', {
        userId: app.globalData.openId
      });
      const completed = (res.assignments || []).filter(a => a.status === 'completed').length;
      const pending = (res.assignments || []).filter(a => a.status === 'pending').length;
      this.setData({
        stats: { completed, pending }
      });
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  // 复制邀请码到剪贴板
  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' })
    });
  },

  // 显示加入班级弹窗
  showJoin() {
    this.setData({ showJoinDialog: true, inviteInput: '' });
  },

  // 显示创建班级弹窗
  showCreate() {
    this.setData({ showCreateDialog: true, createClassName: '' });
  },

  // 关闭弹窗
  closeDialogs() {
    this.setData({
      showJoinDialog: false,
      showCreateDialog: false
    });
  },

  // 输入邀请码
  onInviteInput(e) {
    this.setData({ inviteInput: e.detail.value });
  },

  // 输入班级名称
  onClassNameInput(e) {
    this.setData({ createClassName: e.detail.value });
  },

  // 加入班级
  async joinClass() {
    const code = this.data.inviteInput.trim();
    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '加入中...' });
      const app = getApp();
      const res = await callCloud('login', {
        action: 'joinClass',
        inviteCode: code
      });
      wx.hideLoading();

      if (res.success) {
        wx.showToast({ title: '加入成功！', icon: 'success' });
        // 刷新全局信息
        await app.refreshUserInfo();
        this.setData({ showJoinDialog: false });
        this.loadProfile();
      } else {
        wx.showToast({ title: res.message || '邀请码无效', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加入失败，请重试', icon: 'none' });
    }
  },

  // 创建班级
  async createClass() {
    const name = this.data.createClassName.trim();
    if (!name) {
      wx.showToast({ title: '请输入班级名称', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '创建中...' });
      const app = getApp();
      const res = await callCloud('login', {
        action: 'createClass',
        className: name
      });
      wx.hideLoading();

      if (res.success) {
        wx.showToast({ title: '班级创建成功！', icon: 'success' });
        await app.refreshUserInfo();
        this.setData({ showCreateDialog: false });
        this.loadProfile();
      } else {
        wx.showToast({ title: res.message || '创建失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '创建失败，请重试', icon: 'none' });
    }
  },

  // 进入管理员面板
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/index' });
  },

  // 关于页面
  goAbout() {
    wx.showModal({
      title: '关于作业防忘本',
      content: '让每一份作业都不被遗忘。\n\n版本：V1.0\n开发者：作业防忘本项目小组',
      showCancel: false
    });
  }
});
