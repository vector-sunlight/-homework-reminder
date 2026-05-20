// 作业详情页面 — 展示详情、同步作业、举报
const { callCloud } = require('../../utils/cloud');
const { formatDateTime, calcDeadline } = require('../../utils/format');

Page({
  data: {
    assignment: null,      // 作业详情对象
    isSynced: false,       // 当前用户是否已同步
    isCompleted: false,    // 当前用户是否已完成
    loading: true,         // 加载状态
    showReportDialog: false, // 举报弹窗
    reportReason: ''       // 举报原因
  },

  onLoad(options) {
    const { assignmentId } = options;
    if (assignmentId) {
      this.loadDetail(assignmentId);
    }
  },

  // 加载作业详情
  async loadDetail(assignmentId) {
    this.setData({ loading: true });

    try {
      const app = getApp();
      const res = await callCloud('getAssignmentDetail', {
        assignmentId,
        userId: app.globalData.openId
      });

      // 计算 DDL 状态
      const deadline = calcDeadline(res.assignment.ddl);

      this.setData({
        assignment: { ...res.assignment, _deadline: deadline },
        isSynced: res.isSynced || false,
        isCompleted: res.isCompleted || false,
        loading: false
      });
    } catch (err) {
      console.error('加载作业详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 预览图片（全屏）
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    const urls = this.data.assignment.images || [];
    wx.previewImage({ current: url, urls });
  },

  // 同步作业到"我的作业"
  async onSync() {
    const app = getApp();

    // 未加入班级时提示
    if (!app.globalData.classId) {
      wx.showModal({
        title: '提示',
        content: '请先在"我的"页面加入班级',
        showCancel: false
      });
      return;
    }

    try {
      wx.showLoading({ title: '同步中...' });
      await callCloud('syncAssignment', {
        userId: app.globalData.openId,
        assignmentId: this.data.assignment._id
      });
      wx.hideLoading();
      wx.showToast({ title: '已添加到我的作业', icon: 'success' });
      this.setData({ isSynced: true });
    } catch (err) {
      wx.hideLoading();
      console.error('同步失败:', err);
      wx.showToast({ title: '同步失败，请重试', icon: 'none' });
    }
  },

  // 打开举报弹窗
  showReport() {
    this.setData({ showReportDialog: true, reportReason: '' });
  },

  // 关闭举报弹窗
  closeReport() {
    this.setData({ showReportDialog: false });
  },

  // 输入举报原因
  onReportReasonInput(e) {
    this.setData({ reportReason: e.detail.value });
  },

  // 提交举报
  async submitReport() {
    const reason = this.data.reportReason.trim();
    if (!reason) {
      wx.showToast({ title: '请填写举报原因', icon: 'none' });
      return;
    }

    try {
      const app = getApp();
      await callCloud('reportAbuse', {
        assignmentId: this.data.assignment._id,
        reporterId: app.globalData.openId,
        reason
      });
      wx.showToast({ title: '举报已提交', icon: 'success' });
      this.setData({ showReportDialog: false });
    } catch (err) {
      console.error('举报失败:', err);
      wx.showToast({ title: '举报失败，请重试', icon: 'none' });
    }
  }
});
