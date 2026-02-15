document.addEventListener('DOMContentLoaded', () => {
    // 現在のページファイル名を取得
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    // ナビゲーションのHTML構造
    const navHtml = `
    <nav class="main-nav" aria-label="メインナビゲーション">
        <div class="nav-container">
            <a href="index.html" class="nav-logo" aria-label="ホームページへ戻る">TOJIMASAYA</a>
            <button class="nav-toggle" id="nav-toggle" aria-label="メニューを開く" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span></button>
            <ul class="nav-menu" id="nav-menu">
                <li><a href="index.html" class="nav-link ${page === 'index.html' ? 'active' : ''}">Home</a></li>
                <li><a href="about.html" class="nav-link ${page === 'about.html' ? 'active' : ''}">About</a></li>
                <li><a href="gallery.html" class="nav-link ${page === 'gallery.html' ? 'active' : ''}">Gallery</a></li>
                <li>
                    <a href="shirasagi36.html" class="nav-link featured-link ${page.includes('shirasagi') ? 'active' : ''}">
                        <span class="icon">🏯</span> 白鷺三十六景
                    </a>
                </li>
                <li><a href="gear.html" class="nav-link ${page.includes('gear') ? 'active' : ''}">Gear</a></li>
                <li><a href="writings.html" class="nav-link ${page === 'writings.html' ? 'active' : ''}">Writings</a></li>
                <!-- <li><a href="trips.html" class="nav-link ${page === 'trips.html' ? 'active' : ''}">Trips</a></li> -->
                <li><a href="hongkong.html" class="nav-link ${page.includes('hongkong') ? 'active' : ''}">Hong Kong</a></li>
            </ul>
        </div>
    </nav>
    `;

    // bodyの先頭に挿入
    document.body.insertAdjacentHTML('afterbegin', navHtml);

    // モバイルメニュートグル機能
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navMenu.classList.contains('active');
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navToggle.setAttribute('aria-label', !isExpanded ? 'メニューを閉じる' : 'メニューを開く');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Escキーでメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-label', 'メニューを開く');
                document.body.style.overflow = '';
            }
        });
    }
});
