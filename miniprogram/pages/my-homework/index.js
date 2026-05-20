// 我的作业页面 — 展示个人待完成/已完成作业，支持打卡操作
const { callCloud } = require('../../utils/cloud');
const { calcDeadline } = require('../../utils/format');
const { USER_ASSIGNMENT_STATUS } = require('../../utils/constants');

Page({
  data: {
    activeTab: 'pending',    // 当前标签：pending / completed
    pendingList: [],         // 待完成列表
    completedList: [],       // 已完成列表
    loading: true,           // 加载状态
    pendingCount: 0,         // 待完成数量（Badge 用）
    completedCount: 0        // 已完成数量
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadAssignments();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAssignments(true);
  },

  // 切换选项卡
  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  },

  // 加载我的作业列表
  async loadAssignments(isRefresh = false) {
    const app = getApp();
    if (!app.globalData.openId) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await callCloud('getMyAssignments', {
        userId: app.globalData.openId
      });

      // 分离待完成和已完成，按 DDL 排序
      const pending = (res.assignments || [])
        .filter(a => a.status === USER_ASSIGNMENT_STATUS.PENDING)
        .sort((a, b) => new Date(a.ddl) - new Date(b.ddl));

      const completed = (res.assignments || [])
        .filter(a => a.status === USER_ASSIGNMENT_STATUS.COMPLETED)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      this.setData({
        pendingList: pending,
        completedList: completed,
        pendingCount: pending.length,
        completedCount: completed.length,
        loading: false
      });
    } catch (err) {
      console.error('加载我的作业失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请下拉重试', icon: 'none' });
    }

    if (isRefresh) wx.stopPullDownRefresh();
  },

  // 标记作业为已完成（打卡）
  async onMarkComplete(e) {
    const { id } = e.currentTarget.dataset;
    // 防止重复点击
    if (this._marking) return;
    this._marking = true;

    try {
      const app = getApp();
      await callCloud('markComplete', {
        userId: app.globalData.openId,
        assignmentId: id
      });

      wx.showToast({ title: '已打卡！', icon: 'success' });

      // 从待完成列表移除，加入已完成列表
      const item = this.data.pendingList.find(a => a.assignmentId === id);
      if (item) {
        item.status = USER_ASSIGNMENT_STATUS.COMPLETED;
        item.completedAt = new Date().toISOString();
        this.setData({
          pendingList: this.data.pendingList.filter(a => a.assignmentId !== id),
          completedList: [item, ...this.data.completedList],
          pendingCount: this.data.pendingCount - 1,
          completedCount: this.data.completedCount + 1
        });
      }
    } catch (err) {
      console.error('打卡失败:', err);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    } finally {
      this._marking = false;
    }
  },

  // 跳转到作业详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/index?assignmentId=${id}` });
  }
});
