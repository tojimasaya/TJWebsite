// 全機材データをここで一元管理します
const gearData = {
    categories: {
        camera: {
            items: [
                {
                    name: "Leica M10",
                    image: "assets/images/gear/m10.jpg",
                    description: "メインのレンジファインダー機。デジタルでありながら、機械式カメラの魂を感じる一台。",
                    specs: ["24MP Full Frame", "Rangefinder", "M-Mount"],
                    links: { official: "https://leica-camera.com" }
                },
                {
                    name: "Leica SL2-S",
                    image: "assets/images/gear/sl2s.jpg",
                    description: "動画撮影やEVFが必要な場面での頼れる相棒。Mレンズの母艦としても優秀。",
                    specs: ["24MP BSI CMOS", "L-Mount", "4K Video"],
                    links: { official: "https://leica-camera.com" }
                },
                {
                    name: "Xiaomi 15 Ultra",
                    image: "assets/images/gear/xiaomi15.jpg",
                    description: "スナップシューターとしてのスマホ。ライカ監修のカラーサイエンスが素晴らしい。",
                    specs: ["1-inch Sensor", "Leica Optics", "Android"],
                    links: { note: "https://note.com/tojimasaya" }
                },
                {
                    name: "Summilux-M 50mm f/1.4 ASPH.",
                    image: "assets/images/gear/50lux.jpg",
                    description: "標準レンズの最高峰。開放でのクリーミーなボケと、絞った時の鋭い解像感。",
                    specs: ["M-Mount", "f/1.4", "Standard"],
                    links: { official: "https://leica-camera.com" }
                },
                {
                    name: "Wide-Tri-Elmar-M 16-18-21mm",
                    image: "assets/images/gear/wate.jpg",
                    description: "広角域を一本でカバーするWATE。風景撮影には欠かせない一本。",
                    specs: ["M-Mount", "f/4.0", "Wide Angle"],
                    links: { official: "https://leica-camera.com" }
                }
            ]
        },
        drone: {
            items: [
                {
                    name: "DJI Mavic 3 Pro",
                    image: "assets/images/gear/mavic3pro.jpg",
                    description: "3眼カメラ搭載のフラッグシップ。Hasselbladカメラの描写力は圧巻。",
                    specs: ["4/3 CMOS", "3 Cameras", "43min Flight"],
                    links: { official: "https://www.dji.com", note: "https://note.com/tojimasaya" }
                },
                {
                    name: "DJI Mini 4 Pro",
                    image: "assets/images/gear/mini4pro.jpg",
                    description: "249g未満のサブ機。旅先で気軽に飛ばせる機動力が魅力。",
                    specs: ["<249g", "4K/60fps", "Vertical Shooting"],
                    links: { official: "https://www.dji.com" }
                },
                {
                    name: "DJI RC 2",
                    image: "assets/images/gear/rc2.jpg",
                    description: "スクリーン付き送信機。スマホを接続する手間がなく、すぐに飛行開始できる。",
                    specs: ["5.5-inch FHD", "O4 Transmission"],
                    links: { official: "https://www.dji.com" }
                }
            ]
        },
        editing: {
            items: [
                {
                    name: "iPad Pro 12.9 (M2)",
                    image: "assets/images/gear/ipad.jpg",
                    description: "旅先での現像・編集のメインマシン。LightroomとDaVinci Resolveが快適に動く。",
                    specs: ["M2 Chip", "Liquid Retina XDR", "2TB"],
                    links: { official: "https://www.apple.com" }
                },
                {
                    name: "MacBook Pro 14 (M3 Max)",
                    image: "assets/images/gear/macbook.jpg",
                    description: "自宅での重い動画編集や大量のRAW現像に使用。",
                    specs: ["M3 Max", "64GB RAM", "4TB SSD"],
                    links: { official: "https://www.apple.com" }
                },
                {
                    name: "Adobe Lightroom",
                    image: "assets/images/gear/lr.jpg",
                    description: "写真管理と現像のコアツール。クラウド同期でどこでも編集。",
                    specs: ["Photo Editing", "Cloud Sync"],
                    links: { official: "https://www.adobe.com" }
                }
            ]
        },
        accessories: {
            items: [
                {
                    name: "Peak Design Travel Tripod",
                    image: "assets/images/gear/tripod.jpg",
                    description: "驚くほどコンパクトに畳めるカーボン三脚。旅の必需品。",
                    specs: ["Carbon Fiber", "Compact", "Lightweight"],
                    links: { official: "https://www.peakdesign.com" }
                },
                {
                    name: "WANDRD PRVKE 21L",
                    image: "assets/images/gear/bag.jpg",
                    description: "機能性とデザインを両立したカメラバッグ。ロールトップで容量拡張も可能。",
                    specs: ["21L", "Weather Resistant", "Camera Cube"],
                    links: { official: "https://www.wandrd.com" }
                },
                {
                    name: "Leica Visoflex 2",
                    image: "assets/images/gear/visoflex.jpg",
                    description: "M10/M11用の外付けEVF。ローアングル撮影や望遠レンズ使用時に活躍。",
                    specs: ["3.7MP OLED", "90° Tilt", "GPS"],
                    links: { official: "https://leica-camera.com" }
                }
            ]
        }
    }
};
