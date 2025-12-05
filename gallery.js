/**
 * gallery.js - JSON Driven Masonry Gallery
 * Enhanced: Modal shows full information
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
        const html = items.map((item, index) => createGalleryItemHTML(item, index)).join('');
        
        // 挿入
        container.innerHTML = html;

    } catch (error) {
        console.error('Gallery Error:', error);
        container.innerHTML = '<p style="text-align:center">ギャラリーの読み込みに失敗しました。</p>';
    }
}

// 個別のアイテムHTMLを生成
function createGalleryItemHTML(item, index) {
    const categories = item.category.join(' ');
    
    // タイトルに「'」が含まれているとエラーになるのでエスケープ処理
    const safeTitle = item.title.replace(/'/g, "\\'");
    const safeDesc = item.description ? item.description.replace(/'/g, "\\'") : "";
    const safeLocation = item.location ? item.location.replace(/'/g, "\\'") : "";
    const safeDate = item.date ? item.date.replace(/'/g, "\\'") : "";
    
    // noteリンクがある場合
    const noteLinkHtml = item.noteUrl ? `
        <div class="gallery-note">
            <a href="${item.noteUrl}" target="_blank" class="note-link">
                📖 関連記事：「${item.noteTitle}」
            </a>
        </div>` : '';

    // 動画 (Video) の場合
    if (item.type === 'video') {
        return `
        <article class="gallery-item video" data-category="${categories}">
            <div class="gallery-media">
                <iframe src="https://www.youtube.com/embed/${item.youtubeId}" 
                        title="${item.title}" loading="lazy" allowfullscreen></iframe>
                <button class="play-overlay" 
                        aria-label="拡大して再生"
                        onclick="openVideo('${item.youtubeId}', '${safeTitle}')"></button>
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
    
    // 写真 (Photo) の場合
    else {
        // データをJSON形式でdata属性に埋め込む（モーダル用）
        const itemData = JSON.stringify({
            image: item.image,
            title: item.title,
            description: item.description,
            location: item.location,
            date: item.date,
            noteUrl: item.noteUrl || '',
            noteTitle: item.noteTitle || ''
        });
        
        return `
        <article class="gallery-item photo" 
                 data-category="${categories}"
                 data-item='${itemData.replace(/'/g, "&#39;")}'
                 onclick="openModalWithInfo(this)">
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

// フィルター機能
function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const galleryItems = document.querySelectorAll('.gallery-item');
            
            galleryItems.forEach(item => {
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

// 写真モーダルを開く（全情報付き）
function openModalWithInfo(element) {
    const itemData = JSON.parse(element.getAttribute('data-item'));
    
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    
    // noteリンクがあれば表示
    const noteLinkHtml = itemData.noteUrl ? `
        <div class="modal-note">
            <a href="${itemData.noteUrl}" target="_blank" class="note-link">
                📖 関連記事：「${itemData.noteTitle}」
            </a>
        </div>` : '';
    
    modalContent.innerHTML = `
        <img src="${itemData.image}" alt="${itemData.title}" class="modal-image">
        <div class="modal-info">
            <h2 class="modal-title">${itemData.title}</h2>
            <p class="modal-description">${itemData.description}</p>
            <div class="modal-meta">
                <span class="modal-location">${itemData.location}</span>
                <span class="modal-date">${itemData.date}</span>
            </div>
            ${noteLinkHtml}
        </div>
    `;
    
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
