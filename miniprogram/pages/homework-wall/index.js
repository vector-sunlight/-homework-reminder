// 作业墙页面 — 展示班级所有作业，支持课程筛选和下拉刷新
const { callCloud } = require('../../utils/cloud');
const { formatShort, calcDeadline, isExpired } = require('../../utils/format');
const { PAGE_SIZE } = require('../../utils/constants');

Page({
  data: {
    assignments: [],       // 作业列表
    courseFilters: ['全部'], // 课程筛选列表（第一项固定"全部"）
    activeFilter: '全部',   // 当前选中的课程筛选
    loading: true,         // 加载状态
    loadMore: false,       // 是否还有更多数据
    page: 0                // 当前页码
  },

  onLoad() {
    this.loadAssignments();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 0, assignments: [], loadMore: false });
    this.loadAssignments(true);
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.loadMore && !this.data.loading) {
      this.loadAssignments();
    }
  },

  // 加载作业列表
  async loadAssignments(isRefresh = false) {
    const app = getApp();
    // 未加入班级时不请求
    if (!app.globalData.classId) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await callCloud('getWallAssignments', {
        classId: app.globalData.classId,
        courseFilter: this.data.activeFilter === '全部' ? null : this.data.activeFilter,
        page: this.data.page,
        pageSize: PAGE_SIZE
      });

      const newList = this.data.page === 0
        ? res.assignments
        : [...this.data.assignments, ...res.assignments];

      // 提取课程列表作为筛选标签
      const courses = [...new Set(newList.map(a => a.courseName))];

      this.setData({
        assignments: newList,
        courseFilters: ['全部', ...courses],
        loading: false,
        loadMore: res.hasMore,
        page: this.data.page + 1
      });
    } catch (err) {
      console.error('加载作业列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请下拉重试', icon: 'none' });
    }

    if (isRefresh) wx.stopPullDownRefresh();
  },

  // 切换课程筛选
  onFilterTap(e) {
    const course = e.currentTarget.dataset.course;
    if (course === this.data.activeFilter) return;

    this.setData({
      activeFilter: course,
      page: 0,
      assignments: [],
      loadMore: false
    });
    this.loadAssignments();
  },

  // 跳转到发布页
  goPublish() {
    // 检查是否已加入班级
    const app = getApp();
    if (!app.globalData.classId) {
      wx.showModal({
        title: '提示',
        content: '请先在"我的"页面加入班级',
        showCancel: false
      });
      return;
    }
    wx.navigateTo({ url: '/pages/publish/index' });
  },

  // 跳转到作业详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/index?assignmentId=${id}` });
  }
});
