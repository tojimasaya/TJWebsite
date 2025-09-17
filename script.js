// tojimasaya.com のための更新されたスクリプト
document.addEventListener('DOMContentLoaded', function() {
    console.log('サイト読み込み開始');
    loadNotePosts();
    updateMainContentCard();
    initializeScrollAnimations();
});

// メインカードの更新情報を自動取得（次はどこへマガジンから）
async function updateMainContentCard() {
    console.log('メインカード更新開始');
    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://note.com/tojimasaya/m/md99dd54590fa/rss')}`);
        const data = await response.json();
        
        console.log('次はどこへマガジンRSS取得結果:', data);
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
            const latestPost = data.items[0];
            const timeElement = document.querySelector('.content-card.large time');
            if (timeElement) {
                const postDate = new Date(latestPost.pubDate);
                const formattedDate = formatDate(postDate);
                timeElement.textContent = `最新：${formattedDate}`;
                console.log('メインカード更新完了:', formattedDate);
            }
        } else {
            console.log('次はどこへマガジンのデータが空または無効');
            fallbackMainCard();
        }
    } catch (error) {
        console.error('メインカード更新エラー:', error);
        fallbackMainCard();
    }
}

// フォールバック表示
function fallbackMainCard() {
    const timeElement = document.querySelector('.content-card.large time');
    if (timeElement) {
        timeElement.textContent = '2025年9月17日更新';
    }
}

// note記事一覧の取得（マガジン別）
async function loadNotePosts() {
    console.log('記事一覧取得開始');
    const feedContainer = document.getElementById('note-feed');
    
    // マガジン別RSSフィード
    const noteFeeds = [
        {
            name: "次はどこへ",
            url: "https://note.com/tojimasaya/m/md99dd54590fa/rss",
            icon: "📝"
        },
        {
            name: "香港レンズ", 
            url: "https://note.com/tojimasaya/m/m22c44596304b/rss",
            icon: "📷"
        }
    ];
    
    try {
        const allPosts = [];
        
        // 各マガジンから記事を取得
        for (const feed of noteFeeds) {
            try {
                console.log(`${feed.name} の記事を取得中...`);
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
                const data = await response.json();
                
                if (data.status === 'ok' && data.items) {
                    const posts = data.items.slice(0, 3).map(item => ({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate),
                        description: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '',
                        source: feed.name,
                        icon: feed.icon
                    }));
                    allPosts.push(...posts);
                    console.log(`${feed.name}: ${posts.length}件取得`);
                }
            } catch (error) {
                console.log(`${feed.name} の取得エラー:`, error);
            }
        }
        
        // 日付順でソート（新しい順）
        allPosts.sort((a, b) => b.pubDate - a.pubDate);
        const postsToShow = allPosts.slice(0, 5);
        
        
        if (postsToShow.length > 0) {
            const articlesHTML = postsToShow.map(post => `
                <article class="writing-item">
                    <div class="writing-meta">
                        <span class="writing-source">${post.source}</span>
                        <time>${formatDate(post.pubDate)}</time>
                    </div>
                    <h3><a href="${post.link}" target="_blank">${post.title}</a></h3>
                    <div class="writing-excerpt">${post.description}</div>
                </article>
            `).join('');
            
            feedContainer.innerHTML = articlesHTML;
            console.log('記事一覧表示完了');
            
        } else {
            console.log('記事データが空');
            showFallbackArticles(feedContainer);
        }
        
    } catch (error) {
        console.error('記事一覧取得エラー:', error);
        showFallbackArticles(feedContainer);
    }
}

// フォールバック記事表示
function showFallbackArticles(container) {
    container.innerHTML = `
        <article class="writing-item">
            <div class="writing-meta">
                <span class="writing-source">note</span>
                <time>2025年9月17日</time>
            </div>
            <h3><a href="https://note.com/tojimasaya" target="_blank">きょう知ってお恥ずかしい香港ニュース</a></h3>
            <div class="writing-excerpt">香港の最新ニュースと情報をお届けします。</div>
        </article>
        
        <article class="writing-item">
            <div class="writing-meta">
                <span class="writing-source">note</span>
                <time>2025年9月16日</time>
            </div>
            <h3><a href="https://note.com/tojimasaya" target="_blank">香港の経済と社会について</a></h3>
            <div class="writing-excerpt">香港の現状と今後の展望について考察します。</div>
        </article>
    `;
}

// 日付のフォーマット
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'Asia/Tokyo'
    };
    return date.toLocaleDateString('ja-JP', options);
}

// スクロールアニメーション
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);

    // アニメーション対象要素を監視
    document.querySelectorAll('.content-card, .photo-item, .social-link').forEach(el => {
        observer.observe(el);
    });
}

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// パララックス効果（ヒーロー画像）
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-image img');
    
    if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
    }
});
