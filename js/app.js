/**
 * 尼泊尔手工本工作室 - 主程序
 * 路由 / 书架 / Toast / 全局初始化
 */
const App = {
  currentView: 'library',

  init() {
    // 检查是否有分享数据
    const sharedData = Storage.parseShareURL();
    if (sharedData) {
      // 保存分享的数据到本地
      const existing = Storage.get(sharedData.id);
      if (!existing) {
        sharedData.createdAt = Date.now();
        sharedData.updatedAt = Date.now();
        const books = Storage.getAll();
        books.unshift(sharedData);
        localStorage.setItem(Storage.KEY, JSON.stringify(books));
        App.toast('已导入分享的手工本！');
      }
      // 清除URL参数
      window.location.hash = '#library';
    }

    this.go('library');
    window.onhashchange = () => this.route();
  },

  route() {
    const hash = window.location.hash.slice(1) || 'library';
    const parts = hash.split('/');
    const view = parts[0];

    if (view === 'editor' && parts[1]) {
      this.show('editor');
      Editor.init(parts[1]);
    } else if (view === 'viewer' && parts[1]) {
      const book = Storage.get(parts[1]);
      if (book) Viewer.init(book);
      else App.go('library');
    } else {
      this.renderLibrary();
    }
  },

  go(view, param) {
    if (view === 'editor' && param) {
      window.location.hash = `#editor/${param}`;
    } else if (view === 'viewer' && param) {
      window.location.hash = `#viewer/${param}`;
    } else {
      window.location.hash = `#library`;
    }
    this.route();
  },

  show(viewId) {
    ['view-library', 'view-editor', 'view-viewer'].forEach(id => {
      document.getElementById(id).classList.toggle('hide', id !== 'view-' + viewId);
    });
    this.currentView = viewId;
  },

  /** ======== 书架 ======== */
  renderLibrary() {
    this.show('library');
    const books = Storage.getAll();
    const grid = document.getElementById('books-grid');

    if (books.length === 0) {
      grid.innerHTML = `<div class="empty-state">
        <span class="empty-icon">📔</span>
        <p>还没有手工本，开始创作吧</p>
        <button class="btn btn-primary" onclick="App.createBook()">✨ 创建第一本</button>
      </div>`;
      return;
    }

    grid.innerHTML = books.map(b => {
      const preview = Storage.getCoverPreview(b);
      const theme = preview.theme || THEMES.cover;
      return `<div class="book-card" data-id="${b.id}">
        <div class="book-card-actions">
          <button class="btn-icon" data-action="duplicate" title="复制">📋</button>
          <button class="btn-icon" data-action="delete" title="删除">🗑</button>
        </div>
        <div class="book-card-cover" style="background:${theme.bg};color:${theme.textColor}">
          <div class="texture-overlay"></div>
          <div class="card-title">${this.escHtml(b.title)}</div>
          ${b.subtitle ? `<div class="card-sub">${this.escHtml(b.subtitle)}</div>` : ''}
        </div>
        <div class="book-card-info">
          <span class="book-title">${this.escHtml(b.title)}</span>
          <span class="book-pages">${b.pages.length}页</span>
        </div>
      </div>`;
    }).join('');

    // 事件委托
    grid.onclick = (e) => {
      const actionBtn = e.target.closest('[data-action]');
      const card = e.target.closest('.book-card');
      if (!card) return;
      const id = card.dataset.id;

      if (actionBtn) {
        e.stopPropagation();
        if (actionBtn.dataset.action === 'delete') {
          if (confirm('确定删除这本手工本吗？')) {
            Storage.remove(id);
            this.renderLibrary();
            App.toast('已删除');
          }
        } else if (actionBtn.dataset.action === 'duplicate') {
          Storage.duplicate(id);
          this.renderLibrary();
          App.toast('已复制');
        }
        return;
      }
      // 点击卡片 → 编辑
      this.go('editor', id);
    };

    // 顶栏按钮
    const actions = document.getElementById('library-actions');
    actions.innerHTML = `
      <button class="btn btn-primary" onclick="App.createBook()">✨ 空白创作</button>
      <button class="btn" onclick="App.createBookFromTemplate('love')">💕 情侣</button>
      <button class="btn" onclick="App.createBookFromTemplate('friendship')">👯 闺蜜</button>
      <button class="btn" onclick="App.createBookFromTemplate('gratitude')">🙏 感恩</button>
      <button class="btn" onclick="App.createBookFromTemplate('travel')">✈️ 旅行</button>
      <button class="btn" onclick="App.createBookFromTemplate('birthday')">🎂 生日</button>
      <button class="btn" onclick="App.createBookFromTemplate('wedding')">💒 婚礼</button>
      <button class="btn" onclick="App.createBookFromTemplate('baby')">👶 宝宝</button>
      <button class="btn" onclick="App.importBook()">📥 导入</button>
    `;
  },

  createBook() {
    const book = Storage.create();
    this.go('editor', book.id);
    App.toast('新手工本已创建');
  },

  createBookFromTemplate(name) {
    const tpl = TEMPLATES[name];
    if (!tpl) { this.createBook(); return; }
    const book = Storage.create(tpl);
    this.go('editor', book.id);
    App.toast('模板手工本已创建');
  },

  importBook() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const book = Storage.importJSON(ev.target.result);
        if (book) { this.renderLibrary(); App.toast('导入成功'); }
        else App.toast('导入失败，文件格式错误', true);
      };
      reader.readAsText(file);
    };
    input.click();
  },

  /** ======== Toast ======== */
  toast(msg, isError) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = 'toast' + (isError ? ' error' : '');
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2500);
  },

  escHtml(s) { return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
};

window.App = App;
