
const app = getApp();

Page({
  data: {
    isVip: false,
    repairCourses: [
      { id: 1, title: '腹直肌修复', duration: '15min', icon: '🧘‍♀️', isLocked: false },
      { id: 2, title: '盆底肌强化', duration: '12min', icon: '🦋', isLocked: true },
      { id: 3, title: '凯格尔运动', duration: '10min', icon: '🐚', isLocked: false },
    ],
    shapeCourses: [
      { id: 4, title: '瘦腿训练', duration: '20min', icon: '🦵', isLocked: true },
      { id: 5, title: '蜜桃臀养成', duration: '18min', icon: '🍑', isLocked: true },
      { id: 6, title: '天鹅颈体态', duration: '15min', icon: '🦢', isLocked: false },
    ],
    relaxCourses: [
      { id: 7, title: '舒缓瑜伽', duration: '20min', icon: '🍃', isLocked: true },
      { id: 8, title: '冥想呼吸', duration: '10min', icon: '🌬️', isLocked: false },
      { id: 9, title: '睡前助眠', duration: '15min', icon: '🌙', isLocked: true },
    ]
  },

  onShow() {
    this.setData({ isVip: app.globalData.isVip });
  },

  handleCourseTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.isLocked && !this.data.isVip) {
      wx.showModal({
        title: 'VIP 专属课程',
        content: '该课程为专业版会员独享，是否解锁？',
        confirmText: '去解锁',
        success: (res) => {
          if (res.confirm) {
             app.mockPay().then(() => this.setData({ isVip: true }));
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/training/index?title=${encodeURIComponent(item.title)}`
    });
  }
})
