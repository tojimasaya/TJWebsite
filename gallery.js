/**
 * gallery.js - JSON Driven Masonry Gallery
 */

document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    setupFilters();
});

// JSONを読み込んでHTML生成
async function loadGallery() {
    const container = document.getElementById('gallery-grid');
    
    if (!container) return;

    // ローディング表示
    container.innerHTML = '<div class="loading">読み込み中...</div>';

    try {
        const response = await fetch('/data/gallery.json');
        if (!response.ok) throw new Error('JSON load failed');
        
        const items = await response.json();
        
        // HTML生成
        const html = items.map(item => createGalleryItemHTML(item)).join('');
        
        // 挿入 (Masonry用のスタイル適用のため、画像ロードを待つ必要は基本ないが、フェードインさせる)
        container.innerHTML = html;

    } catch (error) {
        console.error('Gallery Error:', error);
        container.innerHTML = '<p style="text-align:center">ギャラリーの読み込みに失敗しました。</p>';
    }
}

// 個別のアイテムHTMLを生成
function createGalleryItemHTML(item) {
    const categories = item.category.join(' ');
    
    // noteリンクがある場合
    const noteLinkHtml = item.noteUrl ? `
        <div class="gallery-note">
            <a href="${item.noteUrl}" target="_blank" class="note-link">
                📖 関連記事：「${item.noteTitle}」
            </a>
        </div>` : '';

    // 動画の場合
    if (item.type === 'video') {
        return `
        <article class="gallery-item video" data-category="${categories}">
            <div class="gallery-media">
                <iframe src="https://www.youtube.com/embed/${item.youtubeId}" 
                        title="${item.title}" loading="lazy" allowfullscreen></iframe>
                <button class="play-overlay" 
                        aria-label="拡大して再生"
                        onclick="openVideo('${item.youtubeId}','${item.title}')"></button>
            </div>
            <div class="gallery-info">
                <h3>${item.title}</h3>
                <p class="gallery-description">${item.description}</p>
                <div class="gallery-meta">
                    <span class="gallery-location">${item.location}</span>
                    <span class="gallery-date">${item.date}</span>
                </div>
                ${noteLinkHtml}
            </div>
        </article>`;
    } 
    
    // 写真の場合
    else {
        // モーダル表示用のエスケープ処理
        const modalContent = `<img src='${item.image}' alt='${item.title}' class='modal-image'>`;
        
        return `
        <article class="gallery-item photo" 
                 data-category="${categories}"
                 onclick="openModal(\`${modalContent}\`)">
            <div class="gallery-media">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="gallery-info">
                <h3>${item.title}</h3>
                <p class="gallery-description">${item.description}</p>
                <div class="gallery-meta">
                    <span class="gallery-location">${item.location}</span>
                    <span class="gallery-date">${item.date}</span>
                </div>
                ${noteLinkHtml}
            </div>
        </article>`;
    }
}

// フィルター機能のセットアップ
function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // タブのアクティブ切り替え
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // アイテムの表示・非表示
            const galleryItems = document.querySelectorAll('.gallery-item');
            
            galleryItems.forEach(item => {
                // Masonryレイアウトが崩れないよう、アニメーションクラスを付与
                const categories = item.getAttribute('data-category');
                
                if (filter === 'all' || categories.includes(filter)) {
                    item.classList.remove('hidden');
                    item.classList.add('filtering-in');
                } else {
                    item.classList.remove('filtering-in');
                    item.classList.add('hidden');
                }
            });
        });
    });
}
