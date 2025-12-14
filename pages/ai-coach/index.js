
const deepseek = require('../../utils/deepseek.js');
const app = getApp();

Page({
  data: {
    msgList: [], 
    quickQuestions: [
      "腹直肌几指了？", 
      "腰疼怎么办", 
      "什么时候能跑步", 
      "可以吃冰的吗"
    ],
    inputText: '',
    isThinking: false,
    scrollToView: ''
  },

  onLoad() {
    // 页面初始化
  },

  // 处理输入框输入
  handleInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 点击快捷问题胶囊
  handleQuickTap(e) {
    const text = e.currentTarget.dataset.text;
    if (this.data.isThinking) return;

    // 直接发送
    this.setData({ inputText: text });
    this.sendMessage();
  },

  // 添加 AI 消息到列表的辅助函数
  addAIMessage(text) {
    const updatedMsgList = this.data.msgList.concat({
      role: 'ai',
      content: text
    });
    this.setData({
      msgList: updatedMsgList,
      isThinking: false,
      scrollToView: `msg-${updatedMsgList.length - 1}`
    });
  },

  // 发送消息核心逻辑
  sendMessage() {
    const content = this.data.inputText.trim();
    if (!content || this.data.isThinking) return;

    // 1. 用户消息上屏
    const newMsgList = this.data.msgList.concat({
      role: 'user',
      content: content
    });

    this.setData({
      msgList: newMsgList,
      inputText: '', // 清空输入框
      isThinking: true, // 显示思考中
      scrollToView: 'scroll-bottom' // 滚动到底部
    });

    // 2. 调用 DeepSeek API
    // 明确传入“康复教练”的人设
    const coachPrompt = "你是一位专业的产后康复教练，语气温柔但专业，回答简短实用，专注于产后恢复知识。";

    deepseek.chatWithAI(content, coachPrompt)
      .then(reply => {
        // 3. AI 消息上屏
        this.addAIMessage(reply);
      })
      .catch(err => {
        console.error('Chat Error:', err);
        // 4. 错误处理
        wx.showToast({
          title: '网络开小差了',
          icon: 'none',
          duration: 2000
        });
        
        this.setData({
          isThinking: false
        });
      });
  }
})
