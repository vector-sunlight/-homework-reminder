// 作业卡片组件 — 用于作业墙列表展示
const { calcDeadline, formatShort } = require('../../utils/format');

Component({
  properties: {
    assignment: {
      type: Object,
      value: {}
    }
  },

  observers: {
    // 监听作业数据变化，计算格式化字段
    'assignment'(val) {
      if (val && val.ddl) {
        const deadline = calcDeadline(val.ddl);
        this.setData({
          _deadline: deadline,
          _ddlFormatted: formatShort(val.ddl)
        });
      }
    }
  },

  data: {
    _deadline: null,
    _ddlFormatted: ''
  },

  methods: {
    // 点击卡片跳转详情
    onTap() {
      const { assignment } = this.properties;
      this.triggerEvent('detail', { id: assignment._id });
    }
  }
});
