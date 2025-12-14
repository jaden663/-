
const app = getApp();
// 创建全局唯一的背景音频管理器
const audioMgr = wx.getBackgroundAudioManager();

Page({
  data: {
    postpartumDay: 42,
    isVip: false,
    showPayModal: false,
    
    // --- 情感化 Data ---
    dailyQuote: "允许自己慢慢来，\n日子在发光，你也在。",
    dateStr: "",
    monthStr: "",
    showPosterModal: false,
    posterUrl: "",
    
    // --- 音乐 Data ---
    isPlaying: false,
    currentSong: {
      title: '晨间舒缓·钢琴曲',
      // 使用一个稳定的测试音频源
      src: 'https://dl.espressif.com/dl/audio/ff-16b-2c-44100hz.mp3',
      coverImgUrl: 'https://picsum.photos/300/300'
    },

    // --- 好运签 Data ---
    showLuckyModal: false,
    currentLuckyText: "",
    luckyMsgs: [
      "今天也是闪闪发光的一天 ✨",
      "你的温柔里藏着无穷的力量 💪",
      "允许自己休息，也是一种进步 🌿",
      "宝贝爱你，我们也爱你 ❤️",
      "深呼吸，好运正在发生 🍀",
      "慢慢来，比较快 🐢",
      "做不完也没关系，今天的你也很好 🌟"
    ],
    
    courseList: [
      { id: 1, title: '腹直肌修复', duration: '15min', icon: '🧘‍♀️', isLocked: false },
      { id: 2, title: '盆底肌强化', duration: '12min', icon: '🦋', isLocked: true },
      { id: 3, title: '舒缓瑜伽', duration: '20min', icon: '🍃', isLocked: true },
      { id: 4, title: '冥想呼吸', duration: '10min', icon: '🌬️', isLocked: false }
    ]
  },

  onLoad() {
    // 初始化日期
    const today = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    this.setData({
      dateStr: today.getDate(),
      monthStr: months[today.getMonth()]
    });

    // 监听音频播放状态，保持 UI 同步
    audioMgr.onPlay(() => this.setData({ isPlaying: true }));
    audioMgr.onPause(() => this.setData({ isPlaying: false }));
    audioMgr.onStop(() => this.setData({ isPlaying: false }));
    audioMgr.onEnded(() => this.setData({ isPlaying: false }));
  },

  onShow() {
    this.setData({
      isVip: app.globalData.isVip
    });
  },

  // --- 音乐控制逻辑 ---
  handleMusicTap() {
    if (this.data.isPlaying) {
      audioMgr.pause();
    } else {
      // 设置音频元数据
      audioMgr.title = this.data.currentSong.title;
      audioMgr.epname = '每日疗愈歌单';
      audioMgr.singer = 'AI 产后顾问';
      audioMgr.coverImgUrl = this.data.currentSong.coverImgUrl;
      audioMgr.src = this.data.currentSong.src;
      
      wx.showToast({
        title: '开始播放',
        icon: 'none',
        duration: 1500
      });
    }
  },

  // --- 心理支持入口 ---
  handleSupportTap() {
    // 跳转到独立的树洞页面，不使用 switchTab
    wx.navigateTo({
      url: '/pages/tree-hole/index'
    });
  },

  // --- 查看全部课程 ---
  handleViewAll() {
    wx.navigateTo({
      url: '/pages/course-list/index'
    });
  },

  // --- 好运签逻辑 ---
  handleLuckyTap() {
    const idx = Math.floor(Math.random() * this.data.luckyMsgs.length);
    this.setData({
      currentLuckyText: this.data.luckyMsgs[idx],
      showLuckyModal: true
    });
  },

  closeLuckyModal() {
    this.setData({ showLuckyModal: false });
  },

  // --- 生成日签海报 (新版设计) ---
  handleQuoteTap() {
    if (this.data.posterUrl) {
      this.setData({ showPosterModal: true });
      return;
    }
    
    wx.showLoading({ title: '正在手写日签...' });
    
    setTimeout(() => {
      this.initCanvas();
    }, 200);
  },

  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#quoteCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
           wx.hideLoading();
           return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 设定高宽：600x900 (2:3 比例，适合海报)
        const width = 600; 
        const height = 900;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        this.drawMagazinePoster(canvas, ctx, width, height);
      });
  },

  async drawMagazinePoster(canvas, ctx, width, height) {
    try {
      // 1. 背景 (暖调米色纸张感)
      ctx.fillStyle = '#FDFBF7';
      ctx.fillRect(0, 0, width, height);

      // 2. 白色边框 (模拟拍立得或画框效果)
      const borderSize = 24;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = borderSize;
      ctx.strokeRect(borderSize/2, borderSize/2, width - borderSize, height - borderSize);

      // 3. 顶部日期 (视觉重心上移)
      ctx.textAlign = 'center';
      
      // 日 (大数字)
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 120px serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(this.data.dateStr.toString(), width / 2, 180);
      
      // 月 & 年
      ctx.fillStyle = '#999999';
      ctx.font = '24px sans-serif';
      // ctx.letterSpacing = '4px'; // Canvas doesn't support this well, ignoring
      ctx.textBaseline = 'top';
      ctx.fillText(`${this.data.monthStr} · 2024`, width / 2, 190);

      // 4. 中间装饰 (淡色大引号)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.font = 'bold 300px serif';
      ctx.fillText('“', width / 2, 450);

      // 5. 核心文字 (居中，模拟诗歌)
      ctx.fillStyle = '#2C2C2C';
      ctx.font = 'italic 36px serif'; // 斜体增加文艺感
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 处理换行 (\n)
      const lines = this.data.dailyQuote.split('\n');
      const startY = 420;
      const lineHeight = 60;
      
      lines.forEach((line, index) => {
        // 计算每一行的偏移，使其整体垂直居中
        const y = startY + (index - (lines.length - 1) / 2) * lineHeight;
        ctx.fillText(line, width / 2, y);
      });

      // 6. 装饰横线
      ctx.beginPath();
      ctx.moveTo(width / 2 - 40, 600);
      ctx.lineTo(width / 2 + 40, 600);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 7. 底部 Footer
      const footerY = height - 80;
      
      // 左侧品牌
      ctx.textAlign = 'left';
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('产后修复每日练', 50, footerY);
      
      ctx.fillStyle = '#999999';
      ctx.font = '20px sans-serif';
      ctx.fillText('Stay warm, stay strong.', 50, footerY + 30);

      // 右侧二维码占位 (深色方块 + 提示)
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(width - 130, height - 130, 80, 80);
      
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', width - 90, height - 85);

      // 8. 导出
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvas: canvas,
          width: width,
          height: height,
          destWidth: width * 2, // 导出更高清
          destHeight: height * 2,
          success: (res) => {
            this.setData({
              posterUrl: res.tempFilePath,
              showPosterModal: true
            });
            wx.hideLoading();
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '生成失败', icon: 'none' });
          }
        });
      }, 200);

    } catch (e) {
      console.error(e);
      wx.hideLoading();
    }
  },

  savePoster() {
    if (!this.data.posterUrl) return;

    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterUrl,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth') || err.errMsg.includes('deny')) {
          wx.showModal({
            title: '需要权限',
            content: '请允许保存图片，以便留住这份美好。',
            success: (res) => { if (res.confirm) wx.openSetting(); }
          });
        }
      }
    });
  },

  closePosterModal() {
    this.setData({ showPosterModal: false });
  },

  handleHeroTap() {
    this.startTraining('5分钟骨盆修复');
  },

  handleCourseTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.isLocked && !this.data.isVip) {
      this.setData({ showPayModal: true });
      return;
    }
    this.startTraining(item.title);
  },

  startTraining(title) {
    wx.navigateTo({
      url: `/pages/training/index?title=${encodeURIComponent(title)}`
    });
  },

  closeModal() {
    this.setData({ showPayModal: false });
  },

  triggerPay() {
    app.mockPay().then(() => {
      this.setData({
        showPayModal: false,
        isVip: true
      });
    });
  }
})
