
const app = getApp();

Page({
  data: {
    isVip: false,
    userInfo: {
      nickName: '恢复中的妈妈',
      avatarUrl: 'https://picsum.photos/120/120'
    },
    // 统计数据
    stats: {
      days: 0,
      minutes: 0,
      calories: 0
    },
    // 健康数据
    healthData: {
      weight: '',
      waist: '',
      diastasis: '',
      updateTime: ''
    },
    bmiValue: '--', 
    
    // 菜单状态文案
    menuStatus: {
      calendar: '已连续坚持 0 天',
      report: '解锁 PRO 查看深度分析'
    },

    showHealthModal: false,
    tempHealth: {
      weight: '',
      waist: '',
      diastasis: ''
    }
  },

  onLoad() {
    const savedUser = wx.getStorageSync('user_profile');
    if (savedUser) {
      this.setData({ userInfo: savedUser });
    }

    const savedHealth = wx.getStorageSync('health_record');
    if (savedHealth) {
      this.setData({ healthData: savedHealth });
      this.calculateBMI(savedHealth.weight);
    }
  },

  onShow() {
    this.setData({
      isVip: app.globalData.isVip
    });
    this.refreshStats();
  },

  refreshStats() {
    const logs = wx.getStorageSync('training_logs') || [];
    const count = logs.length;
    
    // 更新统计
    this.setData({
      'stats.days': count, // 真实天数
      'stats.minutes': count * 15, // 假设平均15分钟
      'stats.calories': count * 80, // 假设平均80卡
      // 更新菜单上的动态文案
      'menuStatus.calendar': count > 0 ? `已坚持 ${count} 天，继续保持！` : '开始你的第一天打卡吧',
      'menuStatus.report': this.data.isVip ? '最近更新：今天 09:30' : '解锁 PRO 查看深度分析'
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    });
    this.saveUserProfile();
  },

  handleNicknameChange(e) {
    const nickName = e.detail.value;
    if (nickName) {
      this.setData({
        'userInfo.nickName': nickName
      });
      this.saveUserProfile();
    }
  },

  saveUserProfile() {
    wx.setStorageSync('user_profile', this.data.userInfo);
  },

  // --- Health Logic ---
  openHealthModal() {
    this.setData({
      showHealthModal: true,
      tempHealth: { ...this.data.healthData }
    });
  },

  closeHealthModal() {
    this.setData({ showHealthModal: false });
  },
  
  bindHealthInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`tempHealth.${field}`]: e.detail.value
    });
  },

  calculateBMI(weight) {
    if(!weight) return;
    const height = 1.65; // standard mock height
    const bmi = (weight / (height * height)).toFixed(1);
    this.setData({ bmiValue: bmi });
  },

  saveHealthData() {
    const { weight, waist, diastasis } = this.data.tempHealth;
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}月${now.getDate()}日`;

    const newData = { weight, waist, diastasis, updateTime: timeStr };

    this.setData({
      healthData: newData,
      showHealthModal: false
    });
    
    this.calculateBMI(weight);
    wx.setStorageSync('health_record', newData);
    wx.showToast({ title: '记录成功', icon: 'success' });
  },

  // --- VIP Logic ---
  handleVipAction() {
    if (this.data.isVip) return;
    app.mockPay().then(() => {
      this.setData({ 
        isVip: true,
        'menuStatus.report': '最近更新：今天 09:30' // 立即更新文案
      });
    });
  },

  // --- Menu Interactions ---
  handleMenuClick(e) {
    const type = e.currentTarget.dataset.type;
    
    // 震动反馈，增加交互质感
    wx.vibrateShort({ type: 'light' });

    if (type === 'record') {
      wx.navigateTo({ url: '/pages/calendar/index' });
    } 
    else if (type === 'report') {
      if (!this.data.isVip) {
        wx.showModal({
          title: '会员专属',
          content: '体态评估报告为 PRO 会员专属功能，是否解锁？',
          confirmText: '去解锁',
          confirmColor: '#FF85A1',
          success: (res) => {
            if (res.confirm) this.handleVipAction();
          }
        });
      } else {
        wx.showToast({ title: '报告生成中...', icon: 'loading' });
      }
    } 
    else if (type === 'share') {
      wx.navigateTo({ url: '/pages/share/index?type=invite' });
    } 
    else if (type === 'contact') {
       wx.showModal({
         title: '联系客服',
         content: '在线服务时间：09:00 - 21:00\n您的专属顾问 Amy 正在待命。',
         confirmText: '拨打',
         confirmColor: '#009688',
         success: (res) => {
           if(res.confirm) wx.makePhoneCall({ phoneNumber: '10086' });
         }
       });
    }
  }
})
