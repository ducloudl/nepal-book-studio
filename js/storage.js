/**
 * 尼泊尔手工本工作室 - 存储与分享模块
 */

const Storage = {
  KEY: 'nepal_books',
  
  /** 获取所有书 */
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch { return []; }
  },

  /** 保存所有书 */
  _saveAll(books) {
    localStorage.setItem(this.KEY, JSON.stringify(books));
  },

  /** 获取单本书 */
  get(id) {
    return this.getAll().find(b => b.id === id);
  },

  /** 创建新书 */
  create(template) {
    const books = this.getAll();
    const book = {
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      title: template?.title || '未命名手工本',
      subtitle: template?.subtitle || '',
      author: '',
      coverTheme: template?.coverTheme || 'cover',
      pages: template?.pages || [
        { id: 'p1', theme: 'cover', elements: [
          { id:'e1', type:'text', content:'点击编辑文字', x:30, y:40, fontSize:22, color:'#FFE4B5', fontFamily:"'Ma Shan Zheng', serif", rotation:0, zIndex:1 }
        ]},
        { id: 'p2', theme: 'moon', elements: [
          { id:'e2', type:'text', content:'第一页', x:35, y:40, fontSize:24, color:'#FFF8E1', fontFamily:"'Ma Shan Zheng', serif", rotation:0, zIndex:1 }
        ]}
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    books.unshift(book);
    this._saveAll(books);
    return book;
  },

  /** 更新书 */
  update(id, data) {
    const books = this.getAll();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    books[idx] = { ...books[idx], ...data, updatedAt: Date.now() };
    this._saveAll(books);
    return books[idx];
  },

  /** 更新单页 */
  updatePage(bookId, pageId, pageData) {
    const book = this.get(bookId);
    if (!book) return;
    const idx = book.pages.findIndex(p => p.id === pageId);
    if (idx === -1) return;
    book.pages[idx] = { ...book.pages[idx], ...pageData };
    this.update(bookId, { pages: book.pages });
  },

  /** 删除书 */
  remove(id) {
    const books = this.getAll().filter(b => b.id !== id);
    this._saveAll(books);
  },

  /** 复制书 */
  duplicate(id) {
    const book = this.get(id);
    if (!book) return null;
    const copy = JSON.parse(JSON.stringify(book));
    copy.id = 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    copy.title = book.title + ' (副本)';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    const books = this.getAll();
    books.unshift(copy);
    this._saveAll(books);
    return copy;
  },

  /** 导出为JSON */
  exportJSON(id) {
    const book = this.get(id);
    if (!book) return null;
    return JSON.stringify(book, null, 2);
  },

  /** 导入JSON */
  importJSON(jsonStr) {
    try {
      const book = JSON.parse(jsonStr);
      book.id = 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      book.createdAt = Date.now();
      book.updatedAt = Date.now();
      const books = this.getAll();
      books.unshift(book);
      this._saveAll(books);
      return book;
    } catch(e) {
      console.error('导入失败:', e);
      return null;
    }
  },

  /** 生成分享链接（URL编码） */
  getShareURL(id) {
    const book = this.get(id);
    if (!book) return '';
    // 压缩JSON
    const minified = JSON.stringify(book);
    // Base64编码
    const encoded = btoa(unescape(encodeURIComponent(minified)));
    // 获取当前路径
    const base = window.location.href.split('#')[0].split('?')[0];
    return `${base}#viewer/${book.id}?d=${encoded}`;
  },

  /** 从URL解析分享数据 */
  parseShareURL() {
    const hash = window.location.hash;
    if (!hash.includes('?d=')) return null;
    const encoded = hash.split('?d=')[1];
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
    } catch(e) {
      console.error('解析分享链接失败:', e);
      return null;
    }
  },

  /**
   * 鸟瞰图：生成书籍封面缩略图数据
   */
  getCoverPreview(book) {
    const firstPage = book.pages?.[0];
    const theme = firstPage ? THEMES[firstPage.theme] : THEMES.cover;
    const titleEl = firstPage?.elements?.find(e => e.type === 'text');
    return {
      theme: theme,
      title: book.title,
      subtitle: book.subtitle,
      previewText: titleEl?.content?.split('\n')[0] || ''
    };
  }
};

window.Storage = Storage;
