// noteのRSSフィードから最新記事を取得
document.addEventListener(‘DOMContentLoaded’, function() {
loadNotePosts();
});

async function loadNotePosts() {
const feedContainer = document.getElementById(‘note-feed’);

```
// 複数のnoteアカウントのRSSフィード（実際のユーザー名に変更してください）
const noteFeeds = [
    {
        name: "What's Next",
        url: "https://note.com/your-username/rss", // 実際のnoteユーザー名に変更
        icon: "📝"
    },
    {
        name: "Hong Kong Lens",
        url: "https://note.com/your-username2/rss", // 実際のnoteユーザー名に変更
        icon: "📷"
    }
    // 必要に応じて他のフィードも追加
];

try {
    const allPosts = [];

    // RSS-to-JSONサービスを使用してRSSを取得
    for (const feed of noteFeeds) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
            const data = await response.json();

            if (data.status === 'ok' && data.items) {
                // 最新3件を取得
                const posts = data.items.slice(0, 3).map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: new Date(item.pubDate),
                    description: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '',
                    source: feed.name,
                    icon: feed.icon
                }));
                allPosts.push(...posts);
            }
        } catch (error) {
            console.log(`Error loading feed for ${feed.name}:`, error);
        }
    }

    // 日付順でソート（新しい順）
    allPosts.sort((a, b) => b.pubDate - a.pubDate);

    // 最新6件を表示
    const postsToShow = allPosts.slice(0, 6);

    if (postsToShow.length > 0) {
        feedContainer.innerHTML = postsToShow.map(post => `
            <div class="post-card">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="margin-right: 8px;">${post.icon}</span>
                    <small style="color: #666;">${post.source}</small>
                </div>
                <h3><a href="${post.link}" target="_blank" style="text-decoration: none; color: inherit;">${post.title}</a></h3>
                <p>${post.description}</p>
                <div class="post-date">${formatDate(post.pubDate)}</div>
            </div>
        `).join('');
    } else {
        feedContainer.innerHTML = '<div class="loading">記事の読み込みに失敗しました。しばらく後でお試しください。</div>';
    }

} catch (error) {
    console.error('Error loading posts:', error);
    feedContainer.innerHTML = `
        <div class="post-card">
            <h3>手動で最新記事を追加</h3>
            <p>RSSフィードの自動読み込みが利用できない場合は、このスクリプトを編集して手動で最新記事を追加できます。</p>
            <div class="post-date">2025年8月24日</div>
        </div>
    `;
}
```

}

// 日付のフォーマット
function formatDate(date) {
const options = {
year: ‘numeric’,
month: ‘long’,
day: ‘numeric’,
timeZone: ‘Asia/Tokyo’
};
return date.toLocaleDateString(‘ja-JP’, options);
}

// スムーススクロール
document.querySelectorAll(‘a[href^=”#”]’).forEach(anchor => {
anchor.addEventListener(‘click’, function (e) {
e.preventDefault();
document.querySelector(this.getAttribute(‘href’)).scrollIntoView({
behavior: ‘smooth’
});
});
});

// 手動で記事を追加する場合の関数（RSSが使えない場合）
function addManualPost(title, link, description, source, date) {
const feedContainer = document.getElementById(‘note-feed’);
const postHTML = `<div class="post-card"> <div style="display: flex; align-items: center; margin-bottom: 10px;"> <span style="margin-right: 8px;">📝</span> <small style="color: #666;">${source}</small> </div> <h3><a href="${link}" target="_blank" style="text-decoration: none; color: inherit;">${title}</a></h3> <p>${description}</p> <div class="post-date">${date}</div> </div>`;

```
if (feedContainer.querySelector('.loading')) {
    feedContainer.innerHTML = postHTML;
} else {
    feedContainer.insertAdjacentHTML('afterbegin', postHTML);
}
```

}

// 使用例（手動で記事を追加したい場合）:
// addManualPost(
//     “記事のタイトル”,
//     “https://note.com/your-article-url”,
//     “記事の概要説明…”,
//     “What’s Next”,
//     “2025年8月24日”
// );
