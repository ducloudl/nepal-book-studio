/**
 * 尼泊尔手工本工作室 - 预览器模块
 * 3D翻页 + 全屏 + 分享
 */
const Viewer = {
  book: null,
  currentPage: 0,
  totalPages: 0,

  /** 初始化 */
  init(book) {
    this.book = book;
    this.currentPage = 0;
    this.render();
    App.show('viewer');
  },

  render() {
    if (!this.book) return;
    const book = this.book;

    // 头部
    document.getElementById('viewer-title').textContent = book.title;
    document.getElementById('viewer-title').onclick = () => App.go('library');

    // 生成翻页结构：一个book有N页纸，每张纸有正反两面
    // 页面列表: page0_front, page0_back=page1_front, page1_back=page2_front, ...
    // 扁平化：faces = [p0_front, p1_front, p2_front, ...]
    // 纸张数 = ceil(pages_count / 2)
    const allPages = book.pages; // 每个page对象 = 一个面向读者的面
    this.totalPages = Math.ceil(allPages.length / 2); // 纸张数

    // 生成背景星星
    const starsEl = document.getElementById('viewer-stars');
    let starsHTML = '';
    for (let i = 0; i < 60; i++) {
      starsHTML += `<div class="v-star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*3}s;opacity:${0.2+Math.random()*0.5}"></div>`;
    }
    starsEl.innerHTML = starsHTML;

    // 生成翻页HTML
    const bookEl = document.getElementById('viewer-book');
    let pagesHtml = '';
    for (let i = 0; i < this.totalPages; i++) {
      const leftIdx = i * 2;
      const rightIdx = i * 2 + 1;
      const leftPage = allPages[leftIdx];
      const rightPage = allPages[rightIdx];

      pagesHtml += `<div class="viewer-page" data-vp="${i}">
        <div class="viewer-page-front" style="${this.pageBG(leftPage)}">
          ${this.pageContent(leftPage)}
        </div>`;

      if (rightPage) {
        pagesHtml += `<div class="viewer-page-back" style="${this.pageBG(rightPage)}">
          ${this.pageContent(rightPage)}
        </div>`;
      } else {
        // 空白背面
        pagesHtml += `<div class="viewer-page-back" style="background:var(--bg2);">
          <div style="color:var(--text2);font-size:14px;">~ 尾页 ~</div>
        </div>`;
      }
      pagesHtml += `</div>`;
    }
    bookEl.innerHTML = pagesHtml;

    // 进度
    this.renderProgress();

    // 翻页事件
    bookEl.onclick = (e) => {
      const rect = bookEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > rect.width / 2) this.nextPage();
      else this.prevPage();
    };

    // 键盘
    document.onkeydown = (e) => {
      if (e.key === 'ArrowRight') this.nextPage();
      if (e.key === 'ArrowLeft') this.prevPage();
      if (e.key === 'Escape') App.go('library');
    };

    // 注入动画CSS
    this.injectAnimCSS();

    // 音频播放器
    this.renderAudio();
  },

  injectAnimCSS() {
    if (document.getElementById('anim-css')) return;
    const s = document.createElement('style'); s.id = 'anim-css';
    s.textContent = `
      @keyframes el-fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes el-slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      @keyframes el-slideLeft { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
      @keyframes el-slideRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
      @keyframes el-zoomIn { from{opacity:0;transform:scale(0.3)} to{opacity:1;transform:scale(1)} }
      @keyframes el-bounce { 0%{opacity:0;transform:scale(0.3)} 50%{transform:scale(1.15)} 70%{transform:scale(0.9)} 100%{opacity:1;transform:scale(1)} }
      .anim-trigger { animation-duration: 0.6s; animation-fill-mode: both; animation-play-state: paused; }
      .anim-trigger.anim-run { animation-play-state: running; }
    `;
    document.head.appendChild(s);
  },

  /** 音频播放器 */
  renderAudio() {
    const existing = document.getElementById('viewer-audio-player');
    if (existing) existing.remove();
    this.audioEl = null;

    if (!this.book.audio) return;

    const container = document.createElement('div');
    container.id = 'viewer-audio-player';
    container.style.cssText = 'position:fixed;bottom:110px;right:30px;z-index:60;background:rgba(18,18,26,0.85);backdrop-filter:blur(12px);border:1px solid rgba(200,150,62,0.25);border-radius:40px;padding:8px 16px;display:flex;align-items:center;gap:10px;color:#F0EBE3;font-family:system-ui;font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';

    const btn = document.createElement('button');
    btn.textContent = '▶';
    btn.style.cssText = 'width:32px;height:32px;border-radius:50%;border:1px solid rgba(200,150,62,0.3);background:rgba(200,150,62,0.15);color:#E8C97A;font-size:14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;';
    btn.onmouseenter = () => btn.style.background = 'rgba(200,150,62,0.3)';
    btn.onmouseleave = () => btn.style.background = 'rgba(200,150,62,0.15)';

    const info = document.createElement('span');
    info.textContent = '🎵 ' + (this.book.audio.name || '背景音乐');
    info.style.cssText = 'max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background:none;border:none;color:#8B856E;cursor:pointer;font-size:16px;padding:2px;';
    closeBtn.onclick = () => { this.stopAudio(); container.remove(); };

    container.appendChild(btn);
    container.appendChild(info);
    container.appendChild(closeBtn);
    document.getElementById('view-viewer').appendChild(container);

    // 创建audio元素
    const audio = new Audio();
    audio.src = this.book.audio.type === 'dataUrl' ? this.book.audio.data : this.book.audio.data;
    audio.loop = true;
    audio.volume = 0.6;
    this.audioEl = audio;

    let playing = false;
    btn.onclick = () => {
      if (playing) { audio.pause(); btn.textContent = '▶'; }
      else { audio.play().catch(() => App.toast('点击页面任意位置后音乐将开始')); btn.textContent = '⏸'; }
      playing = !playing;
    };

    // 首次交互后自动播放
    const autoPlay = () => {
      audio.play().then(() => { playing = true; btn.textContent = '⏸'; }).catch(() => {});
      document.removeEventListener('click', autoPlay);
    };
    document.addEventListener('click', autoPlay, { once: true });
  },

  stopAudio() {
    if (this.audioEl) { this.audioEl.pause(); this.audioEl = null; }
  },

  /** 导出当前页为PNG */
  async exportPNG() {
    // 找当前可见页
    const bp = this.book.pages;
    const visibleIdx = this.currentPage * 2; // 当前左侧页
    const page = bp[visibleIdx];
    if (!page) { App.toast('没有可导出的页面', true); return; }

    const W = 1080, H = 1440;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 背景
    const theme = THEMES[page.theme] || THEMES.moon;
    const bgStr = page.bgOverride || theme.bg;
    const grad = this._parseGradient(ctx, bgStr, W, H);
    ctx.fillStyle = grad || theme.textColor || '#12121A';
    ctx.fillRect(0, 0, W, H);

    // 装订线
    const bindingGrad = ctx.createLinearGradient(0, 0, 20, 0);
    bindingGrad.addColorStop(0, 'rgba(0,0,0,0.3)'); bindingGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bindingGrad; ctx.fillRect(0, 0, 20, H);

    // 加载字体
    await document.fonts.ready;

    // 绘制元素
    for (const el of page.elements) {
      const x = el.x / 100 * W, y = el.y / 100 * H;
      ctx.save();
      if (el.rotation) { ctx.translate(x, y); ctx.rotate(el.rotation * Math.PI / 180); ctx.translate(-x, -y); }

      if (el.type === 'text') {
        const fs = el.fontSize * (W / 440);
        ctx.font = `${fs}px ${el.fontFamily || 'serif'}`;
        ctx.fillStyle = el.color;
        ctx.textAlign = 'center';
        const lines = String(el.content).split('\n');
        lines.forEach((line, i) => ctx.fillText(line, x, y + i * fs * 1.5));
      } else if (el.type === 'sticker') {
        const fs = (el.fontSize || 40) * (W / 440);
        if (el.content?.startsWith('data:')) {
          await new Promise(resolve => {
            const img = new Image(); img.onload = () => { ctx.drawImage(img, x - fs/2, y - fs/2, fs, fs); resolve(); };
            img.onerror = resolve; img.src = el.content;
          });
        } else {
          ctx.font = `${fs}px serif`; ctx.textAlign = 'center'; ctx.fillText(el.content, x, y + fs*0.3);
        }
      } else if (el.type === 'image') {
        await new Promise(resolve => {
          const img = new Image(); img.onload = () => { ctx.drawImage(img, x, y, el.width * W/440, el.height * H/580); resolve(); };
          img.onerror = resolve; img.src = el.src;
        });
      }
      ctx.restore();
    }

    // 纸张纹理
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let py = 0; py < H; py += 8) ctx.fillRect(0, py, W, 1);
    for (let px = 0; px < W; px += 8) ctx.fillRect(px, 0, 1, H);

    // 下载
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (this.book.title || 'page') + `.png`;
      a.click(); URL.revokeObjectURL(a.href);
      App.toast('图片已下载 (1080×1440)');
    }, 'image/png');
  },

  _parseGradient(ctx, str, w, h) {
    if (!str) return null;
    if (!str.includes('gradient')) { ctx.fillStyle = str; return str; }
    try {
      const match = str.match(/linear-gradient\((\d+)deg,\s*(.+?),\s*(.+?)\)/);
      if (!match) return null;
      const angle = +match[1], c1 = match[2].trim(), c2 = match[3].trim();
      const rad = angle * Math.PI / 180;
      const x1 = w/2 - Math.cos(rad) * w, y1 = h/2 - Math.sin(rad) * h;
      const x2 = w/2 + Math.cos(rad) * w, y2 = h/2 + Math.sin(rad) * h;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, c1); grad.addColorStop(1, c2);
      return grad;
    } catch(e) { return null; }
  },

  pageBG(page) {
    if (!page) return '';
    const theme = THEMES[page.theme] || THEMES.moon;
    return `background:${page.bgOverride || theme.bg};color:${page.textColorOverride || theme.textColor};`;
  },

  pageContent(page) {
    if (!page) return '';
    const theme = THEMES[page.theme] || THEMES.moon;
    let html = '<div class="texture-overlay"></div><div class="binding-line"></div>';
    if (theme.decoHtml) html += theme.decoHtml;

    page.elements.forEach(el => {
      const animClass = el.anim ? `anim-trigger el-${el.anim}` : '';
      if (el.type === 'text') {
        html += `<div class="viewer-element text-el ${animClass}" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize}px;color:${el.color};font-family:${el.fontFamily};transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}" data-anim="${el.anim||''}">${this.escHtml(el.content)}</div>`;
      } else if (el.type === 'sticker') {
        const isDataUrl = el.content?.startsWith('data:');
        html += `<div class="viewer-element sticker-el ${animClass}" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize||40}px;transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}" data-anim="${el.anim||''}">${isDataUrl ? `<img src="${el.content}" style="max-width:120px;max-height:120px;object-fit:contain" />` : el.content}</div>`;
      } else if (el.type === 'image') {
        html += `<div class="viewer-element ${animClass}" style="left:${el.x}%;top:${el.y}%;width:${el.width}px;height:${el.height}px;transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}" data-anim="${el.anim||''}"><img src="${el.src}" style="width:100%;height:100%;object-fit:contain" /></div>`;
      }
    });
    return html;
  },

  renderProgress() {
    const el = document.getElementById('viewer-progress');
    let html = '';
    for (let i = 0; i <= this.totalPages; i++) {
      html += `<div class="v-dot ${i === this.currentPage ? 'active' : ''}"></div>`;
    }
    el.innerHTML = html;
  },

  nextPage() {
    if (this.currentPage < this.totalPages) {
      const page = document.querySelector(`.viewer-page[data-vp="${this.currentPage}"]`);
      if (page) page.classList.add('flipped');
      this.currentPage++;
      this.renderProgress();
      this.triggerPageAnims();
    }
  },

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      const page = document.querySelector(`.viewer-page[data-vp="${this.currentPage}"]`);
      if (page) page.classList.remove('flipped');
      this.renderProgress();
      this.triggerPageAnims();
    }
  },

  triggerPageAnims() {
    setTimeout(() => {
      const bp = this.book.pages;
      // 当前可见的左页
      const leftIdx = this.currentPage * 2;
      const rightIdx = leftIdx + 1;
      [leftIdx, rightIdx].forEach(idx => {
        if (idx >= bp.length) return;
        const page = bp[idx];
        if (!page) return;
        const allEls = document.querySelectorAll(`.viewer-page-front[style*="${page.theme}"] .anim-trigger, .viewer-page-back[style*="${page.theme}"] .anim-trigger`);
        // fallback: find any anim-trigger that wasn't run yet
        const untriggered = document.querySelectorAll('.anim-trigger:not(.anim-run)');
        untriggered.forEach((el, i) => {
          setTimeout(() => {
            el.classList.add('anim-run');
            el.style.animationName = el.dataset.anim ? `el-${el.dataset.anim}` : '';
          }, i * 120);
        });
      });
    }, 400); // 等翻页动画到一半时触发
  },

  reset() {
    document.querySelectorAll('.viewer-page').forEach(p => p.classList.remove('flipped'));
    this.currentPage = 0;
    this.renderProgress();
  },

  /** 分享 */
  share() {
    const url = Storage.getShareURL(this.book.id);
    const json = Storage.exportJSON(this.book.id);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal">
      <h2>📤 分享手工本</h2>
      <p>方式一：复制分享链接（无需服务器，数据编码在URL中）</p>
      <div class="share-url-box" id="share-url">${url || '链接过长，请使用方式二'}</div>
      <button class="btn btn-sm" onclick="Viewer.copyShareURL()">📋 复制链接</button>
      <p style="margin-top:16px">方式二：导出JSON数据，对方可导入还原</p>
      <button class="btn btn-sm" onclick="Viewer.downloadJSON()">⬇️ 下载JSON文件</button>
      <div class="modal-actions">
        <button class="btn" onclick="this.closest('.modal-overlay').remove()">关闭</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  },

  copyShareURL() {
    const url = Storage.getShareURL(this.book.id);
    navigator.clipboard.writeText(url).then(() => App.toast('链接已复制到剪贴板'));
  },

  downloadJSON() {
    const json = Storage.exportJSON(this.book.id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (this.book.title || 'nepal-book') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast('JSON文件已下载');
  },

  /** 全屏预览 */
  fullscreen() {
    const el = document.getElementById('view-viewer');
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  },

  escHtml(s) { return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
};

window.Viewer = Viewer;
