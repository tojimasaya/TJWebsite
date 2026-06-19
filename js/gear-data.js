const gearData = {
  "updated_at": "2025-12-10T00:00:00Z",
  "categories": {
    "camera": {
      "title": "Camera",
      "subtitle": "ボディ／レンズ",
      "hero_image": "assets/images/gear/m2.jpg",
      "description": "撮影旅行に持っていきやすい機材群。LeicaとFujifilmを中心に運用。",
      "items": [
        {
          "id": "leica-m10",
          "name": "Leica M10",
          "brand": "Leica",
          "image": "assets/images/gear/m10.jpg",
          "status": "available",
          "type": "body",
          "specs": ["24MP Full Frame", "Rangefinder", "M-Mount"],
          "description": "デジタルMの中でもフィルム機にもっとも近いサイズ感を持つ世代のM10。24MPセンサーと素直な色再現で、レンジファインダーらしい“光を読んで合わせる”撮影感覚を保ちながら、現代的なダイナミックレンジと高感度耐性を備えている。",
          "links": {
            "note": "https://note.com/tojimasaya/m/m7f56444c7b97",
            "official": "https://leica-camera.com/ja-JP/photography/cameras/m/m10-black/details"
          }
        },
        {
          "id": "leica-sl2s",
          "name": "Leica SL2-S",
          "brand": "Leica",
          "image": "assets/images/gear/sl2s.jpg",
          "status": "available",
          "type": "body",
          "specs": ["24.6MP BSI CMOS", "L-Mount", "5-axis IBIS"],
          "description": "24.6MPのBSIセンサーと5軸IBISを備えたフルサイズミラーレス。解像力よりも階調と高感度耐性を重視したチューニングで、暗所や動画撮影の“保険”として頼りになるボディ。",
          "links": {
            "official": "https://leica-camera.com/ja-JP/photography/cameras/sl/sl2-s-reporter/technical-specification"
          }
        },
        {
          "id": "leica-m2",
          "name": "Leica M2",
          "brand": "Leica",
          "image": "assets/images/gear/m2.jpg",
          "status": "available",
          "type": "body",
          "specs": ["Mechanical", "0.72x Viewfinder", "M-Mount"],
          "description": "1958年登場の完全機械式Mボディ。露出計を持たず、絞り・シャッター・距離を自分で決めて撮る“レンジファインダーの基本形”。0.72倍ファインダーには35/50/90mm枠が入る。",
          "links": {
            "manual": "https://www.cameramanuals.org/leica_pdf/leica_m2.pdf"
          }
        },
        {
          "id": "leica-c-typ112",
          "name": "Leica C (Typ 112)",
          "brand": "Leica",
          "image": "assets/images/gear/leica_c.jpg",
          "status": "unused",
          "type": "body",
          "specs": ["1/1.7-inch Sensor", "12.1MP", "F2.0-5.9"],
          "description": "コンパクトなボディに詰まった、ライカの哲学。",
          "links": {}
        },
        {
          "id": "leica-d-lux-typ109",
          "name": "Leica D-LUX (Typ 109)",
          "brand": "Leica",
          "image": "assets/images/gear/leica_d-lux.jpg",
          "status": "unused",
          "type": "body",
          "specs": ["4/3-inch Sensor", "12.8MP", "F1.7-2.8"],
          "description": "大型センサーと明るいレンズを持つ、本格的なコンパクトカメラ。",
          "links": {}
        },
        {
          "id": "summilux-35-fle",
          "name": "Summilux-M 35mm f/1.4 ASPH (11663)",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/summilux-35-fle.jpg",
          "status": "available",
          "type": "lens",
          "mount": "M",
          "specs": ["35mm F1.4 ASPH FLE", "#11663", "9枚5群", "最短0.7m", "320g", "2011年製造"],
          "description": "2011年製 Ver.2。FLE（フローティングエレメント）搭載の現代ルクス。近接から無限遠まで安定したシャープネスを保ちながら、開放では柔らかな空気感を残す。FLEにより最短距離付近の描写が大きく改善され、絞ればキレ味が立ち、開放では淡くとろけるボケが生まれる。そのバランスの良さから、M10との相性も抜群。旅先で一本だけ選ぶなら、最も信頼を置くレンズ。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=35mm_f/1.4_ASPH.fle_Summilux-M"
          }
        },
        {
          "id": "summilux-50-v2",
          "name": "Summilux-M 50mm f/1.4 第2世代 後期型",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/summilux-50.jpg",
          "status": "available",
          "type": "lens",
          "mount": "M",
          "specs": ["50mm F1.4 Vintage", "#11114", "7枚5群", "最短1.0m", "275g", "1973年製造"],
          "description": "1973年製造。柔らかな輪郭、滲むハイライト、クラシカルなボケ味。球面レンズ構成による、現行ASPHにはない優しい描写。逆光ではフレアが乗ることもあるが、その不完全さこそが雰囲気を作る。人物でも風景でも、画面にノスタルジックな湿度を加えてくれる一本。オールドルクス特有の甘さと空気感が魅力。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=50mm_f/1.4_Summilux-M_II"
          }
        },
        {
          "id": "elmarit-28-v4",
          "name": "Elmarit-M 28mm f/2.8 第4世代",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/elmarit-28.jpg",
          "status": "available",
          "type": "lens",
          "mount": "M",
          "specs": ["28mm F2.8 Compact", "#11606", "8枚6群", "最短0.7m", "180g", "2009年製造"],
          "description": "コンパクトで軽量。M型の28mmといえばこれ、と言われるほど完成度の高い常用広角。小さな鏡胴に均質な描写性能が収まり、開放から周辺まで安定してシャープ。スナップでは軽快そのもので、M10につけたまま街を歩くと視界そのままを写し取るような感覚になる。旅の荷物を少なくしたいとき、必ず選ぶレンズ。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=28mm_f/2.8_ASPH_Elmarit-M"
          }
        },
        {
          "id": "tri-elmar",
          "name": "Tri-Elmar-M 16\u201318\u201321mm f/4 ASPH (11626)",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/tri-elmar.jpg",
          "status": "available",
          "type": "lens",
          "mount": "M",
          "specs": ["16/18/21mm F4.0 ASPH", "#11626", "10枚7群", "最短0.5m", "335g", "2012年製造"],
          "description": "超広角で三つの焦点距離を切り替えられるWATE（Wide-Angle Tri-Elmar）。単焦点並みの描写を保ちながら、超広角の運用を驚くほどシンプルにしてくれる。光学性能は非常に高く、歪曲の少ない端正な広角描写。16mmで迫力を出し、18mmでバランスを取り、21mmで街を記録する。視点の切り替えがダイヤル一つで済むため、旅先の建築撮影や風景撮影で重宝している。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=16mm-18mm-21mm_f/4_ASPH_Tri-Elmar-M"
          }
        },
        {
          "id": "summarit-75",
          "name": "Summarit-M 75mm f/2.5",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/summarit-75.jpg",
          "status": "available",
          "type": "lens",
          "mount": "M",
          "specs": ["75mm F2.5", "#11645", "6枚4群", "最短0.9m", "345g", "2007年製造"],
          "description": "2007-2014年製造モデル。11枚羽根の美しいボケ。中望遠の距離感は、街中での切り取りやポートレートに独特の空気感を生む。f/2.5という絞り値は、開放から安定したシャープネスと適度なボケ量のバランスが絶妙。M型レンジファインダーで扱える焦点距離の上限に近く、視野角の狭さが逆に被写体との対話を深めてくれる。",
          "links": {}
        },
        {
          "id": "planar-50-zm",
          "name": "Carl Zeiss Planar T* 2/50 ZM",
          "brand": "Carl Zeiss",
          "image": "assets/images/gear/lenses/carlzeiss-50.jpg",
          "status": "available",
          "type": "lens",
          "mount": "M",
          "specs": ["50mm F2.0", "6枚4群", "最短0.7m", "210g", "E43"],
          "description": "4群6枚の対称型プラナー設計。ツァイスの伝統的な光学思想が詰まった一本。極めて高い解像度と、画面全体にわたる均等な光量分布が特徴。フレアやゴーストを徹底的に抑えたT*コーティングにより、逆光でも安定した描写。開放F2.0から中央はシャープで、絞ればさらにキレが増す。ライカの50mmとは異なる、理知的で端正な画作りが魅力。コンパクトで軽量なため、スナップでも気軽に使える。",
          "links": {}
        },
        {
          "id": "sigma-24-70-dgdn",
          "name": "Sigma 24-70mm F2.8 DG DN Art",
          "brand": "Sigma",
          "image": "assets/images/gear/lenses/sigma.jpg",
          "status": "available",
          "type": "lens",
          "mount": "L",
          "specs": ["24\u201370mm F2.8", "DG DN Art", "19枚15群", "約835g"],
          "description": "Lマウント唯一の大口径標準ズーム。Artラインの高い光学性能を持ち、24mmから70mmまでズーム全域で安定した解像力を発揮する。動画でも静止画でも頼れる万能性があり、旅先ではこれ一本で完結することも多い。防塵防滴構造と高速・静音AFで実用性も申し分ない。",
          "links": {}
        },
        {
          "id": "elmarit-r-180",
          "name": "Elmarit-R 180mm f/2.8 (2-CAM)",
          "brand": "Leica",
          "image": "assets/images/gear/elmarit-r-180.jpg",
          "status": "available",
          "type": "lens",
          "mount": "R",
          "specs": ["180mm F2.8", "2-CAM", "R-Mount", "v1"],
          "description": "1970年前後のライカ黄金期を支えた望遠レンズ。第1世代（v1）の2-CAMモデルで、現行のAPOレンズのような鋭さとは対照的に、太く安定した線と豊かな階調、そしてライカらしい深い発色が特徴。",
          "links": {}
        },
        {
          "id": "extender-r-2x",
          "name": "Leica Extender-R 2x",
          "brand": "Leica",
          "image": "assets/images/gear/elmarit-r-180.jpg",
          "status": "available",
          "type": "lens",
          "mount": "R",
          "specs": ["2x Teleconverter", "R-Mount"],
          "description": "Rレンズ専用の2倍テレコンバーター。Elmarit-R 180mmに装着することで「360mm f5.6」の超望遠レンズとして運用が可能に。180mmとの組み合わせで、遠景の圧縮効果をさらに強調したい際に使用。純正ならではの整合性の高さが魅力。",
          "links": {}
        },
        {
          "id": "r-m-adapters",
          "name": "R-Adapter M + M-Adapter L",
          "brand": "Leica",
          "image": "assets/images/gear/adapters/r-adapter-m.jpg",
          "status": "available",
          "type": "adapter",
          "specs": ["R→M変換 #14167", "M→L変換 #18771", "6-bit対応"],
          "description": "RレンズをあえてMに変換し、さらにSLへ——ライカ・システムを横断する贅沢な組み合わせ。R-Adapter M（14167）でRマウントレンズをMボディに、M-Adapter L（18771）でMレンズをSL（Lマウント）ボディに装着する。2つを重ねることで、Rレンズの資産をSL2-Sで活用できる。M-Adapter Lは電子接点を備え6ビットコードの読み取りにも対応。",
          "links": {}
        },
        {
          "id": "r-on-sl2s",
          "name": "SL2-S + R-Adapter M + M-Adapter L + Elmarit-R 180mm",
          "brand": "Leica",
          "image": "assets/images/gear/adapters/r-on-sl2s.jpg",
          "status": "available",
          "type": "adapter",
          "specs": ["R→M→L マウント変換", "実装例"],
          "description": "SL2-SにM-Adapter LとR-Adapter Mを重ね、その先にElmarit-R 180mm f/2.8を装着した実際の運用例。3世代のマウントを純正アダプターで繋ぐことで、1970年代のRレンズが現代のミラーレスで蘇る。",
          "links": {}
        }
      ]
    },
    "drone": {
      "title": "Drone",
      "subtitle": "軽量ドローンとFPV中心",
      "hero_image": "assets/images/gear/drone.jpg",
      "description": "DJI Miniシリーズで機動力と画質を両立。",
      "items": [
        {
          "id": "dji-mini-5-pro",
          "name": "DJI Mini 5 Pro",
          "brand": "DJI",
          "image": "assets/images/gear/mini5pro.jpg",
          "status": "available",
          "specs": ["1-inch Sensor", "Lossless 2x Zoom"],
          "description": "Mini 5 Pro 初フライトは日本の紅葉を撮影、でもちょっと早すぎたかな",
          "links": {
             "Note": "https://drone.jp/column/20251117152032121873.html"
          }
        },
        {
          "id": "dji-neo",
          "name": "DJI Neo",
          "brand": "DJI",
          "image": "assets/images/gear/djineo.jpg",
          "status": "available",
          "specs": ["249g未満", "4K/60fps"],
          "description": "小さくて可愛いドローン。コントローラなしで手のひらから飛ばすこともできるし、ゴーグルを使ってFPV的に飛ばすことも可能",
          "links": {
            "Review": "https://drone.jp/news/2024090522010796961.html"
          }
        },
        {
          "id": "dji-neo2",
          "name": "DJI Neo 2",
          "brand": "DJI",
          "image": "assets/images/gear/neo2.jpg",
          "status": "available",
          "specs": ["249g未満", "Gesture Control"],
          "description": "Neoの後継ドローンを深圳DJIにて購入。ジェスチャーでの操作が楽しい。コントローラなしで十分楽しめます。",
          "links": {
             "Note": "https://drone.jp/column/20251113211015121785.html"
          }
        },
        {
          "id": "dji-avata2",
          "name": "DJI Avata 2",
          "brand": "DJI",
          "image": "assets/images/gear/avata2.jpg",
          "status": "available",
          "specs": [">250g", "4K/60fps", "D-Log M"],
          "description": "初代Avataは駄目でしたが、二代目になって日本でも飛行可能に！没入感のある飛行体験。",
          "links": {
            "Review": "https://drone.jp/column/2024041122201885883.html"
          }
        },
        {
          "id": "dji-mini-4-pro",
          "name": "DJI Mini 4 Pro",
          "brand": "DJI",
          "image": "assets/images/gear/mini4pro.jpg",
          "status": "available",
          "specs": ["249g未満", "4K/60fps"],
          "description": "DJI Mini 5 Proが250gを数グラム超え、国によっては登録必要ということで、２台体制でいくことに。",
          "links": {
            "Review": "https://drone.jp/column/2023092522000773147.html"
          }
        }
      ]
    },
    "editing": {
      "title": "Daily Drivers",
      "subtitle": "毎日使う定番機材",
      "hero_image": "assets/images/gear/editing.jpg",
      "description": "Mac／iPad／iPhoneを中心に、毎日を支える常用デジタル。出先でも完結できる環境。",
      "items": [
        {
          "id": "macbook-pro-14-m3",
          "name": "MacBook Pro 14\" (M3)",
          "brand": "Apple",
          "image": "assets/images/gear/macbookpro14m3.jpg",
          "status": "available",
          "specs": ["M3 Pro", "18GB RAM", "512GB SSD"],
          "description": "Macbook 14インチにした理由は、何インチにしたところで見えないのは一緒、27インチ以上の外部モニターなしではなにも見えないローガンズの宿命。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/n57968ed8d4ae"
          }
        },
        {
          "id": "iphone-17-pro",
          "name": "iPhone 17 Pro",
          "brand": "Apple",
          "image": "assets/images/gear/iphone17pro.jpg",
          "status": "available",
          "specs": ["512GB", "Blue Titanium"],
          "description": "iPhone 17 Pro は「信頼を軸にしたメイン携帯」なんだけど、「写真もきちんとこなす頼もしい相棒」。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/nd229cd856751"
          }
        },
        {
          "id": "xiaomi-17-ultra",
          "name": "Xiaomi 17 Ultra by Leica",
          "brand": "Xiaomi",
          "image": "assets/images/gear/xiaomi17ultra.jpg",
          "status": "available",
          "specs": ["Leica 監修カメラ", "LOFIC センサー", "フレイムモード"],
          "description": "山根さんから譲り受けた現行メイン機。ライカ監修のカメラに加え、強い光源を「炎」と認識して白飛びを抑えるフレイムモード（LOFICセンサー）が独特。篝火や夜景の難しい光も、シャッターを押すだけで最適解に仕上げてくれる。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/n748641edca32"
          }
        },
        {
          "id": "oppo-find-n5",
          "name": "OPPO Find N5",
          "brand": "OPPO",
          "image": "assets/images/gear/oppofindn5.jpg",
          "status": "available",
          "specs": ["Foldable", "16GB RAM"],
          "description": "AndroidはAppleのエコシステムに入れないという先入観を完全否定されました。Find N5はAirdrop的ファイルシェアが可能です。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/n82331875d2b8"
          }
        }
      ]
    },
    "accessories": {
      "title": "Accessories",
      "subtitle": "充電・マウント・収納など",
      "hero_image": "assets/images/gear/accessories.jpg",
      "description": "旅を快適にしてくれるアクセサリー。",
      "items": [
        {
          "id": "acasis-ssd",
          "name": "ACASIS SSD Hub",
          "brand": "ACASIS",
          "image": "assets/images/gear/acasis.jpg",
          "status": "available",
          "specs": ["MagSafe", "M.2 SSD Slot"],
          "description": "Macbookでもスマートフォンでも利用可能な高速SSD内蔵 多機能HUB。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/ne60ce62cf179"
          }
        },
        {
          "id": "pgytech-magcam",
          "name": "PGYTECH MagCam Grip",
          "brand": "PGYTECH",
          "image": "assets/images/gear/pgytech_magcam.jpg",
          "status": "available",
          "specs": ["MagSafe", "Bluetooth Shutter"],
          "description": "iPhoneを“カメラ化”する革命的小物。",
          "links": {}
        },
        {
          "id": "peak-design-wrist-strap",
          "name": "Peak Design リストストラップ CRS-WR-DS-1",
          "brand": "Peak Design",
          "image": "assets/images/gear/peak-design-wrist-strap.jpg",
          "status": "available",
          "specs": ["リストストラップ", "Anchor Link", "CRS-WR-DS-1"],
          "description": "Peak Designのアンカーリンク式リストストラップ。カメラを手首で支えながら、必要なときはワンタッチで着脱できる。M型ライカや小型カメラを身軽に持ち歩くときの安全策として使いやすい。",
          "links": {
             "Amazon": "https://amzn.to/4gv45Kk"
          }
        },
        {
          "id": "cio-novawave",
          "name": "CIO NovaWave 3way",
          "brand": "CIO",
          "image": "assets/images/gear/cio_novawave.jpg",
          "status": "available",
          "specs": ["Type-C", "Apple Watch Charger"],
          "description": "iPhone、Apple Watch、AirPodsの３つを充電できるスグレモノ。ただ別途USB充電器が必要なことに注意。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/n7e6bcdb29165"
          }
        },
        {
          "id": "mcdodo-67w",
          "name": "Mcdodo 67W GaN Charger",
          "brand": "Mcdodo",
          "image": "assets/images/gear/mcdodo67wcharger.jpg",
          "status": "available",
          "specs": ["67W", "GaN"],
          "description": "NovaWave 3wayとペアで使うと最強。コンパクトでハイパワー。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/n7e6bcdb29165"
          }
        }
      ]
    },
    "bags": {
      "title": "Bags",
      "subtitle": "旅を運ぶ Peak Design",
      "hero_image": "assets/images/gear/bags/bags-hero.jpg",
      "description": "撮影旅行の荷物を運ぶ Peak Design。母艦・分割・ローラーを使い分けて、香港と日本、ときどき旅先を移動する。",
      "items": [
        {
          "id": "pd-travel-2in1",
          "name": "Peak Design Travel Backpack 2-in-1 40L",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-2in1.jpg",
          "status": "available",
          "type": "backpack",
          "specs": ["40L（合体30+10 / 分離34+16）", "Sage", "機内持ち込み", "親子で分割"],
          "description": "34Lのベースと16Lのデイパックが、背面ジッパー一本で脱着する“親子”構造。合体すれば40Lの機内持ち込み、切り離せば身軽なデイパックになる。2026年のKickstarterで手に入れた、いまの旅の母艦。",
          "links": { "official": "https://www.peakdesign.com/products/travel-backpack-2-in-1" }
        },
        {
          "id": "pd-roller-pro",
          "name": "Peak Design Roller Pro Carry-On",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/roller-pro.jpg",
          "status": "available",
          "type": "roller",
          "specs": ["34–39L 拡張", "Eclipse", "ドローブリッジ開き", "カーボントロリー"],
          "description": "前ヒンジのドローブリッジ式に開くキャリーオン。薄いカーボントロリーで容量を稼ぎ、34〜39Lの中にカメラキューブやパッキングキューブをそのまま収める。2-in-1の相棒として導入した。",
          "links": { "amazon": "https://www.amazon.co.jp/dp/B0FDHWRSM3?tag=ojunktion-22" }
        },
        {
          "id": "pd-travel-45l",
          "name": "Peak Design Travel Backpack 45L",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-45l.jpg",
          "status": "available",
          "type": "backpack",
          "specs": ["35–45L 可変", "Sage", "2018〜", "旧メイン"],
          "description": "2018年のKickstarterから約8年使い続けた、旅のメイン機。35〜45Lの可変容量と複数のインナーで“大概のものが入る”母艦。新しい2-in-1に主役を譲りつつ、いまも現役。",
          "links": { "amazon": "https://www.amazon.co.jp/dp/B0DDL6K3XL?tag=ojunktion-22" }
        },
        {
          "id": "pd-everyday-backpack-zip-15l-midnight",
          "name": "Peak Design Everyday Backpack Zip 15L",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-everyday-backpack-zip-15l-midnight.jpg",
          "status": "available",
          "type": "backpack",
          "specs": ["15L", "Midnight", "サイドアクセス", "街歩き・小型撮影"],
          "description": "Everyday Backpackの機能を、よりシンプルで目立たないジップ仕様にした15Lモデル。街歩きや身軽な撮影にちょうどいいサイズ感で、日常持ちにもカメラバッグにも振れる。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/everyday-backpack-zip?Size=15L&Color=Midnight" }
        },
        {
          "id": "pd-everyday-totepack-20l-black",
          "name": "Peak Design Everyday Totepack 20L",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-everyday-totepack-20l-black.jpg",
          "status": "available",
          "type": "totepack",
          "specs": ["20L", "Black", "トート/バックパック", "FlexFold Divider"],
          "description": "トートの気軽さとバックパックの機動力を一つにした20Lモデル。カメラも日用品も入れやすく、持ち方を切り替えられるので移動の多い日に使いやすい。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/everyday-totepack?Size=20L&Color=Black" }
        },
        {
          "id": "pd-camera-cube-v2-xsmall-black",
          "name": "Peak Design Camera Cube V2 X-Small",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-camera-cube-v2-xsmall-black.jpg",
          "status": "available",
          "type": "camera-cube",
          "specs": ["X-Small", "Black", "V2", "小型カメラ用"],
          "description": "小型カメラやレンズを必要最小限で守るCamera Cube V2。バッグの中に小さな撮影区画を作りたいときに便利なサイズ。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/camera-cube?Size=X-Small&Color=Black" }
        },
        {
          "id": "pd-camera-cube-v2-small-black",
          "name": "Peak Design Camera Cube V2 Small",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-camera-cube-v2-small-black.jpg",
          "status": "available",
          "type": "camera-cube",
          "specs": ["Small", "Black", "V2", "カメラ収納"],
          "description": "カメラ一式をほどよくまとめるSmallサイズのCamera Cube V2。仕切りを組み替えながら、旅バッグの中を撮影機材用に整えられる。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/camera-cube?Size=Small&Color=Black" }
        },
        {
          "id": "pd-camera-cube-v2-medium-black",
          "name": "Peak Design Camera Cube V2 Medium",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-camera-cube-v2-medium-black.jpg",
          "status": "available",
          "type": "camera-cube",
          "specs": ["Medium", "Black", "V2", "複数機材向け"],
          "description": "複数のボディやレンズをまとめて運ぶMediumサイズのCamera Cube V2。Travel Backpack系の母艦に入れて、機材量が多い移動に使う。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/camera-cube?Size=Medium&Color=Black" }
        },
        {
          "id": "pd-tech-pouch-regular-black",
          "name": "Peak Design Tech Pouch Regular",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-tech-pouch-regular-black.jpg",
          "status": "available",
          "type": "pouch",
          "specs": ["Regular", "Black", "ケーブル整理", "ガジェット収納"],
          "description": "ケーブル、充電器、SSDなど細かいガジェット類をまとめて運ぶTech Pouch。バッグの中で散らばりがちな小物を一つの区画に集約できる。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/tech-pouch?Size=Regular&Color=Black" }
        },
        {
          "id": "pd-packable-tote-sage",
          "name": "Peak Design Packable Tote",
          "brand": "Peak Design",
          "image": "assets/images/gear/bags/pd-packable-tote-sage.jpg",
          "status": "available",
          "type": "tote",
          "specs": ["Sage", "折りたたみ", "軽量トート", "旅先サブバッグ"],
          "description": "小さく畳んで持ち歩けるPeak DesignのPackable Tote。旅先で荷物が増えたときや、近所への買い物、ホテル周りの軽い外出に使いやすい。",
          "links": { "official": "https://www.peakdesign.com/en-jp/products/packable-tote?Color=Sage" }
        },
        {
          "id": "alpaka-elements-tote-m",
          "name": "ALPAKA Elements Tote M",
          "brand": "ALPAKA",
          "image": "assets/images/gear/bags/alpaka-elements-tote-m.jpg",
          "status": "available",
          "type": "tote",
          "specs": ["14.5L", "約600g", "折りたたみ可能", "旅先サブバッグ"],
          "description": "軽量で簡単に畳めるトート。キャリーケースに入れておき、旅先で荷物が増えたときや街歩き用のサブバッグとして使うことが多い。",
          "links": { "official": "https://www.alpakagear.jp/view/item/000000000031" }
        },
        {
          "id": "alpaka-metro-tote",
          "name": "ALPAKA Metro Tote",
          "brand": "ALPAKA",
          "image": "assets/images/gear/bags/alpaka-metro-tote.jpg",
          "status": "available",
          "type": "tote",
          "specs": ["ジッパー開閉", "ラゲッジパススルー", "16インチPC対応", "約900g"],
          "description": "上部にジッパーがあるので旅行時はこちらが安心。キャリーバッグのハンドルに差し込めるラゲッジパススルー付きなのも良く、移動中の使い勝手が高い。",
          "links": { "official": "https://www.alpakagear.jp/view/item/000000000045" }
        }
      ]
    }
  }
};
