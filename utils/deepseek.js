
// DeepSeek API Configuration
const API_KEY = 'sk-1fd76eed72f74959afefa50a32dd69ff'; // ✅ 已填入您的 Key
const API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * 发送消息给 DeepSeek AI
 * @param {string} userText - 用户输入的文本
 * @param {string} systemPrompt - 系统预设人设 (默认是康复教练)
 * @returns {Promise<string>} - 返回 AI 的回复文本
 */
const chatWithAI = (userText, systemPrompt = "你是一位专业的产后康复教练，语气温柔，回答简短实用。") => {
  return new Promise((resolve, reject) => {
    // 检查 Key 是否填写
    if (!API_KEY || API_KEY === 'YOUR_DEEPSEEK_API_KEY') {
      console.warn('请在 utils/deepseek.js 中配置您的 API Key');
      reject(new Error('API Key 未配置')); // Fail fast
      return;
    }

    wx.request({
      url: API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userText
          }
        ],
        stream: false
      },
      success: (res) => {
        // 打印完整响应以便调试
        console.log('DeepSeek API Response:', res);

        if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices.length > 0) {
          const reply = res.data.choices[0].message.content;
          resolve(reply);
        } else {
          // 处理非 200 错误或格式错误
          const errorMsg = res.data && res.data.error ? res.data.error.message : 'API 请求异常';
          console.error('API Error:', errorMsg);
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        console.error('Network Request Failed:', err);
        reject(new Error('网络请求失败'));
      }
    });
  });
};

module.exports = {
  chatWithAI
};
