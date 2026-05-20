// 发布作业页面 — 课程名称、标题、内容、图片、DDL
const { callCloud } = require('../../utils/cloud');

Page({
  data: {
    courseName: '',        // 课程名称
    title: '',             // 作业标题
    content: '',           // 作业内容
    images: [],            // 已上传的图片列表（云存储 fileID）
    ddl: '',              // 截止时间（ISO 字符串）
    ddlDisplay: '',       // DDL 显示文本
    showDdlPicker: false, // 是否显示时间选择器
    submitting: false     // 是否正在提交
  },

  // 课程名称输入
  onCourseInput(e) {
    this.setData({ courseName: e.detail.value });
  },

  // 作业标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 作业内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 显示 DDL 选择器
  showPicker() {
    this.setData({ showDdlPicker: true });
  },

  // 关闭 DDL 选择器
  closePicker() {
    this.setData({ showDdlPicker: false });
  },

  // DDL 选择确认
  onDdlConfirm(e) {
    const timestamp = e.detail;
    const date = new Date(timestamp);
    const isoStr = date.toISOString();
    const display = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    this.setData({
      ddl: isoStr,
      ddlDisplay: display,
      showDdlPicker: false
    });
  },

  // 图片上传成功后回调
  afterUpload(e) {
    const { fileList } = e.detail;
    // 提取云存储 fileID
    const images = fileList
      .filter(f => f.status === 'done')
      .map(f => f.fileID || f.url);
    this.setData({ images });
  },

  // 删除图片
  onDeleteImage(e) {
    const { index } = e.detail;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  // 提交发布
  async onSubmit() {
    // 表单验证
    if (!this.data.courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' });
      return;
    }
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入作业标题', icon: 'none' });
      return;
    }
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入作业内容', icon: 'none' });
      return;
    }
    if (!this.data.ddl) {
      wx.showToast({ title: '请选择截止时间', icon: 'none' });
      return;
    }

    // 防止重复提交
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const app = getApp();
      wx.showLoading({ title: '发布中...' });

      await callCloud('publishAssignment', {
        courseName: this.data.courseName.trim(),
        title: this.data.title.trim(),
        content: this.data.content.trim(),
        images: this.data.images,
        ddl: this.data.ddl,
        classId: app.globalData.classId,
        publisherId: app.globalData.openId
      });

      wx.hideLoading();
      wx.showToast({ title: '发布成功！', icon: 'success' });

      // 延迟返回上一页，让用户看到成功提示
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
