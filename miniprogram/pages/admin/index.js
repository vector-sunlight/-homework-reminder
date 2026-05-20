// 管理员面板页面 — 处理举报、管理用户
const { callCloud } = require('../../utils/cloud');
const { REPORT_STATUS } = require('../../utils/constants');

Page({
  data: {
    activeTab: 'reports',   // 当前标签：reports / users
    reports: [],            // 举报列表
    users: [],              // 用户列表（管理员视图）
    loading: true,
    processingId: null      // 正在处理的举报ID
  },

  onLoad() {
    this.checkAdmin();
  },

  // 校验管理员身份
  checkAdmin() {
    const app = getApp();
    if (!app.globalData.isAdmin) {
      wx.showModal({
        title: '无权访问',
        content: '仅管理员可查看此页面',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }
    this.loadData();
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true });

    try {
      const [reportRes, userRes] = await Promise.all([
        callCloud('adminResolve', { action: 'listReports' }),
        callCloud('adminResolve', { action: 'listUsers' })
      ]);

      this.setData({
        reports: reportRes.reports || [],
        users: userRes.users || [],
        loading: false
      });
    } catch (err) {
      console.error('加载管理数据失败:', err);
      this.setData({ loading: false });
    }
  },

  // 切换标签
  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  },

  // 处理举报：忽略
  async dismissReport(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '忽略此举报？',
      content: '将标记为已忽略，不删除原作业',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          await callCloud('adminResolve', {
            action: 'dismiss',
            reportId: id
          });

          // 更新本地列表
          const reports = this.data.reports.map(r =>
            r._id === id ? { ...r, status: REPORT_STATUS.DISMISSED } : r
          );
          this.setData({ reports });

          wx.showToast({ title: '已忽略', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  // 处理举报：删除作业
  async deleteAssignment(e) {
    const { id, assignmentId } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除？',
      content: '将永久删除该作业，此操作不可撤销',
      confirmColor: '#E74C3C',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          await callCloud('adminResolve', {
            action: 'deleteAssignment',
            reportId: id,
            assignmentId
          });

          // 更新本地列表
          const reports = this.data.reports.map(r =>
            r._id === id ? { ...r, status: REPORT_STATUS.RESOLVED } : r
          );
          this.setData({ reports });

          wx.showToast({ title: '作业已删除', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  }
});
