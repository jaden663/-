
const deepseek = require('../../utils/deepseek.js');

Page({
  data: {
    msgList: [],
    inputText: '',
    isThinking: false,
    scrollToView: ''
  },

  onLoad() {
    // 页面加载时，AI 主动打招呼
    setTimeout(() => {
      this.addAIMessage("亲爱的，我是你的树洞闺蜜。带娃累坏了吧？有什么不开心的，随时和我说，我一直都在。🌻");
    }, 500);
  },

  handleInput(e) {
    this.setData({ inputText: e.detail.value });
  },

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

  sendMessage() {
    const content = this.data.inputText.trim();
    if (!content || this.data.isThinking) return;

    // 1. 上屏用户消息
    const newMsgList = this.data.msgList.concat({
      role: 'user',
      content: content
    });

    this.setData({
      msgList: newMsgList,
      inputText: '',
      isThinking: true,
      scrollToView: 'scroll-bottom'
    });

    // 2. 调用 API，传入特定的“树洞/闺蜜”人设
    const systemPrompt = "你是一位知心闺蜜，语气非常温柔、共情，善于倾听产后妈妈的烦恼。不要给出过于生硬的医疗建议，更多是情感支持和安慰。称呼用户为“亲爱的”或“宝贝”。";
    
    deepseek.chatWithAI(content, systemPrompt)
      .then(reply => {
        this.addAIMessage(reply);
      })
      .catch(err => {
        console.error('TreeHole Error:', err);
        wx.showToast({ title: '抱抱，网络有点卡', icon: 'none' });
        this.setData({ isThinking: false });
      });
  }
})
