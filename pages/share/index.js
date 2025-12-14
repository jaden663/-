const app = getApp();

Page({
  data: {
    posterUrl: '', // 最终生成的图片路径
    userInfo: {
      nickName: 'Amy',
      avatarUrl: 'https://picsum.photos/100/100' // Mock Data
    },
    type: 'invite', // 'invite' | 'checkin'
    courseName: ''
  },

  onLoad(options) {
    // 接收参数
    this.setData({
      type: options.type || 'invite',
      courseName: options.course ? decodeURIComponent(options.course) : ''
    });

    // 延迟执行确保 Canvas 节点准备好
    setTimeout(() => {
      this.initCanvas();
    }, 200);
  },

  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        if (!res[0]) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 高清屏适配
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        await this.drawPoster(canvas, ctx, res[0].width, res[0].height);
      });
  },

  async drawPoster(canvas, ctx, width, height) {
    wx.showLoading({ title: '绘制海报中...' });

    try {
      // 1. 加载通用资源
      const bgPromise = this.loadImage(canvas, '');
      const avatarPromise = this.loadImage(canvas, this.data.userInfo.avatarUrl);
      const qrPromise = this.loadImage(canvas, 'https://dummyimage.com/200x200/eee/000&text=QRCode');
      // 如果是打卡模式，可以加载一个徽章图标 (这里用 mock)
      const badgePromise = this.data.type === 'checkin' ? this.loadImage(canvas, 'https://dummyimage.com/100x100/FF99A6/fff&text=Badge') : Promise.resolve(null);

      const [_, avatarImg, qrImg, badgeImg] = await Promise.all([bgPromise, avatarPromise, qrPromise, badgePromise]);

      // 2. 绘制背景
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (this.data.type === 'checkin') {
        // 打卡模式：稍微深一点的粉色
        gradient.addColorStop(0, '#FFE4E8');
        gradient.addColorStop(1, '#FFF5F7');
      } else {
        // 邀请模式：浅粉
        gradient.addColorStop(0, '#FFF0F5');
        gradient.addColorStop(1, '#FFFFFF');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // --- 分支逻辑 ---
      if (this.data.type === 'checkin') {
        this.drawCheckinContent(ctx, width, height, avatarImg, qrImg, badgeImg);
      } else {
        this.drawInviteContent(ctx, width, height, avatarImg, qrImg);
      }

      // 导出
      this.exportImage(canvas);

    } catch (e) {
      console.error('绘制失败', e);
      wx.showToast({ title: '绘制失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // --- 绘制打卡海报内容 ---
  drawCheckinContent(ctx, width, height, avatarImg, qrImg, badgeImg) {
    // 1. 大标题 (Day Count)
    ctx.fillStyle = '#FF85A1';
    ctx.font = 'bold italic 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DAY 42', width / 2, 100);

    // 2. 副标题
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('产后修复打卡', width / 2, 140);

    // 3. 课程名卡片背景
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 10;
    ctx.fillRect(40, 180, width - 80, 100);
    ctx.shadowColor = 'transparent'; // Reset shadow

    // 4. 课程文字
    ctx.fillStyle = '#666666';
    ctx.font = '14px sans-serif';
    ctx.fillText('今日完成课程', width / 2, 215);
    
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(this.data.courseName || '核心训练', width / 2, 245);

    // 5. 用户信息 (底部左侧)
    const avatarR = 25;
    const avatarX = 80;
    const avatarY = 400;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.data.userInfo.nickName, avatarX + 35, avatarY + 5);

    ctx.fillStyle = '#999999';
    ctx.font = '12px sans-serif';
    ctx.fillText('邀请你一起加入', avatarX + 35, avatarY + 25);

    // 6. 二维码 (底部右侧)
    ctx.drawImage(qrImg, width - 110, 360, 80, 80);
  },

  // --- 绘制邀请海报内容 (原逻辑) ---
  drawInviteContent(ctx, width, height, avatarImg, qrImg) {
      // 主标题
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('送你一张 AI 体态评估卡', width / 2, 80);

      // 副标题
      ctx.fillStyle = '#999999';
      ctx.font = '14px sans-serif';
      ctx.fillText('产后修复 · 每日10分钟', width / 2, 110);

      // 圆形头像
      const avatarR = 40;
      const avatarX = width / 2;
      const avatarY = 180;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();

      // 用户名
      ctx.fillStyle = '#666666';
      ctx.font = '16px sans-serif';
      ctx.fillText(`你的好友 [${this.data.userInfo.nickName}] 邀请你一起变美`, width / 2, 260);

      // 小程序码
      const qrSize = 120;
      ctx.drawImage(qrImg, (width - qrSize) / 2, 300, qrSize, qrSize);

      // 底部提示
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '12px sans-serif';
      ctx.fillText('长按识别小程序码', width / 2, 450);
  },

  loadImage(canvas, src) {
    return new Promise((resolve, reject) => {
      if (!src) { resolve(null); return; }
      const img = canvas.createImage();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  },

  exportImage(canvas) {
    wx.canvasToTempFilePath({
      canvas: canvas,
      success: (res) => {
        this.setData({ posterUrl: res.tempFilePath });
      },
      fail: (err) => {
        console.error('导出失败', err);
      }
    });
  },

  handleSave() {
    if (!this.data.posterUrl) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterUrl,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth') || err.errMsg.includes('deny')) {
          this.showAuthModal();
        } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    });
  },

  showAuthModal() {
    wx.showModal({
      title: '提示',
      content: '需要您授权保存图片到相册',
      confirmText: '去设置',
      confirmColor: '#FF99A6',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting();
        }
      }
    });
  }
})