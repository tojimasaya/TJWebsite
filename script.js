// tojimasaya.com のための最適化されたスクリプト
// Enhanced version with performance optimization, error handling, and modern features

/**
 * 設定オブジェクト
 */
const CONFIG = {
    API: {
        RSS_CONVERTER: 'https://api.rss2json.com/v1/api.json',
        TIMEOUT: 10000,
        MAX_RETRIES: 3
    },
    FEEDS: [
        {
            name: "次はどこへ",
            url: "https://note.com/tojimasaya/m/md99dd54590fa/rss",
            icon: "📝",
            priority: 1
        },
        {
            name: "香港レンズ", 
            url: "https://note.com/tojimasaya/m/m22c44596304b/rss",
            icon: "📷",
            priority: 2
        }
    ],
    UI: {
        ANIMATION_DURATION: 300,
        SCROLL_OFFSET: 50,
        NOTIFICATION_DURATION: 5000
    }
};

/**
 * 状態管理システム
 */
class StateManager {
    constructor() {
        this.state = {
            articles: [],
            loading: false,
            error: null,
            modalOpen: false
        };
        this.subscribers = [];
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifySubscribers();
    }
    
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }
    
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }
}

/**
 * エラーハンドリングと通知システム
 */
class NotificationManager {
    static show(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        
        container.appendChild(notification);
        
        // 自動消失
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, CONFIG.UI.NOTIFICATION_DURATION);
    }
    
    static error(message) {
        this.show(message, 'error');
    }
    
    static success(message) {
        this.show(message, 'success');
    }
    
    static warning(message) {
        this.show(message, 'warning');
    }
}

/**
 * ローディング表示管理
 */
class LoadingManager {
    static show() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    }
    
    static hide() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }
}

/**
 * リトライ機能付きFetch
 */
async function fetchWithRetry(url, options = {}, maxRetries = CONFIG.API.MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed:`, error.message);
            
            if (i === maxRetries - 1) {
                throw error;
            }
            
            // 指数バックオフ
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

/**
 * RSS記事データの型定義
 * @typedef {Object} ArticleData
 * @property {string} title - 記事タイトル
 * @property {string} link - 記事URL
 * @property {Date} pubDate - 公開日
 * @property {string} description - 記事の説明
 * @property {string} source - 記事ソース
 * @property {string} icon - アイコン
 */

/**
 * 個別フィード取得関数
 * @param {Object} feed - フィード設定
 * @returns {Promise<ArticleData[]>} 記事データの配列
 */
async function fetchFeedData(feed) {
    try {
        const url = `${CONFIG.API.RSS_CONVERTER}?rss_url=${encodeURIComponent(feed.url)}`;
        const response = await fetchWithRetry(url);
        const data = await response.json();
        
        if (data.status !== 'ok' || !data.items) {
            throw new Error(`Invalid RSS data from ${feed.name}`);
        }
        
        return data.items.slice(0, 3).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate),
            description: item.description ? 
                item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '',
            source: feed.name,
            icon: feed.icon
        }));
    } catch (error) {
        console.error(`${feed.name} の取得エラー:`, error);
        return [];
    }
}

/**
 * アプリケーション状態とUI管理
 */
const appState = new StateManager();

// 状態変更の監視
appState.subscribe(state => {
    if (state.loading) {
        LoadingManager.show();
    } else {
        LoadingManager.hide();
    }
});

/**
 * フォーカス管理システム
 */
class FocusManager {
    static trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleKeydown = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        element.addEventListener('keydown', handleKeydown);
        firstElement.focus();
        
        return () => {
            element.removeEventListener('keydown', handleKeydown);
        };
    }
}

/**
 * スクロールアニメーション管理
 */
class ScrollAnimationManager {
    constructor() {
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                threshold: [0, 0.1, 0.5, 1],
                rootMargin: '-50px 0px'
            }
        );
        this.init();
    }
    
    init() {
        // アニメーション対象要素を監視
        const elements = document.querySelectorAll('.content-card, .video-item, .photo-item, .social-link');
        elements.forEach(el => this.observer.observe(el));
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                // パフォーマンス向上のため、一度アニメーションが実行されたら監視を停止
                this.observer.unobserve(entry.target);
            }
        });
    }
}

/**
 * DOM操作最適化のためのヘルパー
 */
class DOMHelper {
    static createFragment() {
        return document.createDocumentFragment();
    }
    
    static batchUpdate(element, updates) {
        const fragment = this.createFragment();
        updates.forEach(update => {
            if (typeof update === 'function') {
                update(fragment);
            } else if (update.element) {
                fragment.appendChild(update.element);
            }
        });
        element.appendChild(fragment);
    }
}

/**
 * メインの初期化関数
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('サイト読み込み開始');
    
    // 各機能の初期化
    initializeApp();
});

async function initializeApp() {
    try {
        // 並列実行で高速化
        await Promise.allSettled([
            loadNotePosts(),
            updateMainContentCard(),
            initializeScrollAnimations(),
            initializeLightbox(),
            initializeServiceWorker()
        ]);
        
        // 初期化完了の通知
        NotificationManager.success('サイトの読み込みが完了しました');
        
    } catch (error) {
        console.error('初期化エラー:', error);
        NotificationManager.error('サイトの初期化中にエラーが発生しました');
    }
}

/**
 * Service Worker初期化
 */
async function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }
}

/**
 * メインカードの更新情報を自動取得（改善版）
 */
async function updateMainContentCard() {
    console.log('メインカード更新開始');
    appState.setState({ loading: true });
    
    try {
        const mainFeed = CONFIG.FEEDS.find(feed => feed.priority === 1);
        const url = `${CONFIG.API.RSS_CONVERTER}?rss_url=${encodeURIComponent(mainFeed.url)}`;
        const response = await fetchWithRetry(url);
        const data = await response.json();
        
        console.log('次はどこへマガジンRSS取得結果:', data);
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
            const latestPost = data.items[0];
            const timeElement = document.querySelector('.content-card.large time');
            if (timeElement) {
                const postDate = new Date(latestPost.pubDate);
                const formattedDate = formatDate(postDate);
                timeElement.textContent = `最新：${formattedDate}`;
                timeElement.setAttribute('datetime', postDate.toISOString());
                console.log('メインカード更新完了:', formattedDate);
            }
            
            // プレビュー更新
            updatePreview(data.items);
            
        } else {
            console.log('次はどこへマガジンのデータが空または無効');
            fallbackMainCard();
        }
    } catch (error) {
        console.error('メインカード更新エラー:', error);
        NotificationManager.warning('最新記事の取得に時間がかかっています');
        fallbackMainCard();
    } finally {
        appState.setState({ loading: false });
    }
}

/**
 * フォールバック表示
 */
function fallbackMainCard() {
    const timeElement = document.querySelector('.content-card.large time');
    if (timeElement) {
        const fallbackDate = new Date('2025-09-17');
        timeElement.textContent = '2025年9月17日更新';
        timeElement.setAttribute('datetime', fallbackDate.toISOString());
    }
    
    // 手動プレビュー表示
    const previewContainer = document.getElementById('whats-next-preview');
    if (previewContainer) {
        previewContainer.innerHTML = `
            <h4>最新記事</h4>
            <div class="preview-item">
                <div class="preview-title">
                    <a href="https://note.com/tojimasaya" target="_blank" rel="noopener noreferrer">記事を確認中</a>
                </div>
                <div class="preview-excerpt">最新記事の読み込み中です...</div>
                <div class="preview-date">更新中</div>
            </div>
        `;
    }
}

/**
 * プレビュー表示機能（改善版）
 */
function updatePreview(items) {
    console.log('プレビュー更新開始:', items);
    const previewContainer = document.getElementById('whats-next-preview');
    if (!previewContainer) {
        console.log('プレビューコンテナが見つかりません');
        return;
    }
    
    const previewPosts = items.slice(0, 3);
    const fragment = DOMHelper.createFragment();
    
    // ヘッダー作成
    const header = document.createElement('h4');
    header.textContent = '最新記事';
    fragment.appendChild(header);
    
    // 記事アイテム作成
    previewPosts.forEach(post => {
        const postDate = new Date(post.pubDate);
        const excerpt = post.description ? 
            post.description.replace(/<[^>]*>/g, '').substring(0, 80) + '...' : 
            '記事の詳細はリンクからご確認ください。';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'preview-item';
        itemDiv.innerHTML = `
            <div class="preview-title">
                <a href="${post.link}" target="_blank" rel="noopener noreferrer">${post.title}</a>
            </div>
            <div class="preview-excerpt">${excerpt}</div>
            <div class="preview-date">${formatDate(postDate)}</div>
        `;
        fragment.appendChild(itemDiv);
    });
    
    // 一括でDOMに挿入
    previewContainer.innerHTML = '';
    previewContainer.appendChild(fragment);
    
    console.log('プレビュー更新完了');
}

/**
 * note記事一覧の取得（並列処理で改善）
 */
async function loadNotePosts() {
    console.log('記事一覧取得開始');
    const feedContainer = document.getElementById('note-feed');
    
    appState.setState({ loading: true });
    
    try {
        // 並列でフィード取得
        const feedPromises = CONFIG.FEEDS.map(feed => 
            fetchFeedData(feed).catch(error => {
                console.log(`${feed.name} エラー:`, error);
                return [];
            })
        );
        
        const results = await Promise.allSettled(feedPromises);
        const allPosts = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);
        
        // 日付順でソート（新しい順）
        allPosts.sort((a, b) => b.pubDate - a.pubDate);
        const postsToShow = allPosts.slice(0, 5);
        
        if (postsToShow.length > 0) {
            displayArticles(feedContainer, postsToShow);
            console.log('記事一覧表示完了');
        } else {
            console.log('記事データが空');
            showFallbackArticles(feedContainer);
        }
        
    } catch (error) {
        console.error('記事一覧取得エラー:', error);
        NotificationManager.error('記事の読み込みに失敗しました');
        showFallbackArticles(feedContainer);
    } finally {
        appState.setState({ loading: false });
    }
}

/**
 * 記事表示のDOMパフォーマンス最適化
 */
function displayArticles(container, posts) {
    const fragment = DOMHelper.createFragment();
    
    posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'writing-item';
        article.setAttribute('role', 'article');
        
        article.innerHTML = `
            <div class="writing-meta">
                <span class="writing-source">${post.source}</span>
                <time datetime="${post.pubDate.toISOString()}">${formatDate(post.pubDate)}</time>
            </div>
            <h3><a href="${post.link}" target="_blank" rel="noopener noreferrer">${post.title}</a></h3>
            <div class="writing-excerpt">${post.description}</div>
        `;
        
        fragment.appendChild(article);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

/**
 * フォールバック記事表示
 */
function showFallbackArticles(container) {
    const fallbackArticles = [
        {
            source: 'note',
            date: '2025年9月17日',
            title: 'きょう知ってお恥ずかしい香港ニュース',
            excerpt: '香港の最新ニュースと情報をお届けします。',
            link: 'https://note.com/tojimasaya'
        },
        {
            source: 'note',
            date: '2025年9月16日',
            title: '香港の経済と社会について',
            excerpt: '香港の現状と今後の展望について考察します。',
            link: 'https://note.com/tojimasaya'
        }
    ];
    
    const fragment = DOMHelper.createFragment();
    
    fallbackArticles.forEach(article => {
        const articleElement = document.createElement('article');
        articleElement.className = 'writing-item';
        articleElement.innerHTML = `
            <div class="writing-meta">
                <span class="writing-source">${article.source}</span>
                <time>${article.date}</time>
            </div>
            <h3><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></h3>
            <div class="writing-excerpt">${article.excerpt}</div>
        `;
        fragment.appendChild(articleElement);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

/**
 * 日付のフォーマット
 */
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Tokyo'
    };
    return date.toLocaleDateString('ja-JP', options);
}

/**
 * スクロールアニメーション初期化
 */
function initializeScrollAnimations() {
    new ScrollAnimationManager();
}

/**
 * ライトボックス機能の初期化（改善版）
 */
function initializeLightbox() {
    console.log('ライトボックス機能初期化');
    
    // イベントデリゲーションでパフォーマンス向上
    document.addEventListener('click', handleLightboxClick);
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // モーダル外クリックで閉じる
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

/**
 * ライトボックスクリックハンドラー
 */
function handleLightboxClick(e) {
    // 写真がクリックされた場合
    if (e.target.matches('.photo-item img') || e.target.closest('.photo-item')) {
        e.preventDefault();
        const img = e.target.matches('img') ? e.target : e.target.querySelector('img');
        if (img) openImageModal(img);
    }
    
    // 動画がクリックされた場合
    if (e.target.closest('.video-item')) {
        const videoItem = e.target.closest('.video-item');
        const iframe = videoItem.querySelector('iframe');
        if (iframe) {
            e.preventDefault();
            const title = videoItem.querySelector('.video-caption')?.textContent || 'Video';
            openVideoModal(iframe.src, title);
        }
    }
}

/**
 * キーボードナビゲーション
 */
function handleKeyboardNavigation(e) {
    if (e.key === 'Escape' && appState.state.modalOpen) {
        closeModal();
    }
}

/**
 * 画像モーダルを開く（改善版）
 */
function openImageModal(img) {
    console.log('画像モーダルを開く:', img.src);
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    
    if (modal && modalContent) {
        // アクセシビリティ属性設定
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-labelledby', 'modal-image');
        
        modalContent.innerHTML = `
            <img id="modal-image" 
                 src="${img.src}" 
                 alt="${img.alt}" 
                 class="modal-image">
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // フォーカストラップ
        const cleanup = FocusManager.trapFocus(modal);
        modal.dataset.focusCleanup = 'true';
        
        appState.setState({ modalOpen: true });
    }
}

/**
 * 動画モーダルを開く（改善版）
 */
function openVideoModal(videoSrc, title) {
    console.log('動画モーダルを開く:', videoSrc);
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    
    if (modal && modalContent) {
        // 自動再生用のパラメータを追加
        const autoplaySrc = videoSrc.includes('?') ? 
            `${videoSrc}&autoplay=1` : 
            `${videoSrc}?autoplay=1`;
        
        // アクセシビリティ属性設定
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-labelledby', 'modal-video-title');
        
        modalContent.innerHTML = `
            <iframe id="modal-video-title"
                    src="${autoplaySrc}" 
                    title="${title}" 
                    class="modal-video"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen></iframe>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // フォーカストラップ
        const cleanup = FocusManager.trapFocus(modal);
        modal.dataset.focusCleanup = 'true';
        
        appState.setState({ modalOpen: true });
    }
}

/**
 * モーダルを閉じる（改善版）
 */
function closeModal() {
    console.log('モーダルを閉じる');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    
    if (modal && modalContent) {
        // フェードアウトアニメーション
        modal.style.animation = 'fadeIn 0.3s ease reverse';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = '';
            modal.setAttribute('aria-hidden', 'true');
            modalContent.innerHTML = '';
            document.body.style.overflow = 'auto';
            
            // フォーカスを元の位置に戻す
            const activeElement = document.activeElement;
            if (activeElement && activeElement !== document.body) {
                activeElement.blur();
            }
            
            appState.setState({ modalOpen: false });
        }, 300);
    }
}

/**
 * スムーススクロール
 */
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

/**
 * パフォーマンス最適化されたパララックス効果
 */
let ticking = false;

function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-image img');
    
    if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
    }
    
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
    }
});

/**
 * パフォーマンス監視（開発用）
 */
class PerformanceMonitor {
    static async measureCoreWebVitals() {
        if (!window.PerformanceObserver) return;
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });
        
        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    console.log('CLS:', clsValue);
                }
            }
        }).observe({ entryTypes: ['layout-shift'] });
    }
}

// 開発環境でのパフォーマンス監視
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    PerformanceMonitor.measureCoreWebVitals();
}

/**
 * エラー監視とレポート
 */
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    NotificationManager.error('予期しないエラーが発生しました');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    NotificationManager.warning('処理中にエラーが発生しました');
});
/**
 * ナビゲーション機能の初期化
 */
function initializeNavigation() {
    console.log('ナビゲーション機能初期化');
    
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const mainNav = document.getElementById('main-nav');
    
    if (!navToggle || !navMenu) return;
    
    // モバイルメニュートグル
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('nav-open');
        
        // ARIA属性の更新
        const isOpen = navMenu.classList.contains('active');
        navToggle.setAttribute('aria-expanded', isOpen);
        navToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    });
    
    // ナビゲーションリンククリック時にモバイルメニューを閉じる
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'メニューを開く');
        });
    });
    
    // スクロール時のナビゲーション効果
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            mainNav.classList.add('scrolled');
        } else {
            mainNav.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // ESCキーでモバイルメニューを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'メニューを開く');
        }
    });
    
    // 現在のページに応じてactiveクラスを設定
    setActiveNavLink();
}

/**
 * 現在のページに応じてナビゲーションのactiveクラスを設定
 */
function setActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const linkPath = new URL(link.href).pathname;
        if (currentPath === linkPath || 
            (currentPath === '/' && link.textContent.trim() === 'Home')) {
            link.classList.add('active');
        }
    });
}

// 既存のDOMContentLoadedイベントリスナーに追加
document.addEventListener('DOMContentLoaded', function() {
    // 既存の初期化処理...
    
    // ナビゲーション初期化を追加
    initializeNavigation();
});
