
Page({
  data: {
    currentYear: 2024,
    currentMonth: 1, // 1-12
    days: [],
    logs: [],
    trainCount: 0
  },

  onShow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    this.setData({
      currentYear: year,
      currentMonth: month
    });

    this.loadLogs();
    this.generateCalendar(year, month);
  },

  loadLogs() {
    const logs = wx.getStorageSync('training_logs') || [];
    this.setData({ 
      logs: logs,
      trainCount: logs.length
    });
  },

  generateCalendar(year, month) {
    // 1. 当月第一天是周几 (0-6)
    const firstDay = new Date(year, month - 1, 1).getDay();
    // 2. 当月有多少天
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const daysArr = [];
    
    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      daysArr.push({ day: '', isToday: false, hasLog: false });
    }

    const today = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() + 1 === month;

    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      // 检查这一天是否有记录 (简单比对日期字符串)
      // 注意：这里的比对逻辑比较简单，实际项目中建议用 Dayjs
      const hasLog = this.data.logs.some(log => {
        const d = new Date(log.date);
        return d.getDate() === i && d.getMonth() + 1 === month;
      });

      daysArr.push({
        day: i,
        isToday: isCurrentMonth && i === today,
        hasLog: hasLog
      });
    }

    this.setData({ days: daysArr });
  }
})
