App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    userInfo: null,
    isVip: false // 全局 VIP 状态
  },

  // 模拟支付功能
  mockPay() {
    return new Promise((resolve) => {
      wx.showLoading({
        title: '安全支付中...',
        mask: true
      });

      // 模拟网络延迟 1.5秒
      setTimeout(() => {
        wx.hideLoading();
        
        // 更新全局状态
        this.globalData.isVip = true;
        
        wx.showToast({
          title: '会员开通成功',
          icon: 'success',
          duration: 2000
        });

        resolve(true);
      }, 1500);
    });
  }
})