// 日期/时间格式化工具

/**
 * 格式化日期为 "YYYY-MM-DD HH:mm"
 * @param {Date|string} date - 日期对象或 ISO 字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDateTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}`;
}

/**
 * 格式化日期为 "MM月DD日 HH:mm"
 * @param {Date|string} date
 * @returns {string}
 */
function formatShort(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 计算 DDL 剩余时间，返回展示文本和状态级别
 * @param {Date|string} ddl - 截止时间
 * @returns {{ text: string, level: 'safe'|'warning'|'danger'|'expired' }}
 */
function calcDeadline(ddl) {
  if (!ddl) return { text: '无截止时间', level: 'safe' };
  const now = new Date();
  const target = typeof ddl === 'string' ? new Date(ddl) : ddl;
  const diff = target - now;

  // 已过期
  if (diff <= 0) {
    return { text: '已截止', level: 'expired' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 3) {
    return { text: `还有 ${days} 天`, level: 'safe' };
  } else if (days >= 1) {
    return { text: `还有 ${days} 天 ${hours % 24} 小时`, level: 'warning' };
  } else if (hours >= 1) {
    return { text: `还有 ${hours} 小时`, level: 'danger' };
  } else {
    const mins = Math.floor(diff / (1000 * 60));
    return { text: `还有 ${mins} 分钟`, level: 'danger' };
  }
}

/**
 * 判断 DDL 是否已过期
 * @param {Date|string} ddl
 * @returns {boolean}
 */
function isExpired(ddl) {
  if (!ddl) return false;
  return new Date(ddl) - new Date() <= 0;
}

module.exports = { formatDateTime, formatShort, calcDeadline, isExpired };
