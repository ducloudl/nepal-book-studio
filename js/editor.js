/**
 * 尼泊尔手工本工作室 - 编辑器模块
 * 支持拖拽、缩放、编辑文本、添加贴纸、切换主题、增删页面
 */
const Editor = {
  book: null,
  currentPageIdx: 0,
  selectedElId: null,
  dragState: null,

  /** 初始化 */
  init(bookId) {
    this.book = Storage.get(bookId);
    if (!this.book) { App.go('library'); return; }
    this.currentPageIdx = 0;
    this.selectedElId = null;
    this.render();
  },

  /** 渲染整个编辑器 */
  render() {
    const page = this.book.pages[this.currentPageIdx];
    // 侧栏
    this.renderSidebar();
    // 工具栏
    this.renderToolbar();
    // 画布
    this.renderCanvas(page);
    // 属性面板
    this.renderProps(page);
    // 注入主题动态CSS
    this.injectThemeCSS();
  },

  renderSidebar() {
    const el = document.getElementById('sidebar-pages');
    el.innerHTML = this.book.pages.map((p, i) => `
      <div class="sidebar-page ${i === this.currentPageIdx ? 'active' : ''}" data-idx="${i}">
        <span class="page-num">${i + 1}</span>
        <span class="page-theme">${THEMES[p.theme]?.name || p.theme}</span>
        <span class="page-del" data-del="${i}">×</span>
      </div>
    `).join('');
    // 事件委托
    el.onclick = (e) => {
      const del = e.target.closest('[data-del]');
      if (del) { this.deletePage(+del.dataset.del); return; }
      const item = e.target.closest('.sidebar-page');
      if (item) { this.currentPageIdx = +item.dataset.idx; this.selectedElId = null; this.render(); }
    };
  },

  renderToolbar() {
    const tb = document.getElementById('editor-toolbar');
    tb.innerHTML = `
      <button class="btn btn-sm" onclick="App.go('library')">← 书架</button>
      <input class="book-title-input" value="${this.escHtml(this.book.title)}" id="tb-title" placeholder="手工本标题" />
      <span style="flex:1"></span>
      <button class="btn btn-sm" onclick="Editor.addPage()">+ 添加页面</button>
      <button class="btn btn-sm" onclick="Editor.addElement('text')">文字</button>
      <button class="btn btn-sm btn-primary" onclick="Editor.preview()">预览 →</button>
    `;
    document.getElementById('tb-title').onchange = (e) => {
      this.book.title = e.target.value;
      this.save();
    };
  },

  renderCanvas(page) {
    const canvas = document.getElementById('editor-canvas');
    const theme = THEMES[page.theme] || THEMES.moon;
    canvas.style.background = theme.bg;
    canvas.style.color = theme.textColor;

    // 元素
    let html = '<div class="texture-overlay"></div><div class="binding-line"></div>';
    html += theme.decoHtml || '';
    page.elements.forEach(el => {
      if (el.type === 'text') {
        html += `<div class="canvas-element text-element ${el.id === this.selectedElId ? 'selected' : ''}"
          data-id="${el.id}" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize}px;color:${el.color};font-family:${el.fontFamily};transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}"
          ><span class="el-content">${this.escHtml(el.content)}</span><div class="resize-handle"></div></div>`;
      } else if (el.type === 'sticker') {
        html += `<div class="canvas-element sticker-element ${el.id === this.selectedElId ? 'selected' : ''}"
          data-id="${el.id}" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize||40}px;transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}"
          ><span class="el-content">${el.content}</span><div class="resize-handle"></div></div>`;
      }
    });
    canvas.innerHTML = html;

    // 绑定拖拽
    this.bindDrag(canvas);
    // 绑定选中 & 双击编辑
    canvas.onclick = (e) => {
      const cel = e.target.closest('.canvas-element');
      if (cel) {
        this.selectedElId = cel.dataset.id;
        this.render();
      }
    };
    canvas.ondblclick = (e) => {
      const cel = e.target.closest('.canvas-element.text-element');
      if (cel) this.startTextEdit(cel.dataset.id);
    };
  },

  renderProps(page) {
    const panel = document.getElementById('editor-props');
    const theme = THEMES[page.theme] || THEMES.moon;
    const el = page.elements.find(e => e.id === this.selectedElId);

    let html = '';

    // 页面主题
    html += `<div class="props-section"><h4>页面主题</h4><div class="theme-picker">`;
    Object.entries(THEMES).forEach(([key, t]) => {
      html += `<div class="theme-btn ${page.theme === key ? 'active' : ''}" data-theme="${key}">${t.name}</div>`;
    });
    html += `</div></div>`;

    // 贴纸库
    html += `<div class="props-section"><h4>添加贴纸</h4><div class="sticker-picker">`;
    STICKERS.forEach(s => {
      html += `<div class="sticker-btn" data-sticker="${s}">${s}</div>`;
    });
    html += `</div></div>`;

    // 选中元素属性
    if (el) {
      html += `<div class="props-section"><h4>元素属性</h4>`;
      if (el.type === 'text') {
        html += `
          <div class="prop-row"><span class="prop-label">文字</span></div>
          <textarea class="prop-textarea" id="prop-content">${this.escHtml(el.content)}</textarea>
          <div class="prop-row"><span class="prop-label">大小</span><input class="prop-input" type="number" id="prop-fontSize" value="${el.fontSize}" min="12" max="72" /></div>
          <div class="prop-row"><span class="prop-label">颜色</span><input class="prop-color" type="color" id="prop-color" value="${el.color}" /></div>
          <div class="prop-row"><span class="prop-label">字体</span><select class="prop-input" id="prop-font">
            ${FONTS.map(f => `<option value="${f.value}" style="font-family:${f.value}">${f.name}</option>`).join('')}
          </select></div>
          <div class="prop-row"><span class="prop-label">旋转</span><input class="prop-input" type="number" id="prop-rotation" value="${el.rotation||0}" min="-180" max="180" /></div>
        `;
      } else if (el.type === 'sticker') {
        html += `
          <div class="prop-row"><span class="prop-label">大小</span><input class="prop-input" type="number" id="prop-fontSize" value="${el.fontSize||40}" min="16" max="120" /></div>
          <div class="prop-row"><span class="prop-label">旋转</span><input class="prop-input" type="number" id="prop-rotation" value="${el.rotation||0}" min="-180" max="180" /></div>
        `;
      }
      html += `<div style="margin-top:10px"><button class="btn btn-sm btn-danger" id="prop-delete">🗑 删除元素</button></div>`;
      html += `</div>`;
    }

    panel.innerHTML = html;

    // 事件绑定
    panel.querySelectorAll('[data-theme]').forEach(btn => {
      btn.onclick = () => {
        page.theme = btn.dataset.theme;
        this.save(); this.render();
      };
    });
    panel.querySelectorAll('[data-sticker]').forEach(btn => {
      btn.onclick = () => {
        this.addElement('sticker', btn.dataset.sticker);
      };
    });

    if (el) {
      const $c = document.getElementById('prop-content');
      const $fs = document.getElementById('prop-fontSize');
      const $col = document.getElementById('prop-color');
      const $font = document.getElementById('prop-font');
      const $rot = document.getElementById('prop-rotation');
      const $del = document.getElementById('prop-delete');

      if ($c) $c.oninput = () => { el.content = $c.value; this.renderCanvas(page); };
      if ($fs) $fs.onchange = () => { el.fontSize = +$fs.value; this.save(); this.renderCanvas(page); };
      if ($col) $col.onchange = () => { el.color = $col.value; this.save(); this.renderCanvas(page); };
      if ($font) { $font.value = el.fontFamily; $font.onchange = () => { el.fontFamily = $font.value; this.save(); this.renderCanvas(page); }; }
      if ($rot) $rot.onchange = () => { el.rotation = +$rot.value; this.save(); this.renderCanvas(page); };
      if ($del) $del.onclick = () => { this.deleteElement(el.id); };
    }
  },

  /** 添加元素 */
  addElement(type, content) {
    const page = this.book.pages[this.currentPageIdx];
    const theme = THEMES[page.theme] || THEMES.moon;
    const newEl = {
      id: 'e' + Date.now() + Math.random().toString(36).slice(2,5),
      type, x: 25, y: 35, rotation: 0, zIndex: page.elements.length + 1
    };
    if (type === 'text') {
      newEl.content = '输入文字';
      newEl.fontSize = 22;
      newEl.color = theme.textColor;
      newEl.fontFamily = "'Ma Shan Zheng', serif";
    } else if (type === 'sticker') {
      newEl.content = content || '❤️';
      newEl.fontSize = 40;
    }
    page.elements.push(newEl);
    this.selectedElId = newEl.id;
    this.save(); this.render();
    App.toast('已添加' + (type === 'text' ? '文字' : '贴纸'));
  },

  /** 删除元素 */
  deleteElement(elId) {
    const page = this.book.pages[this.currentPageIdx];
    page.elements = page.elements.filter(e => e.id !== elId);
    this.selectedElId = null;
    this.save(); this.render();
  },

  /** 添加页面 */
  addPage() {
    const newPage = {
      id: 'p' + Date.now(),
      theme: 'moon',
      elements: [{ id:'e'+Date.now(), type:'text', content:'新页面', x:30, y:40, fontSize:24, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif", rotation:0, zIndex:1 }]
    };
    this.book.pages.push(newPage);
    this.currentPageIdx = this.book.pages.length - 1;
    this.save(); this.render();
    App.toast('已添加新页面');
  },

  /** 删除页面 */
  deletePage(idx) {
    if (this.book.pages.length <= 1) { App.toast('至少保留一页', true); return; }
    this.book.pages.splice(idx, 1);
    if (this.currentPageIdx >= this.book.pages.length) this.currentPageIdx = this.book.pages.length - 1;
    this.save(); this.render();
  },

  /** 双击文字编辑 */
  startTextEdit(elId) {
    const el = document.querySelector(`.canvas-element[data-id="${elId}"] .el-content`);
    if (!el) return;
    el.contentEditable = true;
    el.focus();
    el.parentElement.dataset.editing = 'true';
    // 选中全部
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);

    const finish = () => {
      el.contentEditable = false;
      delete el.parentElement.dataset.editing;
      const data = this.book.pages[this.currentPageIdx].elements.find(e => e.id === elId);
      if (data) { data.content = el.textContent; this.save(); }
    };
    el.onblur = finish;
    el.onkeydown = (e) => { if (e.key === 'Escape') { el.blur(); } };
  },

  /** 拖拽绑定 */
  bindDrag(canvas) {
    const self = this;
    canvas.onmousedown = function(e) {
      const cel = e.target.closest('.canvas-element');
      if (!cel || e.target.classList.contains('resize-handle')) return;
      const elId = cel.dataset.id;
      self.selectedElId = elId;
      self.dragState = {
        elId, startX: e.clientX, startY: e.clientY,
        origLeft: parseFloat(cel.style.left), origTop: parseFloat(cel.style.top)
      };
      e.preventDefault();
    };
    document.onmousemove = (e) => {
      if (!this.dragState) return;
      const canvasRect = canvas.getBoundingClientRect();
      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;
      const newLeft = Math.max(0, Math.min(90, this.dragState.origLeft + (dx / canvasRect.width) * 100));
      const newTop = Math.max(0, Math.min(90, this.dragState.origTop + (dy / canvasRect.height) * 100));
      const domEl = canvas.querySelector(`.canvas-element[data-id="${this.dragState.elId}"]`);
      if (domEl) { domEl.style.left = newLeft + '%'; domEl.style.top = newTop + '%'; }
      // 更新数据
      const dataEl = this.book.pages[this.currentPageIdx].elements.find(el => el.id === this.dragState.elId);
      if (dataEl) { dataEl.x = newLeft; dataEl.y = newTop; }
    };
    document.onmouseup = () => {
      if (this.dragState) { this.save(); this.dragState = null; }
    };
  },

  /** 注入主题动态CSS */
  injectThemeCSS() {
    let id = 'theme-dynamic-css';
    let style = document.getElementById(id);
    if (!style) { style = document.createElement('style'); style.id = id; document.head.appendChild(style); }
    let css = THEME_GLOBAL_CSS;
    Object.values(THEMES).forEach(t => { if (t.css) css += t.css; });
    style.textContent = css;
  },

  /** 预览 */
  preview() {
    this.save();
    Viewer.init(this.book);
  },

  /** 保存 */
  save() {
    Storage.update(this.book.id, { ...this.book });
  },

  escHtml(s) { return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
};

window.Editor = Editor;
