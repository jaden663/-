import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- Configuration ---
// 1. 优先读取 Vercel 环境变量 VITE_DEEPSEEK_API_KEY
// 2. 如果没配置，则回退到硬编码的 Key (仅用于本地测试，上线务必配置环境变量)
const DEEPSEEK_API_KEY = (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || 'sk-1fd76eed72f74959afefa50a32dd69ff'; 

// --- API Helper ---
async function callDeepSeek(messages: {role: string, content: string}[], systemPrompt: string) {
  // 检查 Key 是否存在且不是占位符
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.includes('YOUR_DEEPSEEK_API_KEY')) {
    return "⚠️ 请在 Vercel 后台配置 VITE_DEEPSEEK_API_KEY 环境变量，或在代码中填入正确的 Key。";
  }

  try {
    // 转换消息格式以适配 API
    const apiMessages = messages.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    // DeepSeek 标准 API 调用
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...apiMessages
        ],
        stream: false
      })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("DeepSeek API Error Details:", errData);
        if (response.status === 401) return "API Key 无效或过期，请检查配置。";
        if (response.status === 402) return "API 余额不足，请充值。";
        return `API 请求失败 (${response.status})，请稍后再试。`;
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      return "我现在有点累，没有返回内容，请重试。";
    }
  } catch (error) {
    console.error("Network Error", error);
    return "网络连接异常，请检查您的网络设置。";
  }
}

// --- Styles ---
const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    backgroundColor: '#fff',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundImage: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
  },
  mobileFrame: {
    width: '375px',
    height: '100%',
    maxHeight: '812px', // iPhone X height
    backgroundColor: '#FAFAFA',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    borderRadius: '36px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    border: '8px solid #fff',
  },
  statusBar: {
    height: '44px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    fontWeight: '600',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
    backdropFilter: 'blur(5px)',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: '44px', // Space for status bar
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none', // Firefox
  },
  tabBar: {
    height: '80px', // Slightly taller for better touch targets
    backgroundColor: '#fff',
    boxShadow: '0 -5px 15px rgba(0,0,0,0.02)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: '12px',
    zIndex: 10,
    paddingBottom: '20px'
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '10px',
    color: '#B0B0B0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
  },
  tabItemActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  icon: {
    fontSize: '22px',
    marginBottom: '4px',
  },
  
  // --- Header, Emotional, Hero, Scroll styles ---
  header: { padding: '20px 24px 20px', display: 'flex', flexDirection: 'column' },
  dayLabel: { fontSize: '12px', color: '#999', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' },
  dayCount: { fontSize: '32px', fontWeight: '300', color: '#333', fontFamily: 'Times New Roman, serif' },
  emotionalContainer: { padding: '0 20px', marginBottom: '30px', position: 'relative' },
  actionBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingRight: '4px', gap: '8px' },
  actionBtn: { backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '8px 12px', borderRadius: '16px', fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.2s', flex: 1 },
  actionBtnActive: { backgroundColor: '#333', color: '#fff' },
  quoteCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.2s' },
  quoteDecorCircle: { position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#FFF0F5', zIndex: 0 },
  quoteDecorQuote: { position: 'absolute', top: '20px', left: '20px', fontSize: '60px', lineHeight: '1', color: '#F2F2F2', fontFamily: 'serif', zIndex: 0 },
  quoteContent: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' },
  quoteText: { fontSize: '16px', color: '#555', lineHeight: '1.8', fontWeight: '500', textAlign: 'center', fontStyle: 'italic', marginBottom: '16px', fontFamily: 'Times New Roman, serif' },
  quoteFooter: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  quoteDate: { fontSize: '11px', color: '#aaa', letterSpacing: '1px', borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '8px' },
  heroCard: { margin: '0 20px 30px', background: 'linear-gradient(120deg, #333 0%, #555 100%)', borderRadius: '24px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', color: '#fff', cursor: 'pointer' },
  heroTag: { fontSize: '10px', color: '#333', backgroundColor: '#F1D4A6', padding: '4px 10px', borderRadius: '12px', alignSelf: 'flex-start', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' },
  playBtn: { width: '44px', height: '44px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' },
  sectionTitle: { padding: '0 24px 16px', fontSize: '18px', fontWeight: '600', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  horizontalScroll: { display: 'flex', overflowX: 'auto', padding: '0 24px 40px', gap: '16px', scrollbarWidth: 'none' },
  courseCardH: { flex: '0 0 auto', width: '110px', height: '130px', backgroundColor: '#fff', borderRadius: '18px', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.1s' },

  // --- Modals, Input, Chat styles ---
  modalMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  inputAreaV2: { backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '12px 16px' },
  input: { flex: 1, border: 'none', backgroundColor: '#F5F7FA', padding: '12px 16px', borderRadius: '24px', fontSize: '14px', outline: 'none' },
  sendBtn: { marginLeft: '10px', backgroundColor: '#333', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer' },
  messageRow: { display: 'flex', marginBottom: '20px', alignItems: 'flex-start' },
  bubble: { padding: '12px 16px', fontSize: '15px', lineHeight: '1.6', borderRadius: '18px', maxWidth: '75%' },
  aiBubble: { backgroundColor: '#fff', color: '#333', marginLeft: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderTopLeftRadius: '4px' },
  userBubble: { backgroundColor: '#333', color: '#fff', marginRight: '10px', borderTopRightRadius: '4px' },
  avatarSmall: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', fontSize: '18px' },
  
  // --- User Profile Styles ---
  userContainer: {
    backgroundColor: '#F9F9F9',
    minHeight: '100%',
    paddingBottom: '80px',
    boxSizing: 'border-box',
    paddingTop: '20px', // Header built-in
  },
  userHeaderUpdated: {
    background: 'linear-gradient(to bottom, #FFF0F5 0%, #F9F9F9 100%)',
    padding: '30px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  userAvatarUpdated: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#eee',
    border: '3px solid #fff',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    marginBottom: '12px',
    cursor: 'pointer',
    position: 'relative',
  },
  userNameInput: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#333',
      fontFamily: 'Times New Roman, serif',
      marginBottom: '4px',
      textAlign: 'center',
      border: 'none',
      background: 'transparent',
      borderBottom: '1px dashed #ccc',
      outline: 'none',
      width: '80%'
  },
  userStatusUpdated: {
    fontSize: '12px',
    color: '#999',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  statsCardUpdated: {
    margin: '0 15px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px 10px',
    display: 'flex',
    justifyContent: 'space-around',
    boxShadow: '0 5px 20px rgba(0,0,0,0.03)',
  },
  statItemUpdated: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumUpdated: {
    fontSize: '24px',
    fontFamily: 'Times New Roman, serif',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
  },
  statLabelUpdated: {
    fontSize: '10px',
    color: '#BBB',
    letterSpacing: '1px',
    fontWeight: '600',
  },
  
  // --- New Smart Health Dashboard Styles ---
  healthDashboard: {
      margin: '0 15px 20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
  },
  healthRowMain: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
  },
  healthCol: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
  },
  visualDots: {
      display: 'flex',
      gap: '6px',
      marginBottom: '6px',
  },
  dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#eee',
  },
  dotDanger: { backgroundColor: '#FF85A1' },
  dotSafe: { backgroundColor: '#E0F2F1' },
  bmiCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '3px solid #E0F2F1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#00695C',
      marginBottom: '4px',
  },
  healthRowSub: {
      display: 'flex',
      gap: '10px',
  },
  subCard: {
      flex: 1,
      backgroundColor: '#FFFCFD',
      borderRadius: '8px',
      padding: '12px',
  },
  subValueRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: '8px',
  },
  trendBadge: {
      fontSize: '9px',
      padding: '1px 4px',
      borderRadius: '3px',
      backgroundColor: '#E8F5E9',
      color: '#2E7D32',
  },
  progressBar: {
      width: '100%',
      height: '4px',
      backgroundColor: '#eee',
      borderRadius: '2px',
      overflow: 'hidden',
  },
  
  // --- REDESIGNED PREMIUM VIP CARD ---
  vipCardPremium: {
    margin: '0 15px 20px',
    borderRadius: '20px',
    padding: '24px',
    background: 'linear-gradient(135deg, #FFF6E5 0%, #F5E6CA 100%)', // Champagne Gold Gradient
    boxShadow: '0 10px 30px rgba(233, 200, 150, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #EEDCBA',
  },
  vipTag: {
      position: 'absolute',
      top: 0,
      right: 0,
      background: '#FF6B6B',
      color: '#fff',
      fontSize: '10px',
      fontWeight: 'bold',
      padding: '4px 12px',
      borderBottomLeftRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  vipHeader: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '20px',
  },
  vipTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#5D4037',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'serif',
  },
  vipSubtitle: {
      fontSize: '12px',
      color: '#8D6E63',
      marginTop: '4px',
  },
  vipFeatureGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '20px',
  },
  vipFeatureItem: {
      width: '46%', // 2 cols
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      color: '#5D4037',
      fontWeight: '500',
  },
  vipFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: '10px',
      paddingTop: '15px',
      borderTop: '1px solid rgba(141, 110, 99, 0.1)',
  },
  vipPriceContainer: {
      display: 'flex',
      flexDirection: 'column',
  },
  vipOriginalPrice: {
      fontSize: '11px',
      color: '#A1887F',
      textDecoration: 'line-through',
  },
  vipCurrentPrice: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#3E2723',
  },
  vipPriceUnit: {
      fontSize: '12px',
      fontWeight: 'normal',
      marginLeft: '2px',
  },
  vipBtnPremium: {
      background: 'linear-gradient(90deg, #3E2723, #5D4037)',
      color: '#F5E6CA',
      fontSize: '13px',
      fontWeight: '600',
      padding: '10px 24px',
      borderRadius: '24px',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(93, 64, 55, 0.3)',
  },

  // --- UPDATED MENU LIST STYLES (NEW) ---
  menuListCard: {
    margin: '0 20px',
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  menuItemRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 12px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  menuIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    marginRight: '16px',
    flexShrink: 0,
  },
  menuContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '2px',
  },
  menuSubtitle: {
    fontSize: '11px',
    color: '#999',
    letterSpacing: '0.5px',
  },
  menuAction: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#ccc',
  },
  menuBadge: {
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontWeight: '600',
    marginLeft: '6px',
  },

  payModal: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '30px',
    width: '320px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  saveBtn: {
    marginTop: '20px',
    background: '#333',
    color: '#fff',
    border: 'none',
    padding: '12px 40px',
    borderRadius: '30px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
  },
  luckyCard: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    padding: '40px 30px',
    width: '300px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  },
  generatedPoster: {
    width: '320px',
    height: '480px',
    backgroundColor: '#FDFBF7',
    padding: '16px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transform: 'scale(0.95)',
  },
  posterInner: {
    flex: 1,
    border: '4px solid #fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    position: 'relative',
  },
  posterDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '40px',
  },
  posterDay: {
    fontSize: '64px',
    fontWeight: 'bold',
    fontFamily: 'serif',
    lineHeight: '0.8',
    color: '#333',
    marginBottom: '8px',
  },
  posterMonth: {
    fontSize: '12px',
    color: '#999',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  },
  posterQuoteMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  posterQuoteText: {
    fontSize: '20px',
    fontFamily: 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#333',
    lineHeight: '1.6',
    zIndex: 1,
  },
  posterDecorLine: {
    width: '30px',
    height: '1px',
    backgroundColor: '#ddd',
    marginTop: '30px',
  },
  posterFooter: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid rgba(0,0,0,0.05)',
    paddingTop: '20px',
  },
  posterBrand: {
    display: 'flex',
    flexDirection: 'column',
  },
  posterBrandName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
  },
  posterBrandSlogan: {
    fontSize: '10px',
    color: '#aaa',
    fontStyle: 'italic',
  },
  posterQr: {
    width: '40px',
    height: '40px',
    backgroundColor: '#eee',
    borderRadius: '2px',
  }
};

let globalIsVip = false;
let globalAvatar = ''; 
let globalNickName = '恢复中的妈妈';

// --- Shared Components ---

// 通用支付弹窗组件 (支持微信收款码)
function PayModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  return (
    <div style={styles.modalMask} onClick={onClose}>
      <div style={styles.payModal} onClick={e => e.stopPropagation()}>
        <div style={{fontSize:'20px', fontWeight:'bold', marginBottom:'10px'}}>解锁专业版</div>
         <p style={{color:'#666', fontSize:'14px', marginBottom:'15px'}}>
          扫码支付获取无限 AI 问答权限<br/>及全套专家修复课程
        </p>
        {/* QR Code Section */}
        <div style={{background: '#f8f8f8', padding: '15px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px'}}>
             <img src="https://i.postimg.cc/mrMPfcDh/1.jpg" alt="微信支付码" style={{width: '180px', height: '180px', objectFit: 'contain', display: 'block', borderRadius: '4px'}} 
             />
             <div style={{marginTop: '8px', fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px'}}>
                <span style={{color: '#09BB07', fontWeight: 'bold'}}>WeChat</span> 扫一扫支付
             </div>
        </div>
        
        <div style={{fontSize:'24px', fontWeight:'bold', color:'#333', marginBottom:'20px'}}>
          ¥199 <span style={{fontSize:'14px', fontWeight:'normal', color:'#999'}}>/ 年</span>
        </div>
        
        <button style={{...styles.saveBtn, width: '100%', background: '#09BB07'}} onClick={onSuccess}>
           我已支付
        </button>
        <div style={{marginTop: '15px', fontSize: '13px', color: '#999', cursor: 'pointer'}} onClick={onClose}>
           暂不需要
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function Home({isVip, setVip, onNavigate}: {isVip: boolean, setVip: (v: boolean) => void, onNavigate: (page: string, params?: any) => void}) {
  const [showModal, setShowModal] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [showLucky, setShowLucky] = useState(false);
  const [luckyText, setLuckyText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const dailyQuote = "允许自己慢慢来，\n日子在发光，你也在。";
  const today = new Date();
  const dateStr = today.getDate();
  const monthStr = today.toLocaleString('default', { month: 'short' });

  const courses = [
    { id: 1, title: '腹直肌修复', duration: '15min', icon: '🧘‍♀️', isLocked: false },
    { id: 2, title: '盆底肌强化', duration: '12min', icon: '🦋', isLocked: true },
    { id: 3, title: '舒缓瑜伽', duration: '20min', icon: '🍃', isLocked: true },
    { id: 4, title: '冥想呼吸', duration: '10min', icon: '🌬️', isLocked: false }
  ];

  const handlePaySuccess = () => {
    // 模拟验证过程
    const toast = document.createElement('div');
    toast.innerText = '正在确认支付结果...';
    Object.assign(toast.style, {
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '12px 24px', borderRadius: '30px',
      fontSize: '14px', zIndex: '9999', backdropFilter: 'blur(5px)'
    });
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
      setVip(true);
      globalIsVip = true;
      setShowModal(false);
      alert("欢迎加入 PRO 会员！🎉");
    }, 1500);
  };

  const handleQuoteClick = () => {
    const toast = document.createElement('div');
    toast.innerText = '正在为您手写日签...';
    Object.assign(toast.style, {
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '12px 24px', borderRadius: '30px',
      fontSize: '14px', zIndex: '9999', backdropFilter: 'blur(5px)'
    });
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
      setShowPoster(true);
    }, 1200);
  };

  const toggleMusic = () => {
    if (!isPlaying) {
      const toast = document.createElement('div');
      toast.innerText = '🎧 正在播放：晨间舒缓·钢琴曲';
      Object.assign(toast.style, {
        position: 'fixed', bottom: '100px', left: '50%', transform: 'translate(-50%, 0)',
        background: 'rgba(51,51,51,0.9)', color: '#fff', padding: '10px 20px', borderRadius: '30px',
        fontSize: '12px', zIndex: '9999', backdropFilter: 'blur(5px)', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
      });
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    }
    setIsPlaying(!isPlaying);
  };

  const handleLucky = () => {
      const msgs = [
          "今天也是闪闪发光的一天 ✨",
          "你的温柔里藏着无穷的力量 💪",
          "允许自己休息，也是一种进步 🌿",
          "宝贝爱你，我们也爱你 ❤️",
          "深呼吸，好运正在发生 🍀",
          "慢慢来，比较快 🐢"
      ];
      setLuckyText(msgs[Math.floor(Math.random() * msgs.length)]);
      setShowLucky(true);
  };

  return (
    <div style={styles.content}>
      {/* 1. Minimalist Header */}
      <div style={styles.header}>
        <div style={styles.dayLabel}>POSTPARTUM JOURNEY</div>
        <div style={styles.dayCount}>Day 42</div>
      </div>

      {/* 2. Emotional Section (Redesigned with Music & Lucky) */}
      <div style={styles.emotionalContainer}>
        {/* Action Buttons Row */}
        <div style={styles.actionBar}>
           <div 
             style={{...styles.actionBtn, ...(isPlaying ? styles.actionBtnActive : {})}} 
             onClick={toggleMusic}
           >
             <span>{isPlaying ? '⏸' : '🎧'}</span> 日推歌单
           </div>
           <div style={styles.actionBtn} onClick={() => onNavigate('treeHole')}>
             <span style={{color: '#FF99A6'}}>♥</span> 心理支持
           </div>
           <div style={styles.actionBtn} onClick={handleLucky}>
             <span style={{color: '#FFD700'}}>✨</span> 抽取好运
           </div>
        </div>

        {/* Quote Card */}
        <div style={styles.quoteCard} onClick={handleQuoteClick}>
          <div style={styles.quoteDecorQuote}>“</div>
          <div style={styles.quoteDecorCircle}></div>
          <div style={styles.quoteContent}>
            <div style={styles.quoteText}>{dailyQuote}</div>
            <div style={styles.quoteFooter}>
              <div style={styles.quoteDate}>{monthStr.toUpperCase()} {dateStr} · DAILY MOOD</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dark Hero Card */}
      <div style={styles.heroCard} onClick={() => onNavigate('training', { title: '5分钟骨盆修复' })}>
        <div>
          <div style={styles.heroTag}>TODAY'S FOCUS</div>
          <div style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '6px'}}>骨盆归位训练</div>
          <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>改善假胯宽 · 紧致体态</div>
        </div>
        <div style={styles.playBtn}>▶</div>
      </div>

      {/* 4. Horizontal Scroll */}
      <div style={styles.sectionTitle}>
        <span>推荐课程</span>
        <span style={{fontSize:'12px', color:'#999', cursor:'pointer'}} onClick={() => onNavigate('courseList')}>View All</span>
      </div>
      <div style={styles.horizontalScroll}>
        {courses.map(course => (
          <div key={course.id} style={styles.courseCardH} onClick={() => {
            if (course.isLocked && !isVip) setShowModal(true);
            else onNavigate('training', { title: course.title });
          }}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>{course.icon}</div>
            <div style={{fontSize: '13px', fontWeight: '600', color: '#333'}}>{course.title}</div>
            <div style={{fontSize: '10px', color: '#999', marginTop: '4px'}}>{course.duration}</div>
            {course.isLocked && !isVip && <div style={{position:'absolute', top:10, right:10, fontSize:'12px'}}>🔒</div>}
          </div>
        ))}
      </div>

      {/* Pay Modal with QR Code */}
      {showModal && (
        <PayModal onClose={() => setShowModal(false)} onSuccess={handlePaySuccess} />
      )}

      {/* Lucky Draw Modal */}
      {showLucky && (
        <div style={styles.modalMask} onClick={() => setShowLucky(false)}>
          <div style={styles.luckyCard} onClick={e => e.stopPropagation()}>
            <div style={{fontSize: '60px', marginBottom: '20px'}}>🍀</div>
            <div style={{fontSize: '18px', color: '#333', textAlign: 'center', lineHeight: '1.6', fontWeight: 'bold'}}>{luckyText}</div>
            <button style={{marginTop: '30px', ...styles.saveBtn, backgroundColor: '#FF99A6', width: 'auto', padding: '10px 30px'}} onClick={() => setShowLucky(false)}>收下祝福</button>
          </div>
        </div>
      )}

      {/* Poster Generation Modal (New Design) */}
      {showPoster && (
        <div style={styles.modalMask} onClick={() => setShowPoster(false)}>
          <div style={styles.generatedPoster} onClick={e => e.stopPropagation()}>
             <div style={styles.posterInner}>
                {/* Date Header */}
                <div style={styles.posterDate}>
                  <div style={styles.posterDay}>{dateStr}</div>
                  <div style={styles.posterMonth}>{monthStr} · 2024</div>
                </div>

                {/* Main Quote */}
                <div style={styles.posterQuoteMain}>
                   <div style={{fontSize:'80px', color:'rgba(0,0,0,0.05)', position:'absolute', top:-20, left:0, fontFamily:'serif'}}>“</div>
                   <div style={styles.posterQuoteText}>
                     允许自己慢慢来，<br/>日子在发光，<br/>你也在。
                   </div>
                   <div style={styles.posterDecorLine}></div>
                </div>

                {/* Footer */}
                <div style={styles.posterFooter}>
                   <div style={styles.posterBrand}>
                      <div style={styles.posterBrandName}>产后修复每日练</div>
                      <div style={styles.posterBrandSlogan}>Stay warm, stay strong.</div>
                   </div>
                   <div style={styles.posterQr}></div>
                </div>
             </div>
          </div>
          
          <button style={styles.saveBtn} onClick={() => { alert('已保存，愿你温暖常伴'); setShowPoster(false); }}>
            保存到相册
          </button>
        </div>
      )}
    </div>
  );
}

// AI Coach Component (Updated to use DeepSeek)
function AICoach() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    const newMessages = [...messages, {role: 'user', content: text}];
    setMessages(newMessages);
    setLoading(true);

    const systemPrompt = "你是一位专业的产后康复教练，语气温柔但专业，回答简短实用，专注于产后恢复知识。";
    const reply = await callDeepSeek(newMessages, systemPrompt);
    
    setMessages(p => [...p, {role: 'ai', content: reply}]);
    setLoading(false);
  };

  return (
    <div style={{...styles.content, display: 'flex', flexDirection: 'column', height: '100%', background: '#F9F9F9'}}>
      <div ref={scrollRef} style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
        {messages.length === 0 && (
           <div style={{textAlign:'center', marginTop:'100px', opacity:0.6}}>
              <div style={{fontSize:'40px', marginBottom:'20px'}}>✨</div>
              <p>我是你的 AI 康复顾问<br/>今天感觉怎么样？</p>
           </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{...styles.messageRow, flexDirection: m.role === 'user' ? 'row-reverse' : 'row'}}>
            <div style={{...styles.avatarSmall, marginLeft: m.role==='user'?10:0, marginRight: m.role==='ai'?10:0}}>
              {m.role === 'user' ? '👩' : '🤖'}
            </div>
            <div style={m.role === 'user' ? {...styles.bubble, ...styles.userBubble} : {...styles.bubble, ...styles.aiBubble}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{padding:'20px', color:'#999', fontSize:'12px'}}>对方正在输入...</div>}
      </div>
      <div style={styles.inputAreaV2}>
        <input style={styles.input} value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." onKeyDown={e=>e.key==='Enter'&&handleSend()}/>
        <button style={styles.sendBtn} onClick={handleSend}>↑</button>
      </div>
    </div>
  );
}

// Tree Hole Component (Updated to use DeepSeek)
function TreeHole({onBack}: {onBack: () => void}) {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     // 初始欢迎语
     const welcome = '亲爱的，我是你的树洞闺蜜。带娃累坏了吧？有什么不开心的，随时和我说，我一直都在。🌻';
     setMessages([{role: 'ai', content: welcome}]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    const newMessages = [...messages, {role: 'user', content: text}];
    setMessages(newMessages);
    setLoading(true);
    
    const systemPrompt = "你是一位知心闺蜜，语气非常温柔、共情，善于倾听产后妈妈的烦恼。不要给出过于生硬的医疗建议，更多是情感支持和安慰。称呼用户为“亲爱的”或“宝贝”。";
    const reply = await callDeepSeek(newMessages, systemPrompt);
    
    setMessages(p => [...p, {role: 'ai', content: reply}]);
    setLoading(false);
  };

  return (
    <div style={{...styles.content, display: 'flex', flexDirection: 'column', height: '100%', background: '#FFF9FA'}}>
      <div style={{...styles.statusBar, background:'#fff', borderBottom:'1px solid #eee'}}>
         <div style={{position:'absolute', left:20, cursor:'pointer'}} onClick={onBack}>←</div>
         我的树洞
      </div>
      <div ref={scrollRef} style={{flex: 1, overflowY: 'auto', padding: '20px', paddingTop: '60px'}}>
        {messages.map((m, i) => (
          <div key={i} style={{...styles.messageRow, flexDirection: m.role === 'user' ? 'row-reverse' : 'row'}}>
            <div style={{...styles.avatarSmall, marginLeft: m.role==='user'?10:0, marginRight: m.role==='ai'?10:0, background:'#FFD1DC', border: '2px solid #fff'}}>
              {m.role === 'user' ? '👩' : '🧸'}
            </div>
            <div style={m.role === 'user' ? {...styles.bubble, backgroundColor: '#FFB7C5', color: '#fff', borderTopRightRadius:4} : {...styles.bubble, backgroundColor: '#fff', borderTopLeftRadius:4}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{padding:'20px', color:'#999', fontSize:'12px'}}>正在倾听...</div>}
      </div>
      <div style={styles.inputAreaV2}>
        <input style={{...styles.input, background:'#fff'}} value={input} onChange={e => setInput(e.target.value)} placeholder="说点什么吧..." onKeyDown={e=>e.key==='Enter'&&handleSend()}/>
        <button style={{...styles.sendBtn, background:'#FF99A6'}} onClick={handleSend}>↑</button>
      </div>
    </div>
  );
}

function User({isVip, setVip, onNavigate}: any) {
    const [avatar, setAvatar] = useState(globalAvatar || 'https://picsum.photos/120/120');
    const [nickName, setNickName] = useState(globalNickName);
    const [showHealth, setShowHealth] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false); // 控制支付弹窗
    const [healthData, setHealthData] = useState({weight: '58.5', waist: '76', diastasis: '2.5'});

    const handleMenuClick = (type: string) => {
        if(type === 'contact') {
             // More helpful interaction
             alert('在线服务时间：09:00 - 21:00\n如有急事请留言。');
        }
        else if(type === 'record') onNavigate('calendar');
        else if(type === 'report') {
            if(!isVip) {
                // 原先是 confirm，现在改为显示支付弹窗
                setShowPayModal(true);
            } else {
                alert('报告正在生成中，请稍候...');
            }
        } else if (type === 'share') {
           alert('已生成邀请海报，分享给好友即可获得 7 天会员体验！');
        }
    };

    const handlePaySuccess = () => {
        // 模拟验证过程
        const toast = document.createElement('div');
        toast.innerText = '正在确认支付结果...';
        Object.assign(toast.style, {
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '12px 24px', borderRadius: '30px',
          fontSize: '14px', zIndex: '9999', backdropFilter: 'blur(5px)'
        });
        document.body.appendChild(toast);
    
        setTimeout(() => {
          document.body.removeChild(toast);
          setVip(true);
          globalIsVip = true;
          setShowPayModal(false);
          alert("欢迎加入 PRO 会员！🎉");
        }, 1500);
    };
    
    const handleAvatarClick = () => {
        const newAvatar = `https://picsum.photos/120/120?random=${Date.now()}`;
        setAvatar(newAvatar);
        globalAvatar = newAvatar;
    };

    const handleNickNameBlur = (e: any) => {
        setNickName(e.target.value);
        globalNickName = e.target.value;
    }

    return (
        <div style={styles.userContainer}>
            {/* Header */}
            <div style={styles.userHeaderUpdated}>
                <div style={styles.userAvatarUpdated} onClick={handleAvatarClick}>
                    <img src={avatar} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'3px solid #fff'}} />
                    <div style={{position:'absolute', bottom:0, right:0, background:'#333', color:'#fff', width:'24px', height:'24px', borderRadius:'50%', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff'}}>📷</div>
                </div>
                <input style={styles.userNameInput} defaultValue={nickName} onBlur={handleNickNameBlur} />
                <div style={styles.userStatusUpdated}>IN RECOVERY FOR 42 DAYS</div>
                {isVip && <span style={{fontSize:'12px', background:'#333', color:'#F1D4A6', padding:'2px 6px', borderRadius:'6px', marginTop:'6px'}}>PRO MEMBER</span>}
            </div>

            {/* Stats */}
            <div style={styles.statsCardUpdated}>
                <div style={styles.statItemUpdated}><div style={styles.statNumUpdated}>12</div><div style={styles.statLabelUpdated}>DAYS</div></div>
                <div style={{width:'1px', height:'30px', background:'#eee'}}></div>
                <div style={styles.statItemUpdated}><div style={styles.statNumUpdated}>185</div><div style={styles.statLabelUpdated}>MINS</div></div>
                <div style={{width:'1px', height:'30px', background:'#eee'}}></div>
                <div style={styles.statItemUpdated}><div style={styles.statNumUpdated}>960</div><div style={styles.statLabelUpdated}>KCAL</div></div>
            </div>

            {/* Smart Health Dashboard */}
            <div style={{margin: '0 15px 10px', display:'flex', justifyContent:'space-between', fontSize:'14px', fontWeight:'600'}}>
                 <span>我的恢复档案</span>
                 <span style={{color:'#FF99A6', fontSize:'12px', cursor:'pointer'}} onClick={() => setShowHealth(true)}>更新数据 &gt;</span>
            </div>
            <div style={styles.healthDashboard}>
               <div style={styles.healthRowMain}>
                  <div style={styles.healthCol}>
                     <div style={{fontSize:'12px', color:'#666', marginBottom:'8px'}}>腹直肌分离</div>
                     <div style={styles.visualDots}>
                        {[1,2,3,4,5].map(i => (
                             <div key={i} style={{...styles.dot, ...(i <= parseFloat(healthData.diastasis) ? styles.dotDanger : styles.dotSafe) }}></div>
                        ))}
                     </div>
                     <div style={{fontSize:'12px'}}>
                        <span style={{fontSize:'18px', fontWeight:'bold'}}>{healthData.diastasis}</span> 指
                        <span style={{marginLeft:'5px', fontSize:'10px', background:'#FFEBEE', color:'#C62828', padding:'2px 5px', borderRadius:'4px'}}>需改善</span>
                     </div>
                  </div>
                  <div style={{width:'1px', height:'40px', background:'#eee'}}></div>
                  <div style={styles.healthCol}>
                     <div style={{fontSize:'12px', color:'#666', marginBottom:'8px'}}>BMI 指数</div>
                     <div style={styles.bmiCircle}>21.5</div>
                  </div>
               </div>

               <div style={styles.healthRowSub}>
                   <div style={styles.subCard}>
                       <div style={{fontSize:'11px', color:'#999', marginBottom:'5px'}}>体重 (kg)</div>
                       <div style={styles.subValueRow}>
                           <span style={{fontWeight:'bold', fontSize:'16px'}}>{healthData.weight}</span>
                           <span style={styles.trendBadge}>↓ 1.5</span>
                       </div>
                       <div style={styles.progressBar}><div style={{...styles.progressBar, width:'70%', background:'#81C784', height:'100%'}}></div></div>
                   </div>
                   <div style={styles.subCard}>
                       <div style={{fontSize:'11px', color:'#999', marginBottom:'5px'}}>腰围 (cm)</div>
                       <div style={styles.subValueRow}>
                           <span style={{fontWeight:'bold', fontSize:'16px'}}>{healthData.waist}</span>
                           <span style={styles.trendBadge}>↓ 2.0</span>
                       </div>
                       <div style={styles.progressBar}><div style={{...styles.progressBar, width:'60%', background:'#FF85A1', height:'100%'}}></div></div>
                   </div>
               </div>
            </div>

            {/* UPGRADED VIP Card (Highly Converting) */}
            {!isVip ? (
                <div style={styles.vipCardPremium} onClick={() => setShowPayModal(true)}>
                    <div style={styles.vipTag}>限时 5 折</div>
                    <div style={styles.vipHeader}>
                        <div style={styles.vipTitle}>
                           <span style={{fontSize:'24px'}}>👑</span>
                           <span>PRO 会员计划</span>
                        </div>
                        <div style={styles.vipSubtitle}>每天仅需 0.5 元，找回少女感</div>
                    </div>

                    <div style={styles.vipFeatureGrid}>
                       <div style={styles.vipFeatureItem}><span style={{fontSize:'16px'}}>🧘‍♀️</span> 解锁 50+ 专家课</div>
                       <div style={styles.vipFeatureItem}><span style={{fontSize:'16px'}}>📋</span> 定制修复计划</div>
                       <div style={styles.vipFeatureItem}><span style={{fontSize:'16px'}}>💬</span> 24h 康复私教</div>
                       <div style={styles.vipFeatureItem}><span style={{fontSize:'16px'}}>📊</span> 深度体态报告</div>
                    </div>

                    <div style={styles.vipFooter}>
                       <div style={styles.vipPriceContainer}>
                          <span style={styles.vipOriginalPrice}>原价 ¥399</span>
                          <div>
                             <span style={styles.vipCurrentPrice}>¥199</span>
                             <span style={styles.vipPriceUnit}>/年</span>
                          </div>
                       </div>
                       <button style={styles.vipBtnPremium}>立即开启蜕变</button>
                    </div>
                </div>
            ) : (
                // Active State (Simplified)
                <div style={{...styles.vipCardPremium, background: '#333', border:'none'}} onClick={() => {}}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', color:'#F1D4A6'}}>
                      <div style={{fontSize:'18px', fontWeight:'bold', fontFamily:'serif'}}>PRO Member</div>
                      <div style={{fontSize:'10px', background:'#F1D4A6', color:'#333', padding:'3px 8px', borderRadius:'6px'}}>ACTIVE</div>
                   </div>
                   <div style={{fontSize:'12px', color:'#bbb', marginBottom:'15px'}}>有效期至 2025.12.31</div>
                </div>
            )}


            {/* UPGRADED MENU LIST (UI Polish & Functional Supplements) */}
            <div style={styles.menuListCard}>
                 {/* Training Calendar */}
                 <div style={styles.menuItemRow} onClick={() => handleMenuClick('record')}>
                    <div style={{...styles.menuIconBox, backgroundColor: '#E3F2FD', color: '#1976D2'}}>
                        📅
                    </div>
                    <div style={styles.menuContent}>
                        <div style={styles.menuTitle}>训练日历</div>
                        <div style={styles.menuSubtitle}>已连续坚持 12 天，继续保持！</div>
                    </div>
                    <div style={styles.menuAction}>
                         去打卡 <span style={{fontSize:'14px', marginLeft:'4px'}}>›</span>
                    </div>
                </div>

                 {/* Body Report */}
                 <div style={styles.menuItemRow} onClick={() => handleMenuClick('report')}>
                    <div style={{...styles.menuIconBox, backgroundColor: '#F3E5F5', color: '#9C27B0'}}>
                        📊
                    </div>
                    <div style={styles.menuContent}>
                        <div style={styles.menuTitle}>体态报告</div>
                        <div style={styles.menuSubtitle}>
                            {isVip ? '最近更新：今天 09:30' : '解锁 PRO 查看深度分析'}
                        </div>
                    </div>
                    <div style={styles.menuAction}>
                        {!isVip && <span style={{fontSize:'14px', marginRight:'5px'}}>🔒</span>}
                         <span style={{fontSize:'14px'}}>›</span>
                    </div>
                </div>

                 {/* Invite Friends */}
                 <div style={styles.menuItemRow} onClick={() => handleMenuClick('share')}>
                    <div style={{...styles.menuIconBox, backgroundColor: '#FFEBEE', color: '#E91E63'}}>
                        💌
                    </div>
                    <div style={styles.menuContent}>
                        <div style={styles.menuTitle}>邀请好友 <span style={{...styles.menuBadge, background:'#FFE0B2', color:'#E65100'}}>福利</span></div>
                        <div style={styles.menuSubtitle}>邀请即送 7 天会员体验</div>
                    </div>
                    <div style={styles.menuAction}>
                         去邀请 <span style={{fontSize:'14px', marginLeft:'4px'}}>›</span>
                    </div>
                </div>

                 {/* Contact Support */}
                 <div style={styles.menuItemRow} onClick={() => handleMenuClick('contact')}>
                    <div style={{...styles.menuIconBox, backgroundColor: '#E0F2F1', color: '#009688'}}>
                        🎧
                    </div>
                    <div style={styles.menuContent}>
                        <div style={styles.menuTitle}>联系客服</div>
                        <div style={styles.menuSubtitle}>服务时间 09:00 - 21:00</div>
                    </div>
                    <div style={styles.menuAction}>
                         咨询 <span style={{fontSize:'14px', marginLeft:'4px'}}>›</span>
                    </div>
                </div>
            </div>
            
             <div style={{textAlign: 'center', color:'#ccc', fontSize:'10px', marginTop:'30px', letterSpacing:'1px'}}>v3.2.1 · Designed for Moms</div>

             {/* Pay Modal (User Page) */}
             {showPayModal && (
                <PayModal onClose={() => setShowPayModal(false)} onSuccess={handlePaySuccess} />
             )}

             {/* Health Record Modal */}
             {showHealth && (
               <div style={styles.modalMask} onClick={() => setShowHealth(false)}>
                 <div style={{...styles.payModal, textAlign:'left'}} onClick={e => e.stopPropagation()}>
                    <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'20px'}}>更新记录</div>
                    <div style={{marginBottom:'15px'}}>
                        <label style={{fontSize:'12px', color:'#666', display:'block', marginBottom:'5px'}}>体重 (kg)</label>
                        <input style={{...styles.input, width:'100%', boxSizing:'border-box'}} type="number" onChange={e => healthData.weight = e.target.value} />
                    </div>
                    <div style={{marginBottom:'15px'}}>
                        <label style={{fontSize:'12px', color:'#666', display:'block', marginBottom:'5px'}}>腹直肌分离 (指)</label>
                        <input style={{...styles.input, width:'100%', boxSizing:'border-box'}} type="number" onChange={e => healthData.diastasis = e.target.value} />
                    </div>
                    <button style={{...styles.saveBtn, width:'100%'}} onClick={() => {
                        setHealthData({...healthData});
                        setShowHealth(false);
                    }}>保存</button>
                 </div>
               </div>
             )}
        </div>
    )
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState('main'); // main, training, courseList, calendar, treeHole
  const [isVip, setVip] = useState(globalIsVip);

  const navigate = (page: string, params?: any) => {
    if (page === 'coach') {
      setActiveTab('coach');
    } else {
      setCurrentView(page);
    }
  };

  if (currentView === 'training') {
      return (
          <div style={styles.app}><div style={{...styles.mobileFrame, background:'#000'}}>
             <div style={{color:'#fff', padding:'20px'}} onClick={()=>setCurrentView('main')}>← Back</div>
             <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>Video Player Placeholder</div>
          </div></div>
      )
  }

  if (currentView === 'treeHole') {
      return (
          <div style={styles.app}><div style={styles.mobileFrame}>
             <TreeHole onBack={()=>setCurrentView('main')} />
          </div></div>
      )
  }

  if (currentView === 'courseList') {
    return (
       <div style={styles.app}><div style={styles.mobileFrame}>
           <div style={{...styles.statusBar, background:'#fff', borderBottom:'1px solid #eee'}}>
             <div style={{position:'absolute', left:20}} onClick={()=>setCurrentView('main')}>←</div>
             课程图书馆
           </div>
           <div style={{padding:'60px 20px 20px', overflowY:'auto', background:'#FDFBF9', height:'100%'}}>
              <div style={{fontSize:'18px', fontWeight:'bold', marginBottom:'15px'}}>🩹 核心修复</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'30px'}}>
                  <div style={{width:'48%', background:'#fff', padding:'20px 10px', borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
                      <div style={{fontSize:'36px', marginBottom:'10px'}}>🧘‍♀️</div>
                      <div style={{fontWeight:'bold', fontSize:'14px'}}>腹直肌修复</div>
                  </div>
                  <div style={{width:'48%', background:'#fff', padding:'20px 10px', borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
                      <div style={{fontSize:'36px', marginBottom:'10px'}}>🦋</div>
                      <div style={{fontWeight:'bold', fontSize:'14px'}}>盆底肌强化</div>
                  </div>
              </div>

               <div style={{fontSize:'18px', fontWeight:'bold', marginBottom:'15px'}}>🍃 舒缓放松</div>
               <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                   <div style={{width:'48%', background:'#fff', padding:'20px 10px', borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
                       <div style={{fontSize:'36px', marginBottom:'10px'}}>🌙</div>
                       <div style={{fontWeight:'bold', fontSize:'14px'}}>睡前助眠</div>
                   </div>
               </div>
           </div>
       </div></div>
    )
  }

  if (currentView === 'calendar') {
     return (
        <div style={styles.app}><div style={styles.mobileFrame}>
           <div style={{...styles.statusBar, background:'#fff', borderBottom:'1px solid #eee'}}>
             <div style={{position:'absolute', left:20}} onClick={()=>setCurrentView('main')}>←</div>
             我的坚持
           </div>
           <div style={{padding:'60px 20px 20px', overflowY:'auto', background:'#fff', height:'100%'}}>
              <div style={{fontSize:'32px', fontWeight:'bold', fontFamily:'serif', marginBottom:'30px'}}>1 <span style={{fontSize:'16px', color:'#999', fontWeight:'normal'}}>/ 2024</span></div>
              <div style={{display:'flex', marginBottom:'15px'}}>
                 {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{flex:1, textAlign:'center', color:'#ccc', fontSize:'12px', fontWeight:'bold'}}>{d}</div>)}
              </div>
              <div style={{display:'flex', flexWrap:'wrap'}}>
                 {[...Array(31)].map((_, i) => (
                    <div key={i} style={{width:'14.28%', height:'50px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                       <div style={{width:'30px', height:'30px', lineHeight:'30px', textAlign:'center', borderRadius:'50%', background: i===15?'#333':'transparent', color: i===15?'#fff':'#333'}}>{i+1}</div>
                       {[5,12,15].includes(i+1) && <div style={{width:'5px', height:'5px', borderRadius:'50%', background:'#FF99A6', marginTop:'4px'}}></div>}
                    </div>
                 ))}
              </div>
              <div style={{marginTop:'40px', borderTop:'1px solid #f5f5f5', paddingTop:'20px'}}>
                 <div style={{fontWeight:'bold', marginBottom:'15px'}}>RECENT ACTIVITY</div>
                 <div style={{padding:'15px 0', borderBottom:'1px solid #f9f9f9', display:'flex', alignItems:'center'}}>
                     <span style={{color:'#999', fontSize:'12px', width:'50px'}}>Done</span>
                     <span style={{flex:1}}>5分钟骨盆修复</span>
                     <span style={{color:'#FF99A6'}}>✓</span>
                 </div>
              </div>
           </div>
        </div></div>
     )
  }

  return (
    <div style={styles.app}>
      <div style={styles.mobileFrame}>
        {/* Status Bar Content */}
        <div style={styles.statusBar}>
           {activeTab === 'home' && 'Discovery'}
           {activeTab === 'coach' && 'Assistant'}
           {activeTab === 'user' && 'Profile'}
        </div>

        <div style={styles.content}>
          {activeTab === 'home' && <Home isVip={isVip} setVip={setVip} onNavigate={navigate} />}
          {activeTab === 'coach' && <AICoach />}
          {activeTab === 'user' && <User isVip={isVip} setVip={setVip} onNavigate={navigate} />}
        </div>

        <div style={styles.tabBar}>
          <div style={styles.tabItem} onClick={() => setActiveTab('home')}>
            <span style={{...styles.icon, color: activeTab==='home'?'#333':'#ccc'}}>●</span>
            <span style={activeTab === 'home' ? styles.tabItemActive : {}}>Home</span>
          </div>
          <div style={styles.tabItem} onClick={() => setActiveTab('coach')}>
            <span style={{...styles.icon, color: activeTab==='coach'?'#333':'#ccc'}}>●</span>
            <span style={activeTab === 'coach' ? styles.tabItemActive : {}}>AI康复顾问</span>
          </div>
          <div style={styles.tabItem} onClick={() => setActiveTab('user')}>
            <span style={{...styles.icon, color: activeTab==='user'?'#333':'#ccc'}}>●</span>
            <span style={activeTab === 'user' ? styles.tabItemActive : {}}>Me</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);