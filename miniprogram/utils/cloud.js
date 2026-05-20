// 云函数调用封装 — 统一处理 error、loading、日志

/**
 * 调用云函数 — 封装 wx.cloud.callFunction
 * @param {string} name - 云函数名称
 * @param {object} data - 传递给云函数的参数
 * @returns {Promise<any>} 云函数返回的 result 字段
 */
async function callCloud(name, data = {}) {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    return res.result;
  } catch (err) {
    console.error(`[Cloud] ${name} 调用失败:`, err);
    throw err;
  }
}

module.exports = { callCloud };
