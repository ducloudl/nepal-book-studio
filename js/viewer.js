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

    // 音频播放器
    this.renderAudio();
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

  pageBG(page) {
    if (!page) return '';
    const theme = THEMES[page.theme] || THEMES.moon;
    return `background:${theme.bg};color:${theme.textColor};`;
  },

  pageContent(page) {
    if (!page) return '';
    const theme = THEMES[page.theme] || THEMES.moon;
    let html = '<div class="texture-overlay"></div><div class="binding-line"></div>';
    if (theme.decoHtml) html += theme.decoHtml;

    page.elements.forEach(el => {
      if (el.type === 'text') {
        html += `<div class="viewer-element text-el" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize}px;color:${el.color};font-family:${el.fontFamily};transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}">${this.escHtml(el.content)}</div>`;
      } else if (el.type === 'sticker') {
        html += `<div class="viewer-element sticker-el" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize||40}px;transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}">${el.content}</div>`;
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
    }
  },

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      const page = document.querySelector(`.viewer-page[data-vp="${this.currentPage}"]`);
      if (page) page.classList.remove('flipped');
      this.renderProgress();
    }
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
