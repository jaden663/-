Page({
  data: {
    title: '训练课程'
  },

  onLoad(options) {
    if (options.title) {
      this.setData({
        title: decodeURIComponent(options.title)
      });
      wx.setNavigationBarTitle({
        title: decodeURIComponent(options.title)
      });
    }
  },

  handleComplete() {
    wx.showLoading({ title: '记录打卡中...' });

    // 1. 保存打卡记录到本地存储
    const logs = wx.getStorageSync('training_logs') || [];
    logs.unshift({
      title: this.data.title,
      date: new Date().toISOString()
    });
    wx.setStorageSync('training_logs', logs);

    // 2. 模拟延迟后跳转到分享页
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '打卡成功！',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        // 跳转到分享页，带上 checkin 类型和课程名
        wx.navigateTo({
          url: `/pages/share/index?type=checkin&course=${encodeURIComponent(this.data.title)}`
        });
      }, 1000);
    }, 800);
  }
})