// DDL 倒计时徽章组件 — 展示剩余时间和状态颜色
const { calcDeadline } = require('../../utils/format');

Component({
  properties: {
    ddl: {
      type: String,
      value: '',
      observer: 'updateDeadline'
    }
  },

  data: {
    text: '',
    level: 'safe'
  },

  methods: {
    updateDeadline(val) {
      if (val) {
        const result = calcDeadline(val);
        this.setData({ text: result.text, level: result.level });
      }
    }
  }
});
