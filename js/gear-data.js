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
          "specs": ["35mm F1.4", "ASPH FLE", "M-Mount"],
          "description": "FLE（フローティングエレメント）搭載の現代ルクス。近接から無限遠まで安定したシャープネスを保ちながら、開放では柔らかな空気感を残す。旅先で一本だけ選ぶならこれ。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=35mm_f/1.4_ASPH.fle_Summilux-M"
          }
        },
        {
          "id": "summilux-50-v2",
          "name": "Summilux-M 50mm f/1.4 v2",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/summilux-50.jpg",
          "status": "available",
          "type": "lens",
          "specs": ["50mm F1.4", "Vintage (1973)", "M-Mount"],
          "description": "柔らかな輪郭、滲むハイライト、クラシカルなボケ味。球面レンズ構成による、現行ASPHにはない優しい描写。オールドルクス特有の甘さと空気感が魅力。",
          "links": {}
        },
        {
          "id": "elmarit-28-v4",
          "name": "Elmarit-M 28mm f/2.8 v4",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/elmarit-28.jpg",
          "status": "available",
          "type": "lens",
          "specs": ["28mm F2.8", "Compact", "M-Mount"],
          "description": "コンパクトで軽量。M型の28mmといえばこれ。開放から周辺まで安定してシャープ。スナップでは軽快そのもの。",
          "links": {}
        },
        {
          "id": "tri-elmar",
          "name": "Tri-Elmar-M 16-18-21mm f/4 ASPH",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/tri-elmar.jpg",
          "status": "available",
          "type": "lens",
          "specs": ["16/18/21mm F4", "WATE", "M-Mount"],
          "description": "超広角で三つの焦点距離を切り替えられるWATE。単焦点並みの描写を保ちながら、超広角の運用を驚くほどシンプルにしてくれる。",
          "links": {}
        },
        {
          "id": "summarit-75",
          "name": "Summarit-M 75mm f/2.5",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/summarit-75.jpg",
          "status": "available",
          "type": "lens",
          "specs": ["75mm F2.5", "M-Mount"],
          "description": "11枚羽根の美しいボケ。中望遠の距離感は、街中での切り取りやポートレートに独特の空気感を生む。",
          "links": {}
        },
        {
          "id": "planar-50-zm",
          "name": "Carl Zeiss Planar T* 2/50 ZM",
          "brand": "Carl Zeiss",
          "image": "assets/images/gear/lenses/carlzeiss-50.jpg",
          "status": "available",
          "type": "lens",
          "specs": ["50mm F2.0", "M-Mount Compatible"],
          "description": "極めて高い解像度と、画面全体にわたる均等な光量分布が特徴。ライカの50mmとは異なる、理知的で端正な画作りが魅力。",
          "links": {}
        },
        {
          "id": "sigma-24-70-dgdn",
          "name": "Sigma 24-70mm F2.8 DG DN Art",
          "brand": "Sigma",
          "image": "assets/images/gear/lenses/sigma.jpg",
          "status": "available",
          "type": "lens",
          "specs": ["24-70mm F2.8", "L-Mount", "Art Line"],
          "description": "Lマウント唯一の大口径標準ズーム。Artラインの高い光学性能を持ち、24mmから70mmまでズーム全域で安定した解像力を発揮する。",
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
          "id": "xiaomi-15-ultra",
          "name": "Xiaomi 15 Ultra",
          "brand": "Xiaomi",
          "image": "assets/images/gear/xiaomi15ultra.jpg",
          "status": "available",
          "specs": ["16GB RAM", "512GB Storage"],
          "description": "iPhone 17 Pro はカメラがぐっと良くなっていますが、望遠カメラはまだXiaomi 15 Ultraには敵わない。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/nc12013eb2323"
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
    }
  }
};
