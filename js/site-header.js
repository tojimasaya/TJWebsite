document.addEventListener('DOMContentLoaded', () => {
    // 現在のページファイル名を取得
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";

    // ナビゲーションのHTML構造
    // ページごとにスタイルを変えられるよう、クラス名は既存のCSSと一致させます
    const navHtml = `
    <nav class="main-nav">
        <div class="nav-container">
            <a href="index.html" class="nav-logo">TOJIMASAYA</a>
            <button class="nav-toggle" id="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
            <ul class="nav-menu" id="nav-menu">
                <li><a href="index.html" class="nav-link ${page === 'index.html' ? 'active' : ''}">Home</a></li>
                <li><a href="about.html" class="nav-link ${page === 'about.html' ? 'active' : ''}">About</a></li>
                <li><a href="gallery.html" class="nav-link ${page === 'gallery.html' ? 'active' : ''}">Gallery</a></li>
                <!-- 白鷺三十六景リンク -->
                <li>
                    <a href="shirasagi36.html" class="nav-link featured-link ${page.includes('shirasagi') ? 'active' : ''}">
                        <span class="icon">🏯</span> 白鷺三十六景
                    </a>
                </li>
                <!-- Gear関連ページならActive -->
                <li><a href="gear.html" class="nav-link ${page.includes('gear') ? 'active' : ''}">Gear</a></li>
                <li><a href="writings.html" class="nav-link ${page === 'writings.html' ? 'active' : ''}">Writings</a></li>
                <!-- Hong Kong関連ページならActive -->
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
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
});
