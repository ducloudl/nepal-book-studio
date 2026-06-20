/**
 * 尼泊尔手工本工作室 - 编辑器模块
 * 支持拖拽、缩放、编辑文本、添加贴纸、切换主题、增删页面
 */
const Editor = {
  book: null,
  currentPageIdx: 0,
  selectedElId: null,
  dragState: null,
  undoStack: [],
  redoStack: [],
  maxUndo: 50,

  /** 初始化 */
  init(bookId) {
    this.book = Storage.get(bookId);
    if (!this.book) { App.go('library'); return; }
    this.currentPageIdx = 0;
    this.selectedElId = null;
    this.undoStack = [];
    this.redoStack = [];
    this.bindGlobalKeyboard();
    this.render();
  },

  bindGlobalKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (window.location.hash.startsWith('#editor')) this.handleKeyDown(e);
    });
    const canvas = document.getElementById('editor-canvas');
    if (canvas) {
      canvas.addEventListener('dragover', e => e.preventDefault());
      canvas.addEventListener('drop', e => this.handleImageDrop(e));
      document.addEventListener('paste', e => {
        if (window.location.hash.startsWith('#editor')) this.handleImagePaste(e);
      });
    }
  },

  handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); this.undo(); return; }
      if (e.key === 'y') { e.preventDefault(); this.redo(); return; }
      if (e.key === 's') { e.preventDefault(); this.preview(); return; }
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !document.activeElement?.contentEditable) {
      if (this.selectedElId) { e.preventDefault(); this.deleteElement(this.selectedElId); }
    }
    if (e.key === 'Escape') { this.selectedElId = null; this.render(); }
    if (e.key === '?' && !e.ctrlKey) { this.showShortcuts(); }
  },

  showShortcuts() {
    document.body.insertAdjacentHTML('beforeend',
      `<div class="modal-overlay" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()" style="font-size:13px;line-height:2.4;max-width:340px;">
      <h2>⌨️ 快捷键</h2>
      <div><kbd>Ctrl+Z</kbd> 撤销　<kbd>Ctrl+Y</kbd> 重做</div>
      <div><kbd>Ctrl+S</kbd> 预览　<kbd>Delete</kbd> 删除元素</div>
      <div><kbd>Esc</kbd> 取消选中　<kbd>?</kbd> 显示此面板</div>
      <div><kbd>Ctrl+V</kbd> 粘贴图片　拖放图片到画布</div>
      <div class="modal-actions"><button class="btn" onclick="this.closest('.modal-overlay').remove()">关闭</button></div>
    </div></div>`);
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
      <button class="btn btn-sm" onclick="Editor.triggerImageUpload()">🖼 图片</button>
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
        html += `<div class="canvas-element sticker-element ${el.id === this.selectedElId ? 'selected' : ''}${el.locked ? ' locked' : ''}"
          data-id="${el.id}" style="left:${el.x}%;top:${el.y}%;font-size:${el.fontSize||40}px;transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}${el.locked ? ';pointer-events:none' : ''}"
          ><span class="el-content">${el.content}</span><div class="resize-handle"></div></div>`;
      } else if (el.type === 'image') {
        html += `<div class="canvas-element image-element ${el.id === this.selectedElId ? 'selected' : ''}${el.locked ? ' locked' : ''}"
          data-id="${el.id}" style="left:${el.x}%;top:${el.y}%;width:${el.width}px;height:${el.height}px;transform:rotate(${el.rotation||0}deg);z-index:${el.zIndex||1}${el.locked ? ';pointer-events:none' : ''}"
          ><img src="${el.src}" style="width:100%;height:100%;object-fit:contain" draggable="false" /><div class="resize-handle"></div></div>`;
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
      html += `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px">
        <button class="btn btn-sm" id="prop-forward">⬆</button>
        <button class="btn btn-sm" id="prop-backward">⬇</button>
        <button class="btn btn-sm" id="prop-front">⏫</button>
        <button class="btn btn-sm" id="prop-back">⏬</button>
        <button class="btn btn-sm" id="prop-lock">${el.locked ? '🔒' : '🔓'}</button>
        <button class="btn btn-sm btn-danger" id="prop-delete">🗑 删除</button>
      </div>`;
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
      const $fw=document.getElementById('prop-forward'),
            $bw=document.getElementById('prop-backward'),
            $ff=document.getElementById('prop-front'),
            $bb=document.getElementById('prop-back'),
            $lk=document.getElementById('prop-lock');
      if($fw)$fw.onclick=()=>this.bringForward(el.id);
      if($bw)$bw.onclick=()=>this.sendBackward(el.id);
      if($ff)$ff.onclick=()=>this.bringToFront(el.id);
      if($bb)$bb.onclick=()=>this.sendToBack(el.id);
      if($lk)$lk.onclick=()=>this.toggleLock(el.id);
    }
  },

  /** 添加元素 */
  addElement(type, content) {
    this.snapshotBeforeChange();
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

  /** 图片上传/拖放/粘贴 */
  addImageElement(dataUrl) {
    const page = this.book.pages[this.currentPageIdx];
    this.snapshotBeforeChange();
    const el = { id:'e'+Date.now()+Math.random().toString(36).slice(2,5), type:'image', src:dataUrl, x:15, y:15, width:200, height:200, rotation:0, zIndex:page.elements.length+1 };
    page.elements.push(el);
    this.selectedElId = el.id;
    this.save(); this.render();
    App.toast('已添加图片');
  },
  triggerImageUpload() {
    const input = document.createElement('input'); input.type='file'; input.accept='image/*';
    input.onchange = e => { const f = e.target.files[0]; if(f) { const r=new FileReader(); r.onload=ev=>this.addImageElement(ev.target.result); r.readAsDataURL(f); } };
    input.click();
  },
  handleImageDrop(e) {
    e.preventDefault(); const f = e.dataTransfer.files[0];
    if(!f||!f.type.startsWith('image/')) return;
    const r=new FileReader(); r.onload=ev=>this.addImageElement(ev.target.result); r.readAsDataURL(f);
  },
  handleImagePaste(e) {
    const items = e.clipboardData?.items; if(!items) return;
    for(const item of items) { if(item.type.startsWith('image/')) { const r=new FileReader(); r.onload=ev=>this.addImageElement(ev.target.result); r.readAsDataURL(item.getAsFile()); break; } }
  },

  /** 图层控制 */
  bringForward(elId) { const el=this.getEl(elId); if(el) { el.zIndex=Math.min(el.zIndex+1,10); this.save(); this.renderCanvas(this.book.pages[this.currentPageIdx]); } },
  sendBackward(elId) { const el=this.getEl(elId); if(el) { el.zIndex=Math.max(el.zIndex-1,1); this.save(); this.renderCanvas(this.book.pages[this.currentPageIdx]); } },
  bringToFront(elId) { const el=this.getEl(elId); if(el) { el.zIndex=20; this.save(); this.renderCanvas(this.book.pages[this.currentPageIdx]); } },
  sendToBack(elId) { const el=this.getEl(elId); if(el) { el.zIndex=0; this.save(); this.renderCanvas(this.book.pages[this.currentPageIdx]); } },
  toggleLock(elId) { const el=this.getEl(elId); if(el) { el.locked=!el.locked; this.save(); this.render(); App.toast(el.locked?'已锁定':'已解锁'); } },
  getEl(elId) { return this.book.pages[this.currentPageIdx].elements.find(e=>e.id===elId); },

  /** 删除元素 */
  deleteElement(elId) {
    this.snapshotBeforeChange();
    const page = this.book.pages[this.currentPageIdx];
    page.elements = page.elements.filter(e => e.id !== elId);
    this.selectedElId = null;
    this.save(); this.render();
  },

  /** 添加页面 */
  addPage() {
    this.snapshotBeforeChange();
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
    this.snapshotBeforeChange();
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
    let css = THEME_GLOBAL_CSS + `
      .canvas-element.image-element { overflow: hidden; border-radius: 4px; }
      .canvas-element.image-element img { border-radius: 4px; pointer-events: none; }
      .canvas-element.locked { outline: 2px solid rgba(255,80,80,0.4) !important; }
      .canvas-element { position:absolute; cursor:move; user-select:none; z-index:10; transition:outline .1s; outline:2px solid transparent; outline-offset:2px; }
      .canvas-element.selected { outline:2px dashed rgba(200,150,62,0.7); outline-offset:3px; }
      .canvas-element .resize-handle { position:absolute; bottom:-6px; right:-6px; width:12px; height:12px; background:var(--color-accent); border-radius:2px; cursor:se-resize; display:none; }
      .canvas-element.selected .resize-handle { display:block; }
      .canvas-element.text-element { min-width:40px; min-height:20px; white-space:pre-wrap; text-align:center; line-height:1.6; }
      .canvas-element.text-element[data-editing="true"] { cursor:text; outline-color:var(--color-accent); }
      .canvas-element.sticker-element { line-height:1; }
      kbd { display:inline-block; padding:2px 6px; font-size:11px; background:var(--color-surface3); border:1px solid var(--glass-border); border-radius:4px; color:var(--color-accent-glow); font-family:var(--font-ui); margin:0 2px; }
    `;
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

  /** 撤销/重做 */
  pushUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.book)));
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    this.redoStack = [];
  },
  undo() {
    if (this.undoStack.length === 0) { App.toast('没有可撤销的操作'); return; }
    this.redoStack.push(JSON.parse(JSON.stringify(this.book)));
    this.book = this.undoStack.pop();
    Storage.update(this.book.id, { ...this.book });
    this.selectedElId = null; this.render();
    App.toast('已撤销');
  },
  redo() {
    if (this.redoStack.length === 0) { App.toast('没有可重做的操作'); return; }
    this.undoStack.push(JSON.parse(JSON.stringify(this.book)));
    this.book = this.redoStack.pop();
    Storage.update(this.book.id, { ...this.book });
    this.selectedElId = null; this.render();
    App.toast('已重做');
  },
  snapshotBeforeChange() {
    this.pushUndo();
  },

  escHtml(s) { return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
};

window.Editor = Editor;
