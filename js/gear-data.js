// gear.json の内容をJavaScriptオブジェクトとして定義
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
          "price": null,
          "specs": [
            "24MP Full Frame",
            "Rangefinder",
            "M-Mount"
          ],
          "description": "デジタルMの中でもフィルム機にもっとも近いサイズ感を持つ世代のM10。24MPセンサーと素直な色再現で、レンジファインダーらしい“光を読んで合わせる”撮影感覚を保ちながら、現代的なダイナミックレンジと高感度耐性を備えている。旅ではこの一台に35mmを付けて歩くことが多い。",
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
          "price": null,
          "specs": [
            "24.6MP BSI CMOS",
            "L-Mount"
          ],
          "description": "24.6MPのBSIセンサーと5軸IBISを備えたフルサイズミラーレス。解像力よりも階調と高感度耐性を重視したチューニングで、暗所や動画撮影の“保険”として頼りになるボディ。高精細EVFとシンプルな操作系のおかげで、Lマウントのズームや単焦点を付け替えながらも、静止画とムービーを同じリズムで扱える。",
          "links": {
            "official": "https://leica-camera.com/ja-JP/photography/cameras/sl/sl2-s-reporter/technical-specification"
          }
        },
        {
          "id": "summilux-35-fle",
          "name": "Summilux-M 35mm f/1.4 ASPH (11663)",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/summilux-35-fle.jpg",
          "status": "available",
          "specs": [
            "35mm F1.4",
            "ASPH FLE"
          ],
          "description": "2011年製 Ver.2。FLE（フローティングエレメント）搭載の現代ルクス。近接から無限遠まで安定したシャープネスを保ちながら、開放では柔らかな空気感を残す。旅先で一本だけ選ぶなら、最も信頼を置くレンズ。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=35mm_f/1.4_ASPH.fle_Summilux-M"
          }
        },
         {
          "id": "tri-elmar",
          "name": "Tri-Elmar-M 16-18-21mm f/4 ASPH",
          "brand": "Leica",
          "image": "assets/images/gear/lenses/tri-elmar.jpg",
          "status": "available",
          "specs": [
            "16/18/21mm F4"
          ],
          "description": "超広角で三つの焦点距離を切り替えられるWATE。単焦点並みの描写を保ちながら、超広角の運用を驚くほどシンプルにしてくれる。旅先の建築撮影や風景撮影で重宝している。",
          "links": {
            "reference": "https://wiki.l-camera-forum.com/leica-wiki.en/index.php?title=16mm-18mm-21mm_f/4_ASPH_Tri-Elmar-M"
          }
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
          "specs": [
            "1-inch Sensor",
            "Lossless 2x Zoom"
          ],
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
          "specs": [
            "<249g",
            "4K/60fps"
          ],
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
          "specs": [
            "<249g",
            "Gesture Control"
          ],
          "description": "Neoの後継ドローンを深圳DJIにて購入。ジェスチャーでの操作が楽しい。最初はコントローラで飛ばそうかと思っていましたが、ジェスチャーで数枚と少しの動画で十分な気がします。",
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
          "specs": [
            ">250g",
            "4K/60fps",
            "D-Log M"
          ],
          "description": "初代Avataは駄目でしたが、二代目になって日本でも飛行可能に！",
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
          "specs": [
            "<249g",
            "4K/60fps"
          ],
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
          "specs": [
            "M3 Pro",
            "18GB RAM",
            "512GB SSD"
          ],
          "description": "Macbook 14インチにした理由は、何インチにしたところで見えないのは一緒、27インチ以上の外部モニターなしではなにも見えないローガンズの宿命",
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
          "specs": [
            "512GB",
            "Blue Titanium"
          ],
          "description": "iPhone 17 Pro は「信頼を軸にしたメイン携帯」なんだけど、「写真もきちんとこなす頼もしい相棒」",
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
          "specs": [
            "16GB RAM",
            "512GB Storage"
          ],
          "description": "iPhone 17 Pro はカメラがぐっと良くなっています、しかしそれでもなお望遠カメラはまだXiaomi 15 Ultraには敵わない、そう気がついて一層 愛情が湧きました。",
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
          "specs": [
            "Foldable",
            "16GB RAM"
          ],
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
          "specs": [
            "MagSafe",
            "M.2 SSD Slot"
          ],
          "description": "Macbookでもスマートフォンでも利用可能な高速SSD内蔵 多機能HUB",
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
          "specs": [
            "MagSafe",
            "Bluetooth Shutter"
          ],
          "description": "iPhoneを“カメラ化”する革命的小物。",
          "links": {}
        },
        {
          "id": "cio-novawave",
          "name": "CIO NovaWave 3way",
          "brand": "CIO",
          "image": "assets/images/gear/cio_novawave.jpg",
          "status": "available",
          "specs": [
            "Type-C",
            "Apple Watch Charger"
          ],
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
          "specs": [
            "67W",
            "GaN"
          ],
          "description": "NovaWave 3wayとペアで使うと最強。コンパクトでハイパワー。",
          "links": {
             "Note": "https://note.com/tojimasaya/n/n7e6bcdb29165"
          }
        }
      ]
    }
  }
};
