/**
 * 尼泊尔手工本工作室 - 主题库
 * 每个主题包含背景样式、装饰元素、推荐文字颜色
 */
const THEMES = {
  moon: {
    name: '🌙 月亮',
    bg: 'radial-gradient(circle at 70% 35%, rgba(255,235,130,0.6) 0%, rgba(255,215,100,0.2) 25%, transparent 40%), linear-gradient(180deg, #1a1a3e 0%, #2d2d5e 40%, #3d3d7c 70%, #5a5a8e 100%)',
    textColor: '#FFF8E1',
    accents: ['✦', '✧', '⭐'],
    decoHtml: '<div class="deco-moon"></div>',
    css: '.deco-moon{position:absolute;top:12%;right:15%;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFF8E1,#FFD54F 60%,#FFA000);box-shadow:0 0 40px rgba(255,215,100,0.5),inset -10px -10px 20px rgba(200,150,0,0.3);animation:deco-float 4s infinite ease-in-out}'
  },
  rose: {
    name: '🌹 玫瑰',
    bg: 'radial-gradient(ellipse at 30% 40%, rgba(220,20,60,0.3), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(178,34,34,0.3), transparent 50%), linear-gradient(135deg, #4a0000, #8B0000 40%, #B22222 70%, #CD5C5C)',
    textColor: '#FFC0CB',
    accents: ['🌹', '❤️', '💕'],
    decoHtml: '<div class="deco-rose" style="top:15%;left:20%">🌹</div><div class="deco-rose" style="top:60%;right:15%">🌹</div><div class="deco-rose" style="bottom:20%;left:30%">🌹</div>',
    css: '.deco-rose{position:absolute;font-size:40px;filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.3))}'
  },
  firework: {
    name: '🎆 烟花',
    bg: 'linear-gradient(180deg, #0a0a2a 0%, #16213e 40%, #1a1a4e 70%, #0f3460 100%)',
    textColor: '#FFD700',
    accents: ['✦', '✧', '🎆'],
    decoHtml: '<div class="deco-firework" style="top:20%;left:30%;--c:#FFD700"></div><div class="deco-firework" style="top:35%;right:25%;--c:#FF6B6B;animation-delay:.5s"></div><div class="deco-firework" style="top:55%;left:20%;--c:#4ECDC4;animation-delay:1s"></div><div class="deco-firework" style="bottom:25%;right:30%;--c:#FFB347;animation-delay:1.5s"></div>',
    css: '.deco-firework{position:absolute;width:6px;height:6px;border-radius:50%;animation:deco-explode 2.5s infinite ease-out}.deco-firework::before{content:"";position:absolute;top:50%;left:50%;width:80px;height:80px;border-radius:50%;border:2px solid;border-color:var(--c) transparent transparent transparent;transform:translate(-50%,-50%);opacity:0;animation:deco-ring 2.5s infinite ease-out}@keyframes deco-explode{0%{transform:scale(0);opacity:1}100%{transform:scale(1);opacity:0}}@keyframes deco-ring{0%{width:6px;height:6px;opacity:1;border-width:3px}100%{width:120px;height:120px;opacity:0;border-width:1px}}'
  },
  sun: {
    name: '☀️ 太阳',
    bg: 'radial-gradient(circle at 50% 45%, rgba(255,200,50,0.5) 0%, rgba(255,160,30,0.3) 30%, transparent 50%), linear-gradient(180deg, #FF6B35 0%, #FF8E42 30%, #FFB347 60%, #FFD700 100%)',
    textColor: '#FFF3E0',
    accents: ['☀️', '🌻', '🌟'],
    decoHtml: '<div class="deco-sun"></div>',
    css: '.deco-sun{position:absolute;top:10%;left:50%;transform:translateX(-50%);width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,#FFEB3B,#FF9800 60%,#FF5722);box-shadow:0 0 60px rgba(255,150,0,0.6),0 0 100px rgba(255,100,0,0.3);animation:deco-pulse 3s infinite ease-in-out}@keyframes deco-pulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.05)}}'
  },
  wave: {
    name: '🌊 海浪',
    bg: 'linear-gradient(180deg, #4FC3F7 0%, #29B6F6 30%, #0288D1 60%, #01579B 100%)',
    textColor: '#E1F5FE',
    accents: ['🌊', '🐚', '🫧'],
    decoHtml: '<div class="deco-wave"></div><div class="deco-wave-line" style="top:65%"></div><div class="deco-wave-line" style="top:72%"></div><div class="deco-wave-line" style="top:80%"></div>',
    css: '.deco-wave{position:absolute;bottom:0;left:0;width:100%;height:40%;background:radial-gradient(ellipse 200% 100% at 50% 100%, rgba(255,255,255,0.3), transparent);animation:deco-wave-move 4s infinite ease-in-out}.deco-wave-line{position:absolute;width:80%;left:10%;height:3px;background:rgba(255,255,255,0.3);border-radius:50%}@keyframes deco-wave-move{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}'
  },
  star: {
    name: '✨ 星空',
    bg: 'linear-gradient(180deg, #0d0d2a 0%, #1a1a4e 40%, #2d1b4e 70%, #4a2c5e 100%)',
    textColor: '#E0E0FF',
    accents: ['✦', '✧', '⭐'],
    decoHtml: '<div class="deco-twinkle" style="top:15%;left:15%">✦</div><div class="deco-twinkle" style="top:25%;right:20%;animation-delay:.3s">✧</div><div class="deco-twinkle" style="top:40%;left:25%;animation-delay:.6s">✦</div><div class="deco-twinkle" style="top:50%;right:15%;animation-delay:.9s">✧</div><div class="deco-twinkle" style="bottom:20%;right:25%;animation-delay:1.5s">✧</div><div class="deco-twinkle" style="bottom:35%;left:30%;animation-delay:1.2s">✦</div>',
    css: '.deco-twinkle{position:absolute;color:#FFD700;font-size:16px;animation:deco-twinkle 2s infinite ease-in-out}@keyframes deco-twinkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2);text-shadow:0 0 10px #FFD700}}'
  },
  flower: {
    name: '🌸 花开',
    bg: 'radial-gradient(ellipse at 20% 30%, rgba(186,85,211,0.2), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(255,105,180,0.2), transparent 50%), linear-gradient(135deg, #66BB6A 0%, #9CCC65 30%, #C5E1A5 60%, #F1F8E9 100%)',
    textColor: '#4A148C',
    accents: ['🌸', '🌷', '🌺'],
    decoHtml: '<div class="deco-petal" style="left:10%"></div><div class="deco-petal" style="left:30%;animation-delay:1s"></div><div class="deco-petal" style="left:50%;animation-delay:2s;background:rgba(186,85,211,0.5)"></div><div class="deco-petal" style="left:70%;animation-delay:3s"></div><div class="deco-petal" style="left:85%;animation-delay:1.5s;background:rgba(186,85,211,0.5)"></div>',
    css: '.deco-petal{position:absolute;top:-20px;width:12px;height:12px;background:rgba(255,150,200,0.6);border-radius:50% 0 50% 0;animation:deco-fall 6s infinite linear}@keyframes deco-fall{0%{transform:translateY(0) rotate(0deg);opacity:.8}100%{transform:translateY(680px) rotate(360deg);opacity:0}}'
  },
  cake: {
    name: '🎂 甜心',
    bg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2 40%, #FFCC80 70%, #FFB74D)',
    textColor: '#5D4037',
    accents: ['🎂', '🍰', '🧁'],
    decoHtml: '',
    css: ''
  },
  sunset: {
    name: '🌅 日落',
    bg: 'linear-gradient(180deg, #FF512F 0%, #DD2476 30%, #FF6B6B 50%, #FFE66D 80%, #FFD93D 100%)',
    textColor: '#FFF',
    accents: ['🌅', '🌇', '🦋'],
    decoHtml: '',
    css: ''
  },
  forest: {
    name: '🌿 森林',
    bg: 'linear-gradient(180deg, #1B3B36 0%, #2D5A4A 30%, #3E7C5F 60%, #5B9279 100%)',
    textColor: '#C8E6C9',
    accents: ['🌿', '🍂', '🦌'],
    decoHtml: '',
    css: ''
  },
  lavender: {
    name: '💜 薰衣草',
    bg: 'linear-gradient(180deg, #3D1E5E 0%, #6A3093 30%, #A855F7 60%, #D8B4FE 100%)',
    textColor: '#F3E8FF',
    accents: ['💜', '🔮', '🦋'],
    decoHtml: '',
    css: ''
  },
  cover: {
    name: '📔 封面',
    bg: 'radial-gradient(ellipse at 50% 30%, rgba(255,200,100,0.3), transparent 60%), linear-gradient(135deg, #8B4513, #A0522D 40%, #D2691E 70%, #CD853F)',
    textColor: '#FFE4B5',
    accents: ['❤️', '📔'],
    decoHtml: '',
    css: ''
  },
  ending: {
    name: '🌈 终章',
    bg: 'radial-gradient(ellipse at 50% 40%, rgba(255,180,100,0.3), transparent 60%), linear-gradient(135deg, #5D4037, #795548 40%, #A1887F 70%, #D7CCC8)',
    textColor: '#FFF8E1',
    accents: ['🌈', '❤️', '✨'],
    decoHtml: '',
    css: ''
  }
};

/** 全局动画CSS（一次注入） */
const THEME_GLOBAL_CSS = `
@keyframes deco-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes deco-heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
`;

/** 贴纸库 */
const STICKERS = [
  '❤️','🌹','🌙','⭐','✨','🎆','☀️','🌊','🌸','🌷','🌺','🎂','🍰','🧁',
  '🌈','💕','💖','💗','🍄','🦋','🐝','🕊️','🌿','🍀','🍁','🎈','🎁','🎀',
  '🎵','🎶','☕','🍵','🍇','🍓','🍒','🍑','🍍','🥐','🍦','🍫','🍬','🍭',
  '💝','💌','💍','👑','💎','🔥','❄️','⚡','🌙','☄️','🌟','💫','🔮','🎐'
];

/** 字体库 */
const FONTS = [
  { name: '马善政体', value: "'Ma Shan Zheng', serif" },
  { name: '快乐体', value: "'ZCOOL KuaiLe', sans-serif" },
  { name: '毛笔体', value: "'Liu Jian Mao Cao', cursive" },
  { name: '宋体', value: "serif" },
  { name: '黑体', value: "sans-serif" },
  { name: '楷体', value: "'KaiTi', 'STKaiti', serif" },
];

/** 默认模板 */
const TEMPLATES = {
  love: {
    title: '致最爱的你', subtitle: '— handmade with love —', coverTheme: 'cover',
    pages: [
      { theme: 'moon', elements: [{ type:'text', content:'我的月亮\n永悬不落', x:35, y:40, fontSize:24, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'rose', elements: [{ type:'text', content:'今天的玫瑰\n是爱你的形状', x:35, y:40, fontSize:22, color:'#FFC0CB', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'firework', elements: [{ type:'text', content:'雨是神明的烟花\n而你是我的奇迹', x:30, y:40, fontSize:22, color:'#FFD700', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'sun', elements: [{ type:'text', content:'太阳 一直在\n我也是', x:35, y:55, fontSize:24, color:'#FFF3E0', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'人生是旷野 不是轨道\n夏天周而复始\n相见自会有时', x:25, y:35, fontSize:20, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  },
  friendship: {
    title: '致最好的闺蜜', subtitle: '— 友谊万岁 —', coverTheme: 'flower',
    pages: [
      { theme: 'flower', elements: [{ type:'text', content:'最好的时光\n是有你在身边的时光', x:30, y:35, fontSize:22, color:'#4A148C', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'sun', elements: [{ type:'text', content:'你是我的太阳\n照亮每一个低谷', x:35, y:50, fontSize:22, color:'#FFF3E0', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'cake', elements: [{ type:'text', content:'一起笑过哭过\n这才是闺蜜', x:30, y:40, fontSize:22, color:'#5D4037', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'lavender', elements: [{ type:'text', content:'岁月很长\n幸好有你', x:35, y:45, fontSize:24, color:'#F3E8FF', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'友谊是一杯陈酿的酒\n越久越香\n干杯 我亲爱的闺蜜', x:25, y:35, fontSize:18, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  },
  gratitude: {
    title: '感恩有你', subtitle: '— Thank You —', coverTheme: 'forest',
    pages: [
      { theme: 'forest', elements: [{ type:'text', content:'感谢你\n出现在我的生命里', x:30, y:40, fontSize:24, color:'#C8E6C9', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'sun', elements: [{ type:'text', content:'你的帮助\n是我前行的力量', x:30, y:50, fontSize:22, color:'#FFF3E0', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'wave', elements: [{ type:'text', content:'滴水之恩\n涌泉相报', x:30, y:45, fontSize:24, color:'#E1F5FE', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'世界因你而美好\n愿你的每一天\n都被温柔以待', x:25, y:35, fontSize:20, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  },
  travel: {
    title: '旅行记忆', subtitle: '— 在路上 —', coverTheme: 'sunset',
    pages: [
      { theme: 'sunset', elements: [{ type:'text', content:'世界那么大\n我们一起去看看', x:30, y:40, fontSize:24, color:'#FFF', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'wave', elements: [{ type:'text', content:'大海的声音\n是自由的召唤', x:30, y:45, fontSize:22, color:'#E1F5FE', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'forest', elements: [{ type:'text', content:'穿越森林\n遇见更好的自己', x:30, y:40, fontSize:22, color:'#C8E6C9', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'moon', elements: [{ type:'text', content:'异乡的月亮\n和家乡的一样圆', x:30, y:40, fontSize:20, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'人生就是一场旅行\n不在乎目的地\n只在乎沿途的风景', x:22, y:35, fontSize:18, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  },
  birthday: {
    title: '生日快乐', subtitle: '— Happy Birthday —', coverTheme: 'cake',
    pages: [
      { theme: 'cake', elements: [{ type:'text', content:'祝你生日快乐\n不止今天', x:30, y:40, fontSize:24, color:'#5D4037', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'sun', elements: [{ type:'text', content:'愿你的每一天\n都像今天一样灿烂', x:25, y:45, fontSize:20, color:'#FFF3E0', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'firework', elements: [{ type:'text', content:'烟花为你绽放\n愿你许的愿望都实现', x:25, y:40, fontSize:20, color:'#FFD700', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'愿你年年有今日\n岁岁有今朝\n生日快乐！', x:30, y:35, fontSize:22, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  },
  wedding: {
    title: '婚礼纪念', subtitle: '— 执子之手 —', coverTheme: 'rose',
    pages: [
      { theme: 'rose', elements: [{ type:'text', content:'执子之手\n与子偕老', x:32, y:40, fontSize:26, color:'#FFC0CB', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'moon', elements: [{ type:'text', content:'愿我如星君如月\n夜夜流光相皎洁', x:25, y:40, fontSize:18, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'lavender', elements: [{ type:'text', content:'爱是恒久忍耐\n又有恩慈', x:28, y:42, fontSize:20, color:'#F3E8FF', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'firework', elements: [{ type:'text', content:'今天全世界\n都在为你们祝福', x:28, y:42, fontSize:22, color:'#FFD700', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'愿你们的爱情\n像紫藤花一样\n年年盛开 永不凋零', x:25, y:35, fontSize:19, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  },
  baby: {
    title: '宝宝成长记', subtitle: '— 记录每一个瞬间 —', coverTheme: 'star',
    pages: [
      { theme: 'star', elements: [{ type:'text', content:'你是坠落人间的\n小星星', x:30, y:40, fontSize:24, color:'#E0E0FF', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'cake', elements: [{ type:'text', content:'第一次笑\n第一次翻身\n每一次都是奇迹', x:25, y:38, fontSize:18, color:'#5D4037', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'sun', elements: [{ type:'text', content:'愿阳光\n永远照在你脸上', x:32, y:48, fontSize:22, color:'#FFF3E0', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'flower', elements: [{ type:'text', content:'像花儿一样\n健康快乐地长大', x:28, y:42, fontSize:22, color:'#4A148C', fontFamily:"'Ma Shan Zheng', serif" }] },
      { theme: 'ending', elements: [{ type:'text', content:'你是爸爸妈妈\n最珍贵的宝贝\n愿你一生平安喜乐', x:25, y:35, fontSize:20, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif" }] },
    ]
  }
};

/** 加载自定义主题（从localStorage） */
function loadCustomThemes() {
  try {
    const saved = JSON.parse(localStorage.getItem('nepal_custom_themes') || '{}');
    Object.entries(saved).forEach(([key, data]) => {
      THEMES[key] = data;
    });
  } catch(e) {}
}

/** 保存自定义主题 */
function saveCustomTheme(key, data) {
  try {
    const saved = JSON.parse(localStorage.getItem('nepal_custom_themes') || '{}');
    saved[key] = data;
    localStorage.setItem('nepal_custom_themes', JSON.stringify(saved));
    THEMES[key] = data;
  } catch(e) { console.error('保存主题失败', e); }
}

/** 删除自定义主题 */
function deleteCustomTheme(key) {
  try {
    const saved = JSON.parse(localStorage.getItem('nepal_custom_themes') || '{}');
    delete saved[key];
    localStorage.setItem('nepal_custom_themes', JSON.stringify(saved));
    delete THEMES[key];
  } catch(e) {}
}

/** 加载自定义贴纸 */
function loadCustomStickers() {
  try {
    const saved = JSON.parse(localStorage.getItem('nepal_custom_stickers') || '[]');
    saved.forEach(s => STICKERS.push(s));
  } catch(e) {}
}

/** 保存自定义贴纸 */
function saveCustomSticker(dataUrl) {
  try {
    STICKERS.push(dataUrl);
    const saved = JSON.parse(localStorage.getItem('nepal_custom_stickers') || '[]');
    saved.push(dataUrl);
    // 限制最多20个
    if (saved.length > 20) saved.shift();
    localStorage.setItem('nepal_custom_stickers', JSON.stringify(saved));
  } catch(e) { console.error('保存贴纸失败', e); }
}

/** 构建主题CSS */
function buildThemeCSS(bgColor1, bgColor2, direction) {
  const dir = direction === 'vertical' ? '180deg' : direction === 'diagonal' ? '135deg' : '90deg';
  return `linear-gradient(${dir}, ${bgColor1}, ${bgColor2})`;
}

// 启动时加载
loadCustomThemes();
loadCustomStickers();

window.THEMES = THEMES;
window.THEME_GLOBAL_CSS = THEME_GLOBAL_CSS;
window.STICKERS = STICKERS;
window.FONTS = FONTS;
window.TEMPLATES = TEMPLATES;
