/**
 * MijiNav Theme - 重构优化版
 * 技术栈: HTML5 + CSS3 + JavaScript (ES6+)
 */

(function() {
    'use strict';

    // =========================================
    // 1. 配置常量
    // =========================================
    const CONFIG = {
        MOBILE_BREAKPOINT: 768,
        SIDEBAR_WIDTH: 220,
        SCROLL_THRESHOLD: 300,
        ANIMATION_DELAY: 300,
        STORAGE_KEYS: {
            THEME: 'miji-nav-theme',
            SIDEBAR_VISIBLE: 'miji-nav-sidebar-visible',
            LAST_CATEGORY: 'lastActiveCategory',
            SCROLL_CATEGORY: 'scrollToCategory',
            SCROLL_SUBCATEGORY: 'scrollToSubcategory',
            LAST_CARD_ID: 'lastCardId',
            FROM_CARD_CLICK: 'fromCardClick'
        }
    };

    // =========================================
    // 2. DOM 元素缓存
    // =========================================
    const DOM = {
        get sidebar() { return document.querySelector('.miji-nav-sidebar'); },
        get mainContent() { return document.querySelector('.miji-nav-main'); },
        get overlay() { return document.getElementById('overlay'); },
        get mobileMenu() { return document.getElementById('mobileMenu'); },
        get mobilePagesMenu() { return document.getElementById('mobilePagesMenu'); },
        get mobilePagesSidebar() { return document.getElementById('mobilePagesSidebar'); },
        get desktopMenu() { return document.getElementById('desktopMenu'); },
        get backToTopBtn() { return document.getElementById('backToTop'); },
        get progressCircle() { return document.querySelector('.miji-nav-scroll-progress circle'); },
        get searchForm() { return document.getElementById('search'); },
        get searchInput() { return document.querySelector('.miji-nav-search-input'); }
    };

    // =========================================
    // 3. 工具函数
    // =========================================
    const Utils = {
        isMobile() {
            return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
        },

        getStorageItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage access failed:', e);
                return null;
            }
        },

        setStorageItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('localStorage access failed:', e);
            }
        },

        removeStorageItem(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('localStorage access failed:', e);
            }
        },

        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
    };

    // =========================================
    // 4. 主题管理模块
    // =========================================
    const ThemeManager = {
        init() {
            const savedTheme = Utils.getStorageItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
            this.applyTheme(savedTheme);
            this.bindEvents();
        },

        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.className = `theme-${theme}`;
            Utils.setStorageItem(CONFIG.STORAGE_KEYS.THEME, theme);
            this.updateIcons(theme);
        },

        updateIcons(theme) {
            const isDark = theme === 'dark';
            
            document.querySelectorAll('.theme-light').forEach(el => {
                el.style.display = isDark ? 'none' : 'inline-block';
            });
            document.querySelectorAll('.theme-dark').forEach(el => {
                el.style.display = isDark ? 'inline-block' : 'none';
            });
            document.querySelectorAll('.light-logo').forEach(el => {
                el.style.display = isDark ? 'none' : 'block';
            });
            document.querySelectorAll('.dark-logo').forEach(el => {
                el.style.display = isDark ? 'block' : 'none';
            });
        },

        toggle() {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            this.applyTheme(current === 'dark' ? 'light' : 'dark');
        },

        bindEvents() {
            const toggleButtons = document.querySelectorAll('#toggleTheme, .miji-nav-theme-toggle, .theme-toggle-btn');
            toggleButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggle();
                });
            });
        }
    };

    // =========================================
    // 5. 侧边栏管理模块
    // =========================================
    const SidebarManager = {
        init() {
            this.applySavedState();
            this.bindEvents();
        },

        applySavedState() {
            const sidebar = DOM.sidebar;
            const mainContent = DOM.mainContent;
            if (!sidebar || !mainContent) return;

            if (Utils.isMobile()) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-visible');
                return;
            }

            // 桌面端：默认显示侧边栏，除非明确设置为隐藏
            const isVisible = Utils.getStorageItem(CONFIG.STORAGE_KEYS.SIDEBAR_VISIBLE) !== 'false';
            
            if (isVisible) {
                sidebar.classList.add('active');
                document.body.classList.add('sidebar-visible');
                document.body.classList.remove('sidebar-hidden');
            } else {
                sidebar.classList.remove('active');
                document.body.classList.add('sidebar-hidden');
                document.body.classList.remove('sidebar-visible');
            }
        },

        toggle() {
            const sidebar = DOM.sidebar;
            const mainContent = DOM.mainContent;
            if (!sidebar || !mainContent) return;

            const isActive = sidebar.classList.contains('active');

            if (isActive) {
                sidebar.classList.remove('active');
                document.body.classList.add('sidebar-hidden');
                document.body.classList.remove('sidebar-visible');
                Utils.setStorageItem(CONFIG.STORAGE_KEYS.SIDEBAR_VISIBLE, 'false');
            } else {
                sidebar.classList.add('active');
                document.body.classList.add('sidebar-visible');
                document.body.classList.remove('sidebar-hidden');
                Utils.setStorageItem(CONFIG.STORAGE_KEYS.SIDEBAR_VISIBLE, 'true');
            }
        },

        closeMobile() {
            const overlay = DOM.overlay;
            const sidebar = DOM.sidebar;
            const mobilePagesSidebar = DOM.mobilePagesSidebar;

            if (Utils.isMobile() && sidebar) {
                sidebar.classList.remove('active');
            }
            if (mobilePagesSidebar) {
                mobilePagesSidebar.classList.remove('active');
            }
            if (overlay) {
                overlay.classList.remove('active');
            }
        },

        bindEvents() {
            // 桌面端菜单切换
            const desktopMenu = DOM.desktopMenu;
            if (desktopMenu) {
                desktopMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!Utils.isMobile()) {
                        this.toggle();
                    }
                });
            }

            // 移动端菜单
            const mobileMenu = DOM.mobileMenu;
            if (mobileMenu) {
                mobileMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const sidebar = DOM.sidebar;
                    const overlay = DOM.overlay;
                    
                    if (sidebar) {
                        sidebar.classList.toggle('active');
                        if (sidebar.classList.contains('active') && overlay) {
                            overlay.classList.add('active');
                        } else if (overlay) {
                            overlay.classList.remove('active');
                        }
                    }
                });
            }

            // 移动端页面菜单
            const mobilePagesMenu = DOM.mobilePagesMenu;
            if (mobilePagesMenu) {
                mobilePagesMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const mobilePagesSidebar = DOM.mobilePagesSidebar;
                    const overlay = DOM.overlay;
                    const sidebar = DOM.sidebar;
                    
                    if (mobilePagesSidebar) {
                        mobilePagesSidebar.classList.add('active');
                        if (overlay) overlay.classList.add('active');
                        if (sidebar) sidebar.classList.remove('active');
                    }
                });
            }

            // 遮罩层点击
            const overlay = DOM.overlay;
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeMobile();
                });
            }

            // 阻止侧边栏内点击冒泡
            const sidebar = DOM.sidebar;
            if (sidebar) {
                sidebar.addEventListener('click', (e) => e.stopPropagation());
            }

            const mobilePagesSidebar = DOM.mobilePagesSidebar;
            if (mobilePagesSidebar) {
                mobilePagesSidebar.addEventListener('click', (e) => e.stopPropagation());
            }

            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (Utils.isMobile()) {
                    if (!e.target.closest('.miji-nav-sidebar') &&
                        !e.target.closest('.miji-nav-mobile-pages-sidebar') &&
                        !e.target.closest('#mobileMenu') &&
                        !e.target.closest('#mobilePagesMenu') &&
                        !e.target.closest('#desktopMenu')) {
                        this.closeMobile();
                    }
                }
            });

            // 窗口大小改变
            window.addEventListener('resize', Utils.debounce(() => {
                this.applySavedState();
            }, 250));
        }
    };

    // =========================================
    // 6. 分类导航模块
    // =========================================
    const CategoryManager = {
        init() {
            this.bindEvents();
            this.restoreLastCategory();
        },

        bindEvents() {
            const categories = document.querySelectorAll('.miji-nav-category');
            
            categories.forEach(category => {
                category.addEventListener('click', (e) => {
                    e.preventDefault();
                    const categoryId = category.getAttribute('data-category');
                    
                    // 更新激活状态
                    categories.forEach(cat => cat.classList.remove('active'));
                    category.classList.add('active');
                    
                    Utils.setStorageItem(CONFIG.STORAGE_KEYS.LAST_CATEGORY, categoryId);

                    if (categoryId === 'all') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }

                    // 滚动到目标分类
                    const targetContent = document.getElementById('category-' + categoryId);
                    if (targetContent) {
                        const header = document.querySelector('.miji-nav-header') || 
                                       document.querySelector('.miji-nav-mobile-header');
                        const headerHeight = header ? header.offsetHeight : 60;
                        
                        const offsetTop = targetContent.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: offsetTop - headerHeight - 20,
                            behavior: 'smooth'
                        });
                    }

                    // 移动端关闭侧边栏
                    if (Utils.isMobile()) {
                        SidebarManager.closeMobile();
                    }
                });
            });
        },

        restoreLastCategory() {
            // 移除自动恢复上次分类的功能，避免不期望的滚动行为
            // 如需启用，取消注释以下代码
            /*
            const lastCategory = Utils.getStorageItem(CONFIG.STORAGE_KEYS.LAST_CATEGORY);
            if (lastCategory) {
                const savedCategory = document.querySelector(`.miji-nav-category[data-category="${lastCategory}"]`);
                if (savedCategory) {
                    setTimeout(() => savedCategory.click(), 100);
                }
            }
            */
        },

        updateActiveOnScroll() {
            const header = document.querySelector('.miji-nav-header') || 
                          document.querySelector('.miji-nav-mobile-header');
            const headerHeight = header ? header.offsetHeight : 60;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const viewportCenter = scrollTop + headerHeight + 100;

            const categoryContents = document.querySelectorAll('.miji-nav-category-content');
            let activeCategory = 'all';

            categoryContents.forEach(content => {
                const rect = content.getBoundingClientRect();
                const contentTop = rect.top + scrollTop;
                
                if (viewportCenter >= contentTop) {
                    activeCategory = content.id.replace('category-', '');
                }
            });

            if (scrollTop < 200) {
                activeCategory = 'all';
            }

            const currentActive = document.querySelector('.miji-nav-category.active');
            const targetCategory = document.querySelector(`.miji-nav-category[data-category="${activeCategory}"]`);
            
            if (targetCategory && (!currentActive || currentActive !== targetCategory)) {
                document.querySelectorAll('.miji-nav-category').forEach(cat => {
                    cat.classList.remove('active');
                });
                targetCategory.classList.add('active');
            }
        }
    };

    // =========================================
    // 7. 搜索模块
    // =========================================
    const SearchManager = {
        init() {
            const searchForm = DOM.searchForm;
            const searchInput = DOM.searchInput;
            
            if (!searchForm || !searchInput) return;

            // 详情页禁用搜索
            const isDetailPage = document.querySelector('.miji-nav-detail-site') !== null ||
                                document.querySelector('.miji-nav-page-detail') !== null ||
                                document.body.classList.contains('miji-nav-detail-page');
            
            if (isDetailPage) {
                searchInput.disabled = true;
                searchInput.placeholder = '请返回首页搜索';
                searchInput.style.cursor = 'not-allowed';
                searchInput.style.opacity = '0.6';
                return;
            }

            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performSearch(searchInput.value);
            });

            searchInput.addEventListener('input', Utils.debounce(() => {
                if (searchInput.value.trim() === '') {
                    this.resetDisplay();
                } else {
                    this.performSearch(searchInput.value);
                }
            }, 200));
        },

        performSearch(term) {
            const searchTerm = term.trim().toLowerCase();
            if (searchTerm === '') {
                this.resetDisplay();
                return;
            }

            document.body.classList.add('search-active');
            
            const allCards = document.querySelectorAll('.miji-nav-card');
            let matchCount = 0;

            allCards.forEach(card => {
                const title = (card.querySelector('h3')?.textContent || card.querySelector('.miji-nav-card-title')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('p')?.textContent || card.querySelector('.miji-nav-card-desc')?.textContent || '').toLowerCase();
                
                if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                    card.style.display = 'flex';
                    matchCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // 更新分类区域显示
            const categoryContents = document.querySelectorAll('.miji-nav-category-content');
            categoryContents.forEach(content => {
                const visibleCards = content.querySelectorAll('.miji-nav-card[style*="display: flex"]');
                content.style.display = visibleCards.length > 0 ? 'block' : 'none';
                
                const subcategories = content.querySelector('.miji-nav-subcategories');
                if (subcategories) {
                    subcategories.style.display = 'none';
                }
            });

            if (matchCount === 0) {
                this.showNoResults();
            } else {
                this.removeNoResults();
            }
        },

        resetDisplay() {
            document.body.classList.remove('search-active');
            
            document.querySelectorAll('.miji-nav-card').forEach(card => {
                card.style.display = 'flex';
            });
            
            document.querySelectorAll('.miji-nav-category-content').forEach(content => {
                content.style.display = 'block';
                const subcategories = content.querySelector('.miji-nav-subcategories');
                if (subcategories) {
                    subcategories.style.display = 'flex';
                }
            });
            
            this.removeNoResults();
        },

        showNoResults() {
            if (document.querySelector('.miji-nav-no-results')) return;
            
            const noResults = document.createElement('div');
            noResults.className = 'miji-nav-no-results';
            noResults.textContent = '没有找到相关结果';
            
            const contentDiv = document.querySelector('.miji-nav-content');
            const imageEntrance = document.querySelector('.image-entrance-container');
            
            if (contentDiv && imageEntrance) {
                imageEntrance.insertAdjacentElement('afterend', noResults);
            }
        },

        removeNoResults() {
            const noResults = document.querySelector('.miji-nav-no-results');
            if (noResults) noResults.remove();
        }
    };

    // =========================================
    // 8. 卡片行为模块
    // =========================================
    const CardManager = {
        init() {
            this.enhanceCards();
            this.loadFavicons();
        },

        enhanceCards() {
            const allCards = document.querySelectorAll('.miji-nav-card');

            allCards.forEach(card => {
                // 移除原有的 miji-nav-card-jump 元素
                const oldJump = card.querySelector('.miji-nav-card-jump');
                if (oldJump) {
                    oldJump.remove();
                }

                // 添加操作按钮区域
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'miji-nav-card-actions';
                actionsDiv.innerHTML = `
                    <button class="miji-nav-card-action-btn edit-btn" title="编辑">
                        <svg viewBox="0 0 24 24"><path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" fill="currentColor"/></svg>
                    </button>
                    <button class="miji-nav-card-action-btn delete-btn" title="删除">
                        <svg viewBox="0 0 24 24"><path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" fill="currentColor"/></svg>
                    </button>
                `;
                card.appendChild(actionsDiv);

                // 绑定卡片点击事件（打开链接）
                const url = card.getAttribute('data-url') || '';
                if (url) {
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', (e) => {
                        // 如果点击的是操作按钮，不触发卡片点击
                        if (e.target.closest('.miji-nav-card-actions')) {
                            return;
                        }
                        e.preventDefault();
                        window.open(url, '_blank');
                    });
                }

                // 绑定编辑按钮事件
                const editBtn = actionsDiv.querySelector('.edit-btn');
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    CardEditManager.openEditDialog(card);
                });

                // 绑定删除按钮事件
                const deleteBtn = actionsDiv.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    CardEditManager.openDeleteDialog(card);
                });
            });
        },

        loadFavicons() {
            const allCards = document.querySelectorAll('.miji-nav-card');

            allCards.forEach(card => {
                const url = card.getAttribute('data-url');
                if (!url) return;

                const logoContainer = card.querySelector('.miji-nav-card-logo');
                if (!logoContainer) return;

                // 获取网站域名
                let domain;
                try {
                    domain = new URL(url).origin;
                } catch (e) {
                    return;
                }

                // 保存原有的首字母 span
                const originalSpan = logoContainer.querySelector('span');
                const fallbackLetter = originalSpan ? originalSpan.textContent : '';

                // 创建 favicon 图片元素
                const img = document.createElement('img');
                img.className = 'miji-nav-card-favicon';
                img.style.display = 'none';
                img.alt = '';

                // 尝试多个 favicon 来源
                const faviconSources = [
                    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                    `https://favicon.im/${domain}`,
                    `${domain}/favicon.ico`
                ];

                let currentSourceIndex = 0;

                const tryNextSource = () => {
                    if (currentSourceIndex >= faviconSources.length) {
                        // 所有来源都失败，显示首字母
                        img.remove();
                        if (originalSpan) {
                            originalSpan.style.display = '';
                        }
                        logoContainer.classList.remove('has-favicon');
                        return;
                    }

                    img.src = faviconSources[currentSourceIndex];
                    currentSourceIndex++;
                };

                img.onload = function() {
                    // 检查图片是否有效（不是空白或太小）
                    if (this.naturalWidth > 1 && this.naturalHeight > 1) {
                        this.style.display = 'block';
                        if (originalSpan) {
                            originalSpan.style.display = 'none';
                        }
                        logoContainer.classList.add('has-favicon');
                    } else {
                        tryNextSource();
                    }
                };

                img.onerror = function() {
                    tryNextSource();
                };

                // 插入图片元素
                logoContainer.insertBefore(img, logoContainer.firstChild);

                // 开始尝试加载
                tryNextSource();
            });
        }
    };

    // =========================================
    // 8.1 卡片编辑管理模块
    // =========================================
    const CardEditManager = {
        currentCard: null,
        pendingDeleteCard: null,

        init() {
            this.bindDialogEvents();
        },

        openEditDialog(card) {
            this.currentCard = card;
            
            const dialog = document.getElementById('cardEditDialog');
            const dialogTitle = dialog.querySelector('.miji-nav-card-edit-title');
            const nameInput = document.getElementById('cardEditName');
            const urlInput = document.getElementById('cardEditUrl');
            const descInput = document.getElementById('cardEditDesc');
            const categorySelect = document.getElementById('cardEditCategory');

            // 设置为编辑模式
            dialog.setAttribute('data-mode', 'edit');
            dialogTitle.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" fill="currentColor"/></svg>
                编辑网站
            `;

            // 获取卡片当前信息
            const title = card.querySelector('h3')?.textContent || card.querySelector('.miji-nav-card-title')?.textContent || '';
            const desc = card.querySelector('p')?.textContent || card.querySelector('.miji-nav-card-desc')?.textContent || '';
            const url = card.getAttribute('data-url') || '';

            // 填充表单
            nameInput.value = title;
            urlInput.value = url;
            descInput.value = desc;

            // 填充分组选项
            this.populateCategoryOptions(categorySelect, card);

            dialog.classList.add('active');
        },

        populateCategoryOptions(select, card) {
            select.innerHTML = '';
            
            // 获取所有分类
            const categories = document.querySelectorAll('.miji-nav-category-content');
            const currentSection = card.closest('.miji-nav-category-content');
            const currentCategoryId = currentSection ? currentSection.id.replace('category-', '') : '';

            categories.forEach(cat => {
                const categoryId = cat.id.replace('category-', '');
                const titleEl = cat.querySelector('.miji-nav-category-title-text') || cat.querySelector('.miji-nav-category-title');
                const categoryName = titleEl ? titleEl.textContent.trim() : categoryId;
                
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = categoryName;
                
                if (categoryId === currentCategoryId) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
        },

        closeEditDialog() {
            const dialog = document.getElementById('cardEditDialog');
            dialog.classList.remove('active');
            this.currentCard = null;
        },

        saveCard() {
            const dialog = document.getElementById('cardEditDialog');
            const mode = dialog.getAttribute('data-mode');

            const nameInput = document.getElementById('cardEditName');
            const urlInput = document.getElementById('cardEditUrl');
            const descInput = document.getElementById('cardEditDesc');
            const categorySelect = document.getElementById('cardEditCategory');

            const newName = nameInput.value.trim();
            const newUrl = urlInput.value.trim();
            const newDesc = descInput.value.trim();
            const newCategoryId = categorySelect.value;

            if (!newName || !newUrl) {
                this.showToast('请填写网站名称和链接', 'error');
                return;
            }

            // 添加模式
            if (mode === 'add') {
                CategoryTitleManager.addNewCard(newName, newUrl, newDesc, newCategoryId);
                this.closeEditDialog();
                return;
            }

            // 编辑模式
            if (!this.currentCard) return;

            // 更新卡片内容
            const titleEl = this.currentCard.querySelector('h3') || this.currentCard.querySelector('.miji-nav-card-title');
            const descEl = this.currentCard.querySelector('p') || this.currentCard.querySelector('.miji-nav-card-desc');
            const logoSpan = this.currentCard.querySelector('.miji-nav-card-logo span');

            if (titleEl) titleEl.textContent = newName;
            if (descEl) descEl.textContent = newDesc;
            if (logoSpan) logoSpan.textContent = newName.charAt(0).toUpperCase();
            
            this.currentCard.setAttribute('data-url', newUrl);

            // 检查是否需要移动到其他分类
            const currentSection = this.currentCard.closest('.miji-nav-category-content');
            const currentCategoryId = currentSection ? currentSection.id.replace('category-', '') : '';

            if (newCategoryId !== currentCategoryId) {
                const targetSection = document.getElementById('category-' + newCategoryId);
                if (targetSection) {
                    const targetCardsContainer = targetSection.querySelector('.miji-nav-cards');
                    if (targetCardsContainer) {
                        targetCardsContainer.appendChild(this.currentCard);
                    }
                }
            }

            this.closeEditDialog();
            this.showToast('网站信息已更新');
        },

        openDeleteDialog(card) {
            this.pendingDeleteCard = card;
            
            const dialog = document.getElementById('cardDeleteDialog');
            const nameSpan = document.getElementById('deleteCardName');
            
            const title = card.querySelector('h3')?.textContent || card.querySelector('.miji-nav-card-title')?.textContent || '此网站';
            nameSpan.textContent = title;
            
            dialog.classList.add('active');
        },

        closeDeleteDialog() {
            const dialog = document.getElementById('cardDeleteDialog');
            dialog.classList.remove('active');
            this.pendingDeleteCard = null;
        },

        confirmDelete() {
            if (this.pendingDeleteCard) {
                const cardName = this.pendingDeleteCard.querySelector('h3')?.textContent || '网站';
                this.pendingDeleteCard.remove();
                this.showToast(`"${cardName}" 已删除`);
            }
            this.closeDeleteDialog();
        },

        bindDialogEvents() {
            // 编辑弹窗事件
            const cancelEditBtn = document.getElementById('cancelCardEdit');
            const editForm = document.getElementById('cardEditForm');
            const editOverlay = document.getElementById('cardEditDialog');

            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', () => this.closeEditDialog());
            }

            if (editForm) {
                editForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveCard();
                });
            }

            if (editOverlay) {
                editOverlay.addEventListener('click', (e) => {
                    if (e.target === editOverlay) {
                        this.closeEditDialog();
                    }
                });
            }

            // 删除弹窗事件
            const cancelDeleteBtn = document.getElementById('cancelCardDelete');
            const confirmDeleteBtn = document.getElementById('confirmCardDelete');
            const deleteOverlay = document.getElementById('cardDeleteDialog');

            if (cancelDeleteBtn) {
                cancelDeleteBtn.addEventListener('click', () => this.closeDeleteDialog());
            }

            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
            }

            if (deleteOverlay) {
                deleteOverlay.addEventListener('click', (e) => {
                    if (e.target === deleteOverlay) {
                        this.closeDeleteDialog();
                    }
                });
            }

            // ESC 键关闭弹窗
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (editOverlay && editOverlay.classList.contains('active')) {
                        this.closeEditDialog();
                    }
                    if (deleteOverlay && deleteOverlay.classList.contains('active')) {
                        this.closeDeleteDialog();
                    }
                }
            });
        },

        showToast(message, type = 'success') {
            const existing = document.querySelector('.miji-nav-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'miji-nav-toast';
            
            const icon = type === 'success' 
                ? '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" fill="currentColor"/></svg>'
                : '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/></svg>';
            
            toast.innerHTML = `${icon}<span>${message}</span>`;
            document.body.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('show'));

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    };

    // =========================================
    // 9. 返回顶部模块
    // =========================================
    const BackToTopManager = {
        circumference: 0,

        init() {
            const btn = DOM.backToTopBtn;
            const circle = DOM.progressCircle;
            
            if (!btn || !circle) return;

            const radius = parseInt(circle.getAttribute('r'));
            this.circumference = 2 * Math.PI * radius;
            circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            circle.style.strokeDashoffset = this.circumference;

            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            this.updateProgress();
        },

        updateProgress() {
            const btn = DOM.backToTopBtn;
            const circle = DOM.progressCircle;
            if (!btn || !circle) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollProgress = Math.min(scrollTop / scrollHeight, 1);

            const offset = this.circumference - (scrollProgress * this.circumference);
            circle.style.strokeDashoffset = offset;

            if (scrollTop > CONFIG.SCROLL_THRESHOLD) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }
    };

    // =========================================
    // 10. 子分类过滤模块
    // =========================================
    const SubcategoryFilter = {
        init() {
            const subcategories = document.querySelectorAll('.miji-nav-subcategory');
            
            subcategories.forEach(subcategory => {
                subcategory.addEventListener('click', function() {
                    const subcategoryId = this.getAttribute('data-subcategory');
                    const parentSection = this.closest('.miji-nav-section');
                    
                    if (!parentSection) return;
                    
                    // 更新激活状态
                    const siblings = this.parentElement.querySelectorAll('.miji-nav-subcategory');
                    siblings.forEach(sub => sub.classList.remove('active'));
                    this.classList.add('active');

                    // 过滤卡片
                    const cards = parentSection.querySelectorAll('.miji-nav-card');
                    cards.forEach(card => {
                        if (subcategoryId === 'all') {
                            card.style.display = 'flex';
                        } else {
                            const cardSubcategory = card.getAttribute('data-subcategory');
                            card.style.display = cardSubcategory === subcategoryId ? 'flex' : 'none';
                        }
                    });
                });
            });
        }
    };

    // =========================================
    // 11. 滚动事件处理
    // =========================================
    const ScrollHandler = {
        init() {
            const throttledScroll = Utils.throttle(() => {
                BackToTopManager.updateProgress();
                CategoryManager.updateActiveOnScroll();
            }, 100);

            window.addEventListener('scroll', throttledScroll, { passive: true });
        }
    };

    // =========================================
    // 12. 分类标题编辑删除模块
    // =========================================
    const CategoryTitleManager = {
        pendingDeleteSection: null,
        currentAddSection: null,

        init() {
            this.enhanceTitles();
            this.bindDialogEvents();
        },

        enhanceTitles() {
            const titles = document.querySelectorAll('.miji-nav-category-title');
            
            titles.forEach(title => {
                const text = title.textContent.trim();
                
                title.innerHTML = `
                    <span class="miji-nav-category-title-text">${text}</span>
                    <input type="text" class="miji-nav-title-edit-input" value="${text}" />
                    <div class="miji-nav-category-title-actions">
                        <button class="miji-nav-title-btn add-btn" title="添加网站">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor"/></svg>
                        </button>
                        <button class="miji-nav-title-btn export-btn" title="导出分组">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 19h18v2H3v-2zm10-5.828L19.071 7.1l1.414 1.414L12 17 3.515 8.515 4.929 7.1 11 13.17V2h2v11.172z" fill="currentColor"/></svg>
                        </button>
                        <button class="miji-nav-title-btn edit-btn" title="编辑">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" fill="currentColor"/></svg>
                        </button>
                        <button class="miji-nav-title-btn delete-btn" title="删除">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" fill="currentColor"/></svg>
                        </button>
                        <button class="miji-nav-title-btn save-btn" title="保存">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" fill="currentColor"/></svg>
                        </button>
                        <button class="miji-nav-title-btn cancel-btn" title="取消">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/></svg>
                        </button>
                    </div>
                `;

                this.bindTitleEvents(title);
            });
        },

        bindTitleEvents(title) {
            const editBtn = title.querySelector('.edit-btn');
            const deleteBtn = title.querySelector('.delete-btn');
            const saveBtn = title.querySelector('.save-btn');
            const cancelBtn = title.querySelector('.cancel-btn');
            const exportBtn = title.querySelector('.export-btn');
            const addBtn = title.querySelector('.add-btn');
            const input = title.querySelector('.miji-nav-title-edit-input');
            const textSpan = title.querySelector('.miji-nav-category-title-text');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                title.classList.add('editing');
                input.value = textSpan.textContent;
                input.focus();
                input.select();
            });

            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.saveTitle(title);
            });

            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cancelEdit(title);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteConfirm(title);
            });

            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.exportCategory(title);
            });

            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openAddDialog(title);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitle(title);
                } else if (e.key === 'Escape') {
                    this.cancelEdit(title);
                }
            });

            input.addEventListener('click', (e) => e.stopPropagation());
        },

        saveTitle(title) {
            const input = title.querySelector('.miji-nav-title-edit-input');
            const textSpan = title.querySelector('.miji-nav-category-title-text');
            const newText = input.value.trim();

            if (newText) {
                textSpan.textContent = newText;
                this.updateSidebarCategory(title, newText);
                this.showToast('标题已更新');
            }

            title.classList.remove('editing');
        },

        cancelEdit(title) {
            const input = title.querySelector('.miji-nav-title-edit-input');
            const textSpan = title.querySelector('.miji-nav-category-title-text');
            input.value = textSpan.textContent;
            title.classList.remove('editing');
        },

        updateSidebarCategory(title, newText) {
            const section = title.closest('.miji-nav-category-content');
            if (section) {
                const categoryId = section.id.replace('category-', '');
                const sidebarLink = document.querySelector(`.miji-nav-category[data-category="${categoryId}"] span`);
                if (sidebarLink) {
                    sidebarLink.textContent = newText;
                }
            }
        },

        // 导出分组功能
        exportCategory(title) {
            const section = title.closest('.miji-nav-category-content');
            if (!section) return;

            const categoryName = title.querySelector('.miji-nav-category-title-text').textContent;
            const cards = section.querySelectorAll('.miji-nav-card');
            
            const exportData = {
                categoryName: categoryName,
                exportTime: new Date().toISOString(),
                websites: []
            };

            cards.forEach(card => {
                const name = card.querySelector('h3')?.textContent || card.querySelector('.miji-nav-card-title')?.textContent || '';
                const desc = card.querySelector('p')?.textContent || card.querySelector('.miji-nav-card-desc')?.textContent || '';
                const url = card.getAttribute('data-url') || '';
                const subcategory = card.getAttribute('data-subcategory') || '';

                exportData.websites.push({
                    name,
                    url,
                    description: desc,
                    subcategory
                });
            });

            // 创建并下载 JSON 文件
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${categoryName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast(`已导出 "${categoryName}" 分组（${exportData.websites.length} 个网站）`);
        },

        // 打开添加网站弹窗
        openAddDialog(title) {
            const section = title.closest('.miji-nav-category-content');
            this.currentAddSection = section;

            const dialog = document.getElementById('cardEditDialog');
            const dialogTitle = dialog.querySelector('.miji-nav-card-edit-title');
            const nameInput = document.getElementById('cardEditName');
            const urlInput = document.getElementById('cardEditUrl');
            const descInput = document.getElementById('cardEditDesc');
            const categorySelect = document.getElementById('cardEditCategory');

            // 修改弹窗标题
            dialogTitle.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" fill="currentColor"/></svg>
                添加网站
            `;

            // 清空表单
            nameInput.value = '';
            urlInput.value = '';
            descInput.value = '';

            // 填充分组选项并选中当前分组
            this.populateCategoryOptions(categorySelect, section);

            // 标记为添加模式
            dialog.setAttribute('data-mode', 'add');
            dialog.classList.add('active');
        },

        populateCategoryOptions(select, currentSection) {
            select.innerHTML = '';
            
            const categories = document.querySelectorAll('.miji-nav-category-content');
            const currentCategoryId = currentSection ? currentSection.id.replace('category-', '') : '';

            categories.forEach(cat => {
                const categoryId = cat.id.replace('category-', '');
                const titleEl = cat.querySelector('.miji-nav-category-title-text') || cat.querySelector('.miji-nav-category-title');
                const categoryName = titleEl ? titleEl.textContent.trim() : categoryId;
                
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = categoryName;
                
                if (categoryId === currentCategoryId) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
        },

        // 添加新网站
        addNewCard(name, url, desc, categoryId) {
            const targetSection = document.getElementById('category-' + categoryId);
            if (!targetSection) return;

            const cardsContainer = targetSection.querySelector('.miji-nav-cards');
            if (!cardsContainer) return;

            // 创建新卡片
            const card = document.createElement('article');
            card.className = 'miji-nav-card';
            card.setAttribute('data-url', url);
            card.style.cursor = 'pointer';

            const firstLetter = name.charAt(0).toUpperCase();
            card.innerHTML = `
                <div class="miji-nav-card-logo"><span>${firstLetter}</span></div>
                <div class="miji-nav-card-content">
                    <h3>${name}</h3>
                    <p>${desc}</p>
                </div>
            `;

            // 添加操作按钮
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'miji-nav-card-actions';
            actionsDiv.innerHTML = `
                <button class="miji-nav-card-action-btn edit-btn" title="编辑">
                    <svg viewBox="0 0 24 24"><path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" fill="currentColor"/></svg>
                </button>
                <button class="miji-nav-card-action-btn delete-btn" title="删除">
                    <svg viewBox="0 0 24 24"><path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" fill="currentColor"/></svg>
                </button>
            `;
            card.appendChild(actionsDiv);

            // 绑定事件
            card.addEventListener('click', (e) => {
                if (e.target.closest('.miji-nav-card-actions')) return;
                e.preventDefault();
                window.open(url, '_blank');
            });

            actionsDiv.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                CardEditManager.openEditDialog(card);
            });

            actionsDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                CardEditManager.openDeleteDialog(card);
            });

            // 添加到容器
            cardsContainer.appendChild(card);

            // 尝试加载 favicon
            this.loadCardFavicon(card, url);

            this.showToast(`"${name}" 已添加`);
        },

        loadCardFavicon(card, url) {
            const logoContainer = card.querySelector('.miji-nav-card-logo');
            if (!logoContainer) return;

            let domain;
            try {
                domain = new URL(url).origin;
            } catch (e) {
                return;
            }

            const originalSpan = logoContainer.querySelector('span');
            const img = document.createElement('img');
            img.className = 'miji-nav-card-favicon';
            img.style.display = 'none';
            img.alt = '';

            const faviconSources = [
                `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                `https://favicon.im/${domain}`,
                `${domain}/favicon.ico`
            ];

            let currentSourceIndex = 0;

            const tryNextSource = () => {
                if (currentSourceIndex >= faviconSources.length) {
                    img.remove();
                    if (originalSpan) originalSpan.style.display = '';
                    logoContainer.classList.remove('has-favicon');
                    return;
                }
                img.src = faviconSources[currentSourceIndex];
                currentSourceIndex++;
            };

            img.onload = function() {
                if (this.naturalWidth > 1 && this.naturalHeight > 1) {
                    this.style.display = 'block';
                    if (originalSpan) originalSpan.style.display = 'none';
                    logoContainer.classList.add('has-favicon');
                } else {
                    tryNextSource();
                }
            };

            img.onerror = function() {
                tryNextSource();
            };

            logoContainer.insertBefore(img, logoContainer.firstChild);
            tryNextSource();
        },

        showDeleteConfirm(title) {
            const section = title.closest('.miji-nav-category-content');
            const categoryName = title.querySelector('.miji-nav-category-title-text').textContent;
            
            this.pendingDeleteSection = section;
            
            const dialog = document.getElementById('deleteConfirmDialog');
            const nameSpan = document.getElementById('deleteCategoryName');
            
            nameSpan.textContent = categoryName;
            dialog.classList.add('active');
        },

        hideDeleteConfirm() {
            const dialog = document.getElementById('deleteConfirmDialog');
            dialog.classList.remove('active');
            this.pendingDeleteSection = null;
        },

        confirmDelete() {
            if (this.pendingDeleteSection) {
                const section = this.pendingDeleteSection;
                const categoryId = section.id.replace('category-', '');
                
                const sidebarLink = document.querySelector(`.miji-nav-category[data-category="${categoryId}"]`);
                if (sidebarLink) {
                    sidebarLink.remove();
                }
                
                section.remove();
                
                this.showToast('分类已删除');
            }
            
            this.hideDeleteConfirm();
        },

        bindDialogEvents() {
            const cancelBtn = document.getElementById('cancelDelete');
            const confirmBtn = document.getElementById('confirmDelete');
            const overlay = document.getElementById('deleteConfirmDialog');

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideDeleteConfirm());
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => this.confirmDelete());
            }

            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        this.hideDeleteConfirm();
                    }
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    this.hideDeleteConfirm();
                }
            });
        },

        showToast(message) {
            const existing = document.querySelector('.miji-nav-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'miji-nav-toast';
            toast.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" fill="currentColor"/></svg>
                <span>${message}</span>
            `;
            document.body.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add('show'));

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    };

    // =========================================
    // 13. 初始化入口
    // =========================================
    function init() {
        // 初始化所有模块
        ThemeManager.init();
        SidebarManager.init();
        CategoryManager.init();
        SearchManager.init();
        CardManager.init();
        CardEditManager.init();
        BackToTopManager.init();
        SubcategoryFilter.init();
        ScrollHandler.init();
        CategoryTitleManager.init();

        // 页面加载完成标记
        document.body.classList.add('page-loaded');
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 导出到全局（用于调试）
    window.MijiNav = {
        ThemeManager,
        SidebarManager,
        CategoryManager,
        SearchManager,
        CardManager
    };

})();
