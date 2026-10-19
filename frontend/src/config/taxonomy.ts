export interface SubCategory {
  id: string;
  label: string;
  queries: string[];
}

export interface CategoryTaxonomy {
  id: string;
  label: string;
  icon: string;
  description: string;
  subCategories: SubCategory[];
}

export const CATALOG_TAXONOMY: CategoryTaxonomy[] = [
  {
    id: 'mobiles',
    label: 'Mobiles',
    icon: 'Smartphone',
    description: 'Smartphones, 5G phones, feature phones and mobile accessories',
    subCategories: [
      {
        id: 'flagship_smartphones',
        label: 'Flagship Smartphones',
        queries: [
          'Apple iPhone 15 128GB black',
          'Samsung Galaxy S24 Ultra 5G',
          'OnePlus 12 5G smartphone',
          'Google Pixel 8 Pro',
          'iPhone 15 Pro Max natural titanium',
          'Samsung Galaxy Z Fold 5 5G'
        ]
      },
      {
        id: 'budget_5g_phones',
        label: 'Budget 5G Phones',
        queries: [
          'Redmi 13C 5G 128GB',
          'realme P1 5G smartphone',
          'Samsung Galaxy M15 5G',
          'POCO M6 Pro 5G',
          'Moto G34 5G smartphone',
          'Infinix Note 40 5G'
        ]
      },
      {
        id: 'midrange_smartphones',
        label: 'Mid-Range All-Rounders',
        queries: [
          'OnePlus Nord CE4 5G 8GB RAM',
          'Samsung Galaxy M35 5G Moonlight Blue',
          'realme 12 Pro 5G Submarine Blue',
          'Motorola Edge 50 Fusion 5G',
          'iQOO Z9 5G Brushed Green',
          'Nothing Phone 2a 5G'
        ]
      },
      {
        id: 'gaming_phones',
        label: 'Gaming Phones',
        queries: [
          'iQOO Neo 9 Pro 5G',
          'POCO X6 Pro 5G 12GB RAM',
          'OnePlus 12R Cool Blue',
          'Infinix GT 20 Pro Gaming Phone',
          'ASUS ROG Phone 8 Pro'
        ]
      },
      {
        id: 'phone_accessories',
        label: 'Phone Accessories',
        queries: [
          'Mi 20000mAh Power Bank 3i 18W Fast Charging',
          'Ambrane 10000mAh Magnetic Wireless Powerbank',
          'Spigen Tough Armor back cover iPhone 15',
          'boAt 65W GaN dual port fast charger',
          'Portronics car mobile phone holder mount'
        ]
      }
    ]
  },
  {
    id: 'laptops',
    label: 'Laptops',
    icon: 'Laptop',
    description: 'Ultrabooks, gaming laptops, MacBooks and 2-in-1 convertibles',
    subCategories: [
      {
        id: 'budget_laptops',
        label: 'Budget & Student Laptops',
        queries: [
          'HP 15s 12th Gen Intel Core i3 8GB 512GB SSD',
          'Lenovo IdeaPad Slim 3 Intel Core i3',
          'ASUS Vivobook 15 Intel Core i3 12th Gen',
          'Acer Aspire Lite AMD Ryzen 5 5500U',
          'Dell 14 Thin and Light Laptop Intel i3'
        ]
      },
      {
        id: 'premium_thin_light',
        label: 'Thin & Light Ultrabooks',
        queries: [
          'Apple MacBook Air M2 8GB 256GB SSD',
          'Apple MacBook Air M3 13 inch',
          'ASUS Zenbook 14 OLED Intel Core Ultra',
          'HP Pavilion Plus 14 OLED Intel Evo',
          'Lenovo Yoga Slim 6 Intel Evo OLED'
        ]
      },
      {
        id: 'gaming_laptops',
        label: 'Gaming Laptops',
        queries: [
          'ASUS TUF Gaming A15 AMD Ryzen 7 RTX 3050',
          'Lenovo LOQ Intel Core i5 12th Gen RTX 3050',
          'Acer Nitro V Gaming Laptop Intel Core i5 RTX 4050',
          'HP Victus Gaming Laptop AMD Ryzen 5',
          'Dell G15 Gaming Laptop Intel Core i5'
        ]
      },
      {
        id: 'business_laptops',
        label: 'Business & Productivity',
        queries: [
          'Lenovo ThinkPad E14 Intel Core i5 16GB RAM',
          'Dell Latitude 3440 Intel Core i5',
          'HP ProBook 440 G10 Business Laptop',
          'ASUS ExpertBook B1 Intel Core i5'
        ]
      },
      {
        id: 'laptop_accessories',
        label: 'Laptop Accessories',
        queries: [
          'Logitech MK295 Silent Wireless Keyboard and Mouse Combo',
          'Portronics adjustable aluminium laptop stand riser',
          'SanDisk Ultra 1TB External SSD Type C',
          'Targus 15.6 inch water resistant laptop backpack'
        ]
      }
    ]
  },
  {
    id: 'tablets',
    label: 'Tablets',
    icon: 'Tablet',
    description: 'iPads, Android tablets, drawing pads and e-readers',
    subCategories: [
      {
        id: 'apple_ipads',
        label: 'Apple iPads',
        queries: [
          'Apple iPad 10th Generation A14 Bionic 64GB WiFi Blue',
          'Apple iPad Air 11 inch M2 Chip',
          'Apple iPad Pro 11 inch M4 Chip OLED',
          'Apple iPad 9th Gen 64GB Space Grey'
        ]
      },
      {
        id: 'android_tablets',
        label: 'Android Tablets',
        queries: [
          'Samsung Galaxy Tab A9 Plus 11 inch 64GB WiFi',
          'OnePlus Pad Go 11.35 inch 2.4K Display',
          'Xiaomi Pad 6 8GB RAM 256GB Snapdragon 870',
          'Lenovo Tab M11 with Pen 128GB LTE',
          'realme Pad 2 11.5 inch 120Hz Display'
        ]
      },
      {
        id: 'tablets_ereaders',
        label: 'E-Readers & Paper Tablets',
        queries: [
          'Amazon Kindle Paperwhite 16GB 6.8 inch with warm light',
          'Amazon Kindle 11th Gen 6 inch glare-free display',
          'Kobo Clara Colour E-Reader'
        ]
      },
      {
        id: 'tablet_accessories',
        label: 'Stylus & Cases',
        queries: [
          'Apple Pencil 2nd Generation',
          'Samsung S Pen for Galaxy Tab',
          'Spigen Rugged Armor Case for iPad 10th Gen',
          'Logitech Keys-To-Go Ultra-Portable Wireless Bluetooth Keyboard'
        ]
      }
    ]
  },
  {
    id: 'tvs',
    label: 'TVs',
    icon: 'Tv',
    description: 'Smart 4K TVs, OLED displays, QLED panels and home theater',
    subCategories: [
      {
        id: '43_inch_tvs',
        label: '43-Inch 4K TVs',
        queries: [
          'Samsung 43 inch Crystal 4K Vivid Pro Ultra HD Smart LED TV',
          'LG 43 inch 4K Ultra HD Smart LED TV',
          'Sony Bravia 43 inch 4K Ultra HD Smart LED Google TV',
          'Mi 43 inch X Series 4K Ultra HD Smart Google TV',
          'TCL 43 inch 4K Ultra HD Metallic Bezel-less Smart Google TV'
        ]
      },
      {
        id: '55_inch_tvs',
        label: '55-Inch & Large Displays',
        queries: [
          'Sony Bravia 55 inch 4K Ultra HD Smart LED Google TV KD-55X74L',
          'LG 55 inch 4K Ultra HD Smart NanoCell TV',
          'Samsung 55 inch Crystal 4K Neo Series Smart TV',
          'TCL 55 inch 4K Ultra HD Smart QLED Google TV',
          'Hisense 55 inch 4K Ultra HD Smart Mini-LED TV'
        ]
      },
      {
        id: 'qled_oled_tvs',
        label: 'QLED & OLED Flagships',
        queries: [
          'LG 55 inch 4K OLED Smart TV OLED55C3',
          'Samsung 55 inch The Frame QLED 4K Smart TV',
          'Sony Bravia XR 55 inch OLED 4K Google TV'
        ]
      },
      {
        id: 'budget_smart_tvs',
        label: '32-Inch Budget Smart TVs',
        queries: [
          'Samsung 32 inch Wondertainment Series HD Ready Smart LED TV',
          'LG 32 inch HD Ready Smart LED TV',
          'Mi 32 inch A Series HD Ready Smart Google TV',
          'Acer 32 inch Advanced I Series HD Ready Smart LED TV'
        ]
      },
      {
        id: 'streaming_devices',
        label: 'Streaming Sticks & Audio',
        queries: [
          'Amazon Fire TV Stick 4K with Alexa Voice Remote',
          'Google Chromecast with Google TV 4K',
          'JBL Cinema SB271 2.1 Channel Dolby Digital Soundbar with Subwoofer',
          'boAt Aavante Bar 1160 60W Bluetooth Soundbar'
        ]
      }
    ]
  },
  {
    id: 'appliances',
    label: 'Appliances',
    icon: 'Refrigerator',
    description: 'Washing machines, refrigerators, air conditioners and microwaves',
    subCategories: [
      {
        id: 'washing_machines',
        label: 'Washing Machines',
        queries: [
          'LG 7 Kg 5 Star Smart Inverter Fully-Automatic Top Load Washing Machine',
          'Samsung 7 Kg 5 Star AI Control Fully Automatic Front Load Washing Machine',
          'Whirlpool 7.5 Kg 5 Star Royal Fully-Automatic Top Load Washing Machine',
          'Bosch 7 kg 5 Star Inverter Touch Control Fully Automatic Front Load Washing Machine',
          'IFB 6.5 Kg 5 Star Front Load Washing Machine with Steam Clean'
        ]
      },
      {
        id: 'refrigerators',
        label: 'Refrigerators',
        queries: [
          'Samsung 236 L 3 Star Digital Inverter Frost Free Double Door Refrigerator',
          'LG 185 L 5 Star Inverter Direct-Cool Single Door Refrigerator',
          'Whirlpool 240 L Frost Free Triple Door Refrigerator Protton',
          'Haier 240 L 3 Star Twin Inverter Double Door Refrigerator',
          'Godrej 180 L 4 Star Turbo Cooling Direct Cool Refrigerator'
        ]
      },
      {
        id: 'air_conditioners',
        label: 'Air Conditioners',
        queries: [
          'LG 1.5 Ton 5 Star AI DUAL Inverter Split AC',
          'Voltas 1.5 Ton 3 Star Inverter Split AC Copper',
          'Daikin 1.5 Ton 5 Star Inverter Split AC',
          'Lloyd 1.5 Ton 3 Star Inverter Split AC Copper',
          'Panasonic 1.5 Ton 5 Star Wi-Fi Inverter Smart Split AC'
        ]
      },
      {
        id: 'microwaves_ovens',
        label: 'Microwaves & OTG',
        queries: [
          'LG 28 L Convection Microwave Oven Charcoal Lighting Heater',
          'Samsung 28 L Convection Microwave Oven with Curd Any Time',
          'IFB 30 L Convection Microwave Oven 30FRC2',
          'Bajaj 16 Litre Oven Toaster Griller OTG'
        ]
      },
      {
        id: 'water_purifiers',
        label: 'Water Purifiers',
        queries: [
          'Kent Grand Plus RO Water Purifier with UV and UF TDS Control',
          'Aquaguard Sure Delight NXT RO UV Water Purifier',
          'Pureit Copper Plus Mineral RO UV Water Purifier',
          'V-Guard Zenora RO UV Water Purifier 7 Litre'
        ]
      }
    ]
  },
  {
    id: 'audio',
    label: 'Audio & Earbuds',
    icon: 'Headphones',
    description: 'TWS earbuds, ANC headphones, neckbands and party speakers',
    subCategories: [
      {
        id: 'tws_earbuds',
        label: 'TWS Wireless Earbuds',
        queries: [
          'boAt Airdopes 141 Bluetooth Truly Wireless Earbuds 42H Playtime',
          'OnePlus Nord Buds 2r True Wireless in Ear Earbuds with Mic',
          'Boult Audio Z40 True Wireless Earbuds with 60H Playtime',
          'realme Buds T300 with 30dB Active Noise Cancellation',
          'Noise Buds VS102 Truly Wireless Earbuds'
        ]
      },
      {
        id: 'anc_headphones',
        label: 'Over-Ear ANC Headphones',
        queries: [
          'Sony WH-1000XM4 Wireless Industry Leading Noise Cancelling Headphones',
          'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
          'Bose QuietComfort 45 Bluetooth Wireless Noise Cancelling Headphones',
          'boAt Rockerz 551ANC Hybrid Active Noise Cancelling Headphones',
          'JBL Tune 770NC Wireless Over-Ear ANC Headphones'
        ]
      },
      {
        id: 'bluetooth_speakers',
        label: 'Bluetooth Speakers',
        queries: [
          'boAt Stone 352 10W Portable Bluetooth Speaker with RGB LED',
          'JBL Flip 6 Wireless Portable Bluetooth Speaker IP67 Waterproof',
          'Marshall Emberton II Portable Bluetooth Speaker',
          'Tribit StormBox Micro 2 Portable Speaker',
          'Sony SRS-XB100 Wireless Ultra-Portable Compact Speaker'
        ]
      },
      {
        id: 'neckbands',
        label: 'Wireless Neckbands',
        queries: [
          'OnePlus Bullets Wireless Z2 Bluetooth Neckband with Fast Charge',
          'realme Buds Wireless 3 Neckband 30dB ANC Spatial Audio',
          'boAt Rockerz 255 Pro Plus Bluetooth in Ear Earphone',
          'Boult Audio Curve ANC Wireless in Ear Earphone'
        ]
      },
      {
        id: 'party_speakers',
        label: 'Party & Karaoke Speakers',
        queries: [
          'JBL PartyBox 110 Portable Party Speaker with Built-in Lights',
          'Sony MHC-V13 High Power Audio System with Bluetooth',
          'boAt PartyPal 50 20W Bluetooth Party Speaker with Mic'
        ]
      }
    ]
  },
  {
    id: 'smartwatches',
    label: 'Smartwatches',
    icon: 'Watch',
    description: 'Smartwatches, fitness bands, Apple Watch, Galaxy Watch and sports trackers',
    subCategories: [
      {
        id: 'budget_smartwatches',
        label: 'Budget Bluetooth Calling Watches',
        queries: [
          'Noise ColorFit Pulse 3 with 1.96 inch TFT Display Bluetooth Calling',
          'Fire-Boltt Ninja Call Pro Plus 1.83 inch Smart Watch Bluetooth Calling',
          'boAt Wave Call 2 Smart Watch with 1.83 inch HD Display',
          'Fastrack Limitless FS1 Pro with 1.96 inch Super AMOLED Display',
          'T800 Ultra Smartwatch with 1.99 inch display Bluetooth Calling'
        ]
      },
      {
        id: 'amoled_smartwatches',
        label: 'AMOLED Display Smartwatches',
        queries: [
          'Noise Halo Plus 1.46 inch AMOLED Display Bluetooth Calling Smartwatch',
          'Fire-Boltt Invincible Plus 1.43 inch AMOLED Smartwatch with 4GB Storage',
          'Amazfit Active 1.75 inch AMOLED Smartwatch with Built-in GPS',
          'boAt Enigma X400 Luxury AMOLED Smart Watch'
        ]
      },
      {
        id: 'premium_smartwatches',
        label: 'Apple Watch & Galaxy Watch',
        queries: [
          'Apple Watch Series 9 GPS 41mm Midnight Aluminium Case',
          'Apple Watch SE 2nd Gen GPS 40mm Starlight Aluminium',
          'Samsung Galaxy Watch 6 Bluetooth 40mm Graphite',
          'Apple Watch Ultra 2 GPS plus Cellular 49mm Titanium'
        ]
      },
      {
        id: 'sports_outdoor_watches',
        label: 'Sports & GPS Watches',
        queries: [
          'Garmin Forerunner 55 GPS Running Smartwatch',
          'Amazfit T-Rex 2 Rugged Outdoor Smartwatch 10 ATM Water Resistance',
          'Suunto 9 Baro Titanium Multi-Sport GPS Watch'
        ]
      },
      {
        id: 'fitness_bands',
        label: 'Fitness Trackers & Straps',
        queries: [
          'Xiaomi Smart Band 8 Active Fitness Tracker',
          'Titan Smart 2 Watch Silicone Replacement Strap 22mm',
          'Spigen Rugged Armor Pro Case with Band for Apple Watch'
        ]
      }
    ]
  },
  {
    id: 'cameras',
    label: 'Cameras & Photography',
    icon: 'Camera',
    description: 'Mirrorless cameras, DSLRs, action cams, vlogging cameras and lenses',
    subCategories: [
      {
        id: 'mirrorless_cameras',
        label: 'Mirrorless & DSLR Cameras',
        queries: [
          'Sony Alpha ILCE-6400L 24.2MP Mirrorless Camera with 16-50mm Lens',
          'Canon EOS R50 Mirrorless Camera with RF-S 18-45mm IS STM Lens',
          'Nikon Z50 Mirrorless Camera with 16-50mm VR Lens',
          'Sony Alpha ILCE-7M4 Full-Frame Hybrid Camera'
        ]
      },
      {
        id: 'action_vlog_cameras',
        label: 'Action & Vlogging Cameras',
        queries: [
          'GoPro HERO12 Black Waterproof Action Camera with HDR Video',
          'DJI Osmo Pocket 3 4K 120fps Vlogging Gimbal Camera',
          'Insta360 X3 360 Degree Waterproof Action Camera',
          'Sony ZV-E10 Mirrorless Vlog Camera with Interchangeable Lens'
        ]
      },
      {
        id: 'camera_accessories',
        label: 'Gimbals, Tripods & Lights',
        queries: [
          'DJI RS 3 Mini 3-Axis Gimbal Stabilizer for Mirrorless Cameras',
          'Digitek DTR 550LW 67 inch Lightweight Aluminum Tripod with Mobile Holder',
          'SanDisk Extreme Pro 128GB SDXC UHS-I Memory Card 200MBs',
          'Godox SL60W 60W LED Continuous Video Light'
        ]
      },
      {
        id: 'instant_cameras',
        label: 'Instant Cameras',
        queries: [
          'Fujifilm Instax Mini 12 Instant Camera Lilac Purple',
          'Fujifilm Instax Square SQ1 Instant Camera',
          'Fujifilm Instax Mini Instant Film Pack 20 Shots'
        ]
      },
      {
        id: 'security_cameras',
        label: 'Home Security Cameras',
        queries: [
          'TP-Link Tapo C200 360 2MP Pan and Tilt Smart Security Camera',
          'Mi 360 Home Security Camera 2K Pro',
          'Qubo Smart Cam 360 WiFi Camera with AI Person Detection'
        ]
      }
    ]
  },
  {
    id: 'gaming',
    label: 'Gaming',
    icon: 'Gamepad2',
    description: 'PlayStation, Xbox, Nintendo, gaming controllers and PC peripherals',
    subCategories: [
      {
        id: 'consoles',
        label: 'Gaming Consoles',
        queries: [
          'Sony PlayStation 5 Slim Console Standard Disc Edition',
          'Microsoft Xbox Series X 1TB Gaming Console',
          'Nintendo Switch OLED Model with Neon Blue and Neon Red Joy-Con',
          'Sony PlayStation 5 Digital Edition'
        ]
      },
      {
        id: 'controllers',
        label: 'Controllers & Gamepads',
        queries: [
          'Sony DualSense Wireless Controller for PlayStation 5 White',
          'Microsoft Xbox Wireless Controller Robot White with Bluetooth',
          'Cosmic Byte Ares Wireless Controller for PC and Android',
          'Razer Wolverine V2 Chroma Wired Gaming Controller'
        ]
      },
      {
        id: 'gaming_peripherals',
        label: 'Gaming Mice & Keyboards',
        queries: [
          'Logitech G502 HERO High Performance Wired Gaming Mouse 25K Sensor',
          'Razer DeathAdder Essential Wired Gaming Mouse 6400 DPI',
          'Cosmic Byte CB-GK-16 Firefly RGB Mechanical Keyboard Outemu Blue',
          'Redragon K552 Kumara RGB Mechanical Gaming Keyboard'
        ]
      },
      {
        id: 'gaming_headsets',
        label: 'Gaming Headsets',
        queries: [
          'HyperX Cloud II Gaming Headset with 7.1 Virtual Surround Sound',
          'Razer BlackShark V2 X Multi-Platform Wired Esports Headset',
          'Logitech G435 Lightspeed and Bluetooth Wireless Gaming Headset'
        ]
      },
      {
        id: 'gaming_chairs_desks',
        label: 'Gaming Chairs & Mats',
        queries: [
          'Green Soul Monster Ultimate Ergonomic Gaming Chair',
          'Spinine Gaming Chair with Footrest Ergonomic Leather',
          'Razer Goliathus Mobile Stealth Edition Gaming Mouse Pad'
        ]
      }
    ]
  },
  {
    id: 'fashion_men',
    label: 'Fashion Men',
    icon: 'Shirt',
    description: "Men's shirts, t-shirts, jeans, trousers, ethnic wear and winter wear",
    subCategories: [
      {
        id: 'mens_tshirts_polos',
        label: "T-Shirts & Polos",
        queries: [
          "Allen Solly Men's Regular Fit Solid Polo",
          "U.S. POLO ASSN. Men's Solid Slim Fit Cotton Polo T-Shirt",
          "Puma Men's Regular Fit Solid Cotton T-Shirt",
          "Levi's Men's Graphic Regular Fit Round Neck T-Shirt",
          "Van Heusen Men's Classic Cotton Polo Shirt"
        ]
      },
      {
        id: 'mens_shirts',
        label: "Casual & Formal Shirts",
        queries: [
          "Peter England Men's Slim Fit Full Sleeve Formal Shirt",
          "Amazon Brand - Symbol Men's Regular Fit Cotton Casual Shirt",
          "Arrow Men's Classic Fit Formal Cotton Shirt",
          "HIGHLANDER Men's Slim Fit Casual Shirt",
          "Louis Philippe Men's Pure Cotton Formal Shirt"
        ]
      },
      {
        id: 'mens_jeans_trousers',
        label: "Jeans & Trousers",
        queries: [
          "Levi's Men's 511 Slim Fit Low Rise Stretch Jeans",
          "Pepe Jeans Men's Regular Fit Denim Jeans",
          "Wrangler Men's Regular Fit Mid Rise Jeans",
          "Park Avenue Men's Slim Fit Flat Front Formal Trousers",
          "U.S. POLO ASSN. Men's Slim Fit Cotton Chinos"
        ]
      },
      {
        id: 'mens_ethnic_wear',
        label: "Ethnic & Festive Wear",
        queries: [
          "Manyavar Men's Jacquard Pattern Kurta Pajama Set",
          "Fabindia Men's Cotton Long Kurta with Mandarin Collar",
          "SOJANYA Men's Silk Blend Kurta Churidar and Nehru Jacket Set",
          "Sanwara Men's Cotton Blend Printed Kurta Pyjama"
        ]
      },
      {
        id: 'mens_innerwear_sleepwear',
        label: "Innerwear & Loungewear",
        queries: [
          "Jockey Men's Super Combed Cotton Trunk Pack of 2",
          "Calvin Klein Men's Cotton Stretch Boxer Briefs",
          "Van Heusen Men's Cotton Lounge Pants Pyjama"
        ]
      }
    ]
  },
  {
    id: 'fashion_women',
    label: 'Fashion Women',
    icon: 'Sparkles',
    description: "Women's ethnic wear, kurtas, sarees, western dresses, tops and jeans",
    subCategories: [
      {
        id: 'kurtas_anarkali',
        label: "Kurtis & Anarkali Sets",
        queries: [
          "Women's Pure Cotton Printed Anarkali Kurti with Pant and Dupatta Set",
          "BIBA Women's Cotton Printed Straight Kurta with Palazzo",
          "Aurelia Women's Rayon Printed A-Line Kurta",
          "W for Woman Women's Rayon Straight Kurta",
          "Jaipuri Libas Women's Cotton Printed Kurta Set"
        ]
      },
      {
        id: 'sarees_ethnic',
        label: "Sarees & Lehengas",
        queries: [
          "Bollywood Style Pure Georgette Sequence Embroidery Saree",
          "Banarasi Silk Zari Woven Saree with Blouse Piece",
          "Kanchipuram Silk Saree for Wedding Festive",
          "Chanderi Cotton Silk Printed Saree with Blouse"
        ]
      },
      {
        id: 'womens_dresses_tops',
        label: "Western Dresses & Tops",
        queries: [
          "VERO MODA Women's Floral Print Midi A-Line Dress",
          "ONLY Women's Regular Fit Cotton Casual Top",
          "AND Women's Solid Knee-Length Shift Dress",
          "Zara Style Women's Floral Printed Summer Sundress"
        ]
      },
      {
        id: 'womens_jeans_trousers',
        label: "Jeans & Bottoms",
        queries: [
          "Levi's Women's 711 Skinny Fit High Rise Jeans",
          "Kotty Women's High Rise Relaxed Fit Wide Leg Jeans",
          "Marks and Spencer Women's Cotton Rich Slim Fit Trousers"
        ]
      },
      {
        id: 'womens_winterwear',
        label: "Jackets & Sweaters",
        queries: [
          "Fort Collins Women's Quilted Hooded Winter Jacket",
          "Monte Carlo Women's Pure Wool Cardigan Sweater",
          "Levi's Women's Classic Denim Trucker Jacket"
        ]
      }
    ]
  },
  {
    id: 'kids',
    label: 'Kids Clothing',
    icon: 'Baby',
    description: "Infant wear, boys and girls clothing, festive dresses and school wear",
    subCategories: [
      {
        id: 'boys_clothing',
        label: "Boys Clothing",
        queries: [
          "Gini and Jony Boys Cotton Regular Fit Printed T-Shirt",
          "Hopscotch Boys Cotton Solid Shirt and Trouser Set",
          "US Polo Association Boys Cotton Polo T-Shirt",
          "MAX Boys Denim Jeans with Adjustable Waist"
        ]
      },
      {
        id: 'girls_clothing',
        label: "Girls Dresses & Sets",
        queries: [
          "Hopscotch Girls Cotton Floral Print Knee Length Party Dress",
          "Mothercare Girls Cotton Printed Top and Leggings Set",
          "BIBA Girls Cotton Printed Salwar Suit Set"
        ]
      },
      {
        id: 'baby_clothing',
        label: "Baby & Toddler Rompers",
        queries: [
          "Mini Klub Unisex Baby Cotton Printed Sleepsuit Pack of 3",
          "LuvLap 100% Cotton Front Open Baby Rompers Pack of 3",
          "Mothercare Baby Pure Cotton Bodysuit Multipack"
        ]
      },
      {
        id: 'kids_ethnic',
        label: "Kids Festive & Ethnic",
        queries: [
          "Kuber Industries Boys Silk Blend Kurta Dhoti Set",
          "Ahhaaaa Kids Boys Cotton Blend Sherwani Suit Set",
          "LilPicks Girls Printed Silk Lehenga Choli Set"
        ]
      },
      {
        id: 'kids_nightwear',
        label: "Nightwear & Thermals",
        queries: [
          "Zeyo Kids Cotton Printed Full Sleeve Night Suit Set",
          "Bodycare Junior Boys Cotton Thermal Set Top and Pyjama",
          "Nite Flite Kids Soft Cotton Pyjama Set"
        ]
      }
    ]
  },
  {
    id: 'footwear',
    label: 'Footwear',
    icon: 'Footprints',
    description: 'Running shoes, casual sneakers, formal shoes, sandals and heels',
    subCategories: [
      {
        id: 'sports_running_shoes',
        label: 'Running & Sports Shoes',
        queries: [
          "Nike Men's Revolution 7 Road Running Shoes",
          "Puma Men's Softride Pro Walking and Running Shoes",
          "Sparx Men's Lightweight Mesh Running Shoes",
          "Asian Men's Wonder-13 Lightweight Mesh Sports Shoes",
          "Campus Men's FIRST Running and Gym Training Shoes",
          "Adidas Men's Fluidflow 2.0 Running Shoes"
        ]
      },
      {
        id: 'casual_sneakers',
        label: 'Casual Sneakers',
        queries: [
          "Red Tape Men's Classic Casual Sneaker Shoes",
          "Puma Unisex Smashic Low Top Casual Sneakers",
          "Converse Chuck Taylor All Star Canvas Sneakers",
          "U.S. POLO ASSN. Men's Clarkin Low-Top Sneakers",
          "Men's Trendy Chunky White Streetwear Casual Sneakers"
        ]
      },
      {
        id: 'formal_shoes_loafers',
        label: 'Formal Shoes & Loafers',
        queries: [
          "Bata Men's Formal Genuine Leather Oxford Shoes",
          "Hush Puppies Men's Leather Slip-On Formal Shoes",
          "Red Chief Men's Genuine Leather Casual Derby Shoes",
          "Men's Classic Slip-On Driving Loafers"
        ]
      },
      {
        id: 'sandals_slippers',
        label: 'Sandals & Slides',
        queries: [
          "Crocs Unisex Classic Clogs Water Resistant",
          "Sparx Men's Athletic Outdoor Strappy Sandals",
          "Bata Men's Comfortable Daily Wear Leather Sandals",
          "Puma Unisex Purecat Lightweight Slide Slippers"
        ]
      },
      {
        id: 'womens_footwear',
        label: "Women's Flats & Heels",
        queries: [
          "Bata Women's Soft Walk Cushioned Flat Ballerinas",
          "Metro Women's Block Heel Ankle Strap Sandals",
          "Mochi Women's Embroidered Traditional Mojari Juttis",
          "Skechers Women's GO WALK Joy Slip-On Walking Shoes"
        ]
      }
    ]
  },
  {
    id: 'bags',
    label: 'Bags & Luggage',
    icon: 'Briefcase',
    description: 'Backpacks, trolley bags, duffles, laptop sleeves and ladies handbags',
    subCategories: [
      {
        id: 'laptop_backpacks',
        label: 'Laptop Backpacks',
        queries: [
          'American Tourister 32 L Casual Laptop Backpack',
          'Skybags Brat 30 L Casual Daypack Waterproof',
          'Wildcraft 35 L Heavy Duty Casual Laptop Backpack',
          'Safari 37 L Casual Laptop Backpack with Rain Cover'
        ]
      },
      {
        id: 'trolley_luggage',
        label: 'Trolley Bags & Suitcases',
        queries: [
          'American Tourister Ivy 68 cm Medium Hard Suitcase Trolley Bag',
          'Safari Thorium Sharp 66 cm Polycarbonate Check-in Trolley',
          'Aristocrat 55 cm Cabin Luggage Polycarbonate 4 Wheel Trolley',
          'Kamiliant by American Tourister Hard Sided Cabin Luggage'
        ]
      },
      {
        id: 'duffles_gym_bags',
        label: 'Duffle & Gym Bags',
        queries: [
          'Wildcraft 45 L Heavy Duty Polyester Duffle Bag',
          'Nike Brasilia 9.5 Training Duffel Bag Medium',
          'Puma Challenger Duffel Bag with Shoe Pocket'
        ]
      },
      {
        id: 'ladies_handbags',
        label: "Ladies Handbags & Totes",
        queries: [
          "Lavie Women's Betula Faux Leather Medium Tote Bag",
          "Caprese Women's Faux Leather Structured Satchel Handbag",
          "ZOUK Handmade Vegan Leather Printed Shoulder Tote Bag",
          "Baggit Women's Vegan Leather Hobo Handbag"
        ]
      },
      {
        id: 'wallets_clutches',
        label: 'Wallets & Pouches',
        queries: [
          "WildHorn Men's Genuine Leather Bi-Fold RFID Protected Wallet",
          "Urban Forest Oliver Leather Wallet with Coin Pocket",
          "Lavie Women's Printed Zip Around Flap Clutch Wallet"
        ]
      }
    ]
  },
  {
    id: 'home_kitchen',
    label: 'Home & Kitchen',
    icon: 'Utensils',
    description: 'Cookware, air fryers, mixer grinders, kitchenware and home decor',
    subCategories: [
      {
        id: 'mixer_grinders',
        label: 'Mixer Grinders & Blenders',
        queries: [
          'Philips HL7756/00 750W Mixer Grinder with 3 Stainless Steel Jars',
          'Prestige Iris Plus 750W Mixer Grinder with 4 Jars',
          'Bajaj Rex 500W Mixer Grinder with 3 Jars',
          'Sujata Powermatic Plus 900W Juicer Mixer Grinder',
          'Nutribullet Pro 900W High Speed Blender Smoothie Maker'
        ]
      },
      {
        id: 'air_fryers_cookers',
        label: 'Air Fryers & Pressure Cookers',
        queries: [
          'Philips Daily Collection 4.1L Rapid Air Technology Digital Air Fryer HD9200',
          'Prestige Deluxe Alpha Stainless Steel Pressure Cooker 3 Litre',
          'Hawkins Contura Hard Anodised Pressure Cooker 3 Litre',
          'Inalsa Aero Crisp 12L Digital Air Fryer Oven with Rotisserie'
        ]
      },
      {
        id: 'cookware_sets',
        label: 'Cookware & Kadhai Sets',
        queries: [
          'Prestige Omega Deluxe Granite Non-Stick Cookware Set 3 Pieces',
          'Hawkins Futura Hard Anodised Deep Kadhai with Lid 2.5 Litre',
          'Milton Pro Cook Granite Induction Bottom Fry Pan 24cm',
          'Meyer Pre-Seasoned Cast Iron Skillet 26cm'
        ]
      },
      {
        id: 'water_bottles_flasks',
        label: 'Bottles, Flasks & Lunch Boxes',
        queries: [
          'Milton Thermosteel Flip Lid Vacuum Insulated Flask 1000ml',
          'Cello Stainless Steel insulated Vacuum Flask 1 Litre',
          'Borosil Glass Lunch Box Set of 3 with Thermal Insulated Bag',
          'Signoraware Best Stainless Steel 3 Container Lunch Box'
        ]
      },
      {
        id: 'home_decor_lighting',
        label: 'Home Decor & Lamps',
        queries: [
          'Wipro 9W B22 WiFi Smart LED Bulb 16 Million Colours',
          'Philips Hue Smart Ambient Light Bar',
          'Deco Window Geometric Eyelet Blackout Door Curtains Pack of 2',
          'Solimo 100% Microfibre Solid Comforter Quilt Double Bed'
        ]
      }
    ]
  },
  {
    id: 'furniture',
    label: 'Furniture',
    icon: 'Armchair',
    description: 'Beds, sofas, office chairs, study tables, wardrobes and shoe racks',
    subCategories: [
      {
        id: 'office_study_chairs',
        label: 'Office & Ergonomic Chairs',
        queries: [
          'Green Soul Jupiter High Back Ergonomic Mesh Office Chair with Lumbar Support',
          'Wakefit Ergonomic High Back Mesh Desk Chair for Office Work',
          'CELLBELL C104 High Back Ergonomic Executive Office Chair',
          'Da URBAN Miller High Back Mesh Ergonomic Chair'
        ]
      },
      {
        id: 'study_office_desks',
        label: 'Study Desks & Workstations',
        queries: [
          'Wakefit Apollo Engineered Wood Study Table with Storage',
          'Green Soul Height Adjustable Motorized Standing Desk',
          'Spacewood Winner Computer Study Desk with Drawer Storage'
        ]
      },
      {
        id: 'beds_mattresses',
        label: 'Beds & Memory Mattresses',
        queries: [
          'Wakefit Dual Comfort 6 Inch King Size Orthopedic Foam Mattress',
          'The Sleep Company SmartGRID Ortho 6 Inch Queen Size Mattress',
          'Sleepwell Dual Pro Profiled Foam 5 Inch Mattress',
          'Wakefit Taurus Solid Sheesham Wood Queen Size Bed'
        ]
      },
      {
        id: 'sofas_recliners',
        label: 'Sofas & Recliners',
        queries: [
          'Wakefit Napper 3 Seater Fabric Sofa Couch',
          'Solimo Musca 1 Seater Fabric Recliner Chair Brown',
          'Duroflex Avalon 3 Seater Fabric Sofa Set'
        ]
      },
      {
        id: 'shoe_racks_storage',
        label: 'Shoe Racks & Shelves',
        queries: [
          'DeckUp Plank Carme Engineered Wood 3 Door Shoe Rack with Mirror',
          'Cello Novelty 4 Door Plastic Storage Shoe Cabinet',
          'Amazon Brand - Solimo 4 Tier Multipurpose Metal Wire Shelf'
        ]
      }
    ]
  },
  {
    id: 'beauty',
    label: 'Beauty & Skincare',
    icon: 'HeartHandshake',
    description: 'Face serums, moisturizers, cleansers, hair care, perfumes and makeup',
    subCategories: [
      {
        id: 'face_serums_moisturizers',
        label: 'Serums & Moisturizers',
        queries: [
          'Minimalist 2% Salicylic Acid Face Serum for Acne and Blackheads 30ml',
          'Plum Green Tea Oil-Free Moisturizer with Niacinamide 50ml',
          'Minimalist 10% Vitamin C Face Serum for Glowing Skin',
          'Cetaphil Moisturising Cream for Dry to Normal Sensitive Skin 100g',
          'Dot and Key 72 HR Hydrating Gel + Probiotics Moisturizer'
        ]
      },
      {
        id: 'cleansers_sunscreens',
        label: 'Cleansers & Sunscreens',
        queries: [
          'Cetaphil Gentle Skin Cleanser for Dry to Sensitive Skin 250ml',
          'The Derma Co 1% Hyaluronic Sunscreen Aqua Gel SPF 50 PA++++ 50g',
          'Aqualogica Radiance+ Dewy Sunscreen with Watermelon and Niacinamide SPF 50',
          'Simple Kind to Skin Refreshing Facial Wash 150ml'
        ]
      },
      {
        id: 'haircare',
        label: 'Hair Oils & Shampoos',
        queries: [
          'Mamaearth Onion Hair Oil for Hair Fall Control with Redensyl 250ml',
          'L\'Oreal Paris Total Repair 5 Shampoo with Keratin XS 1000ml',
          'Tresemme Keratin Smooth Shampoo with Argan Oil 1000ml',
          'Biotique Morning Nectar Flawless Skin Nourishing Lotion 190ml'
        ]
      },
      {
        id: 'makeup_lipsticks',
        label: 'Lipsticks & Foundations',
        queries: [
          'Maybelline New York Super Stay Matte Ink Liquid Lipstick Pioneer',
          'Maybelline New York Fit Me Matte + Poreless Liquid Foundation 30ml',
          'Lakme 9 to 5 Complexion Care CC Cream SPF 30 30g',
          'Swiss Beauty Ultra Blush Palette 16g'
        ]
      },
      {
        id: 'fragrances_perfumes',
        label: 'Perfumes & Deodorants',
        queries: [
          'Fogg Xtremo Scent For Men Eau De Parfum 100ml',
          'Bella Vita Luxury Man Perfume Gift Set 4x20ml',
          'Skinn by Titan Raw Eau De Parfum For Men 100ml',
          'Plum BodyLovin Hawaiian Rumba Body Mist 150ml'
        ]
      }
    ]
  },
  {
    id: 'health',
    label: 'Health & Nutrition',
    icon: 'Activity',
    description: 'Whey protein, vitamins, health monitors, Ayurvedic herbs and supplements',
    subCategories: [
      {
        id: 'protein_supplements',
        label: 'Whey Protein & Fitness',
        queries: [
          'Optimum Nutrition Gold Standard 100% Whey Protein Powder 2 lb Double Rich Chocolate',
          'MuscleBlaze Biozyme Performance Whey Protein 1 kg Rich Chocolate',
          'AS-IT-IS Nutrition Whey Protein Concentrate 80% Unflavoured 1kg',
          'MuscleBlaze Creatine Monohydrate 100g Micronized Fast Absorbing'
        ]
      },
      {
        id: 'ayurveda_herbs',
        label: 'Ayurvedic Supplements',
        queries: [
          'Kapiva Himalayan Shilajit Resin 20g 100% Pure Organic Ayurvedic',
          'Dabur Chyawanprash 1kg with 40 Ayurvedic Herbs for Immunity',
          'Himalaya Ashvagandha General Wellness Tablets 60 Count',
          'Baidyanath Pure Triphala Juice 1 Litre for Digestion'
        ]
      },
      {
        id: 'multivitamins_fish_oil',
        label: 'Vitamins & Omega 3',
        queries: [
          'MuscleBlaze Omega 3 Fish Oil 1000mg with 180mg EPA and 120mg DHA 90 Capsules',
          'HealthKart HK Vitals Multivitamin for Men with Zinc and Vitamin C 60 Tablets',
          'Carbamide Forte Chelated Magnesium Glycinate 2400mg 120 Tablets',
          'Supradyn Daily Multivitamin with Minerals and Zinc 60 Tablets'
        ]
      },
      {
        id: 'health_monitors',
        label: 'BP Monitors & Weighing Scales',
        queries: [
          'Omron HEM 7120 Fully Automatic Digital Blood Pressure Monitor with Cuff',
          'Dr Trust USA Fully Automatic Digital Blood Pressure Monitor',
          'Accu-Chek Active Blood Glucose Glucometer Monitoring System',
          'HealthSense Ultra-Lite Digital Personal Bathroom Body Weighing Scale'
        ]
      },
      {
        id: 'pain_relief_support',
        label: 'Pain Relief & Ortho',
        queries: [
          'Flamingo Orthopaedic Heat Belt Extra Large for Back Pain Relief',
          'Vissco Pro Elastic Knee Support with Compression',
          'Moov Pain Relief Fast Acting Spray 80g'
        ]
      }
    ]
  },
  {
    id: 'groceries',
    label: 'Groceries & Pantry',
    icon: 'ShoppingBasket',
    description: 'Cooking oil, tea, coffee, basmati rice, dry fruits and daily kitchen essentials',
    subCategories: [
      {
        id: 'cooking_oils_ghee',
        label: 'Cooking Oils & Ghee',
        queries: [
          'Fortune Sunlite Refined Sunflower Cooking Oil 1 Litre Pouch',
          'Amul Pure Cow Ghee Tin 1 Litre Authentic Aroma',
          'Dhara Kachi Ghani Mustard Oil 1 Litre Bottle',
          'Saffola Gold Pro Healthy Lifestyle Blended Edible Oil 5 Litre'
        ]
      },
      {
        id: 'tea_coffee',
        label: 'Tea & Coffee',
        queries: [
          'Tata Tea Gold Assam Long Leaves Black Tea 1kg',
          'Red Label Natural Care Ayurvedic Spiced Tea 1kg',
          'Nescafe Classic 100% Pure Instant Coffee Jar 200g',
          'BRU Instant Coffee Chicory Mix 200g Pouch'
        ]
      },
      {
        id: 'dry_fruits_nuts',
        label: 'Almonds, Cashews & Nuts',
        queries: [
          'Happilo Premium California Whole Almonds 500g',
          'Tata Sampann 100% Pure California Almonds 500g',
          'Happilo 100% Natural Whole Cashews W320 500g',
          'Nutraj California Walnuts Kernels 500g'
        ]
      },
      {
        id: 'rice_atta_pulses',
        label: 'Basmati Rice, Atta & Dal',
        queries: [
          'Daawat Rozana Gold Basmati Rice 5kg Aged Long Grain',
          'India Gate Basmati Rice Feast Rozzana 5kg Bag',
          'Aashirvaad Superior MP Sharbati Whole Wheat Atta 10kg',
          'Tata Sampann Unpolished Toor Dal 1kg'
        ]
      },
      {
        id: 'spices_masala',
        label: 'Spices & Seasonings',
        queries: [
          'Everest Garam Masala Powder 100g Pouch',
          'Catch Coriander Dhaniya Powder 500g Fresh Ground',
          'MDH Chunky Chat Masala 100g Carton',
          'Tata Salt Vacuum Evaporated Iodised Salt 1kg'
        ]
      }
    ]
  },
  {
    id: 'toys',
    label: 'Toys & Baby',
    icon: 'Gamepad',
    description: 'LEGO, board games, hot wheels, educational toys and baby gear',
    subCategories: [
      {
        id: 'building_blocks_lego',
        label: 'Building Blocks & LEGO',
        queries: [
          'LEGO Classic Large Creative Brick Box 10698 Building Toy Set',
          'LEGO Technic Formula E Porsche 99X Electric Pull-Back Toy Car',
          'Mega Bloks First Builders Big Building Bag 80 Blocks'
        ]
      },
      {
        id: 'diecast_cars_rc',
        label: 'Diecast Cars & RC Vehicles',
        queries: [
          'Hot Wheels 5 Car Die-Cast Vehicle Gift Pack Set',
          'Hot Wheels Track Builder Unlimited Multi-Loop Box Set',
          'Wembley High Speed Remote Control Racing Car Toy with LED Lights'
        ]
      },
      {
        id: 'board_games_puzzles',
        label: 'Board Games & Puzzles',
        queries: [
          'Hasbro Monopoly Classic Family Board Game for 2-6 Players',
          'Funskool Scrabble The Classic Word Board Game',
          'Hasbro Jenga Classic Hardwood Block Stacking Tower Game',
          'Uno Classic Card Game with Wild Cards Tin Pack'
        ]
      },
      {
        id: 'baby_gear_strollers',
        label: 'Baby Strollers & Walkers',
        queries: [
          'LuvLap Galaxy Stroller Pram with Reversible Handle and Mosquito Net',
          'Mee Mee Baby Walker with Parental Handle and Musical Rocker',
          'Fisher-Price Baby Musical Kick and Play Piano Gym'
        ]
      },
      {
        id: 'soft_toys_dolls',
        label: 'Soft Toys & Action Figures',
        queries: [
          'Mirada Big Soft Teddy Bear 4 feet Soft Plush Toy',
          'Barbie Dreamhouse Adventures Fashion Doll with Accessories',
          'Marvel Avengers Titan Hero Series Iron Man 12 Inch Action Figure'
        ]
      }
    ]
  },
  {
    id: 'books_stationery',
    label: 'Books & Stationery',
    icon: 'BookOpen',
    description: 'Bestsellers, self-help, non-fiction, notebooks and premium pens',
    subCategories: [
      {
        id: 'bestselling_fiction_nonfiction',
        label: 'Bestsellers & Self-Help',
        queries: [
          'Atomic Habits by James Clear Paperback',
          'The Psychology of Money by Morgan Housel Paperback',
          'Ikigai The Japanese Secret to a Long and Happy Life Hardcover',
          'Rich Dad Poor Dad by Robert T Kiyosaki',
          'Rework by Jason Fried and David Heinemeier Hansson'
        ]
      },
      {
        id: 'notebooks_diaries',
        label: 'Notebooks & Planners',
        queries: [
          'Classmate Pulse Spiral Bound Single Line Notebook Pack of 6',
          'Factor Notes 100 GSM Hardcover Dot Grid Journal Notebook',
          'Navneet Youva Soft Bound Long Book Pack of 6'
        ]
      },
      {
        id: 'pens_writing_instruments',
        label: 'Pens & Writing Essentials',
        queries: [
          'Parker Vector Stainless Steel Chrome Trim Rollerball Pen',
          'Pilot V7 Hi-Tecpoint Liquid Ink Roller Ball Pen Pack of 3',
          'Pentel EnerGel Retractable Liquid Gel Pen 0.7mm Pack of 5',
          'Uni-ball Eye Fine Rollerball Pen 0.7mm Blue Pack of 5'
        ]
      },
      {
        id: 'art_craft_supplies',
        label: 'Art & Craft',
        queries: [
          'Faber-Castell 48 Color Triangular Watercolor Pencils with Brush',
          'Brustro Artists Acrylic Colours Set of 24 Tubes 12ml',
          'Camlin Kokuyo Artist Water Colour Cakes Set of 24'
        ]
      },
      {
        id: 'office_stationery',
        label: 'Office Stationery',
        queries: [
          'Casio MJ-12D 150 Steps Check and Correct Desktop Calculator',
          'Kangaro Desk Stapler with 1000 Staples Pin Set',
          'Scotch Magic Tape with Dispenser Clear Finish'
        ]
      }
    ]
  },
  {
    id: 'sports',
    label: 'Sports & Fitness',
    icon: 'Dumbbell',
    description: 'Cricket, badminton, gym weights, yoga mats and outdoor sports',
    subCategories: [
      {
        id: 'cricket',
        label: 'Cricket Equipment',
        queries: [
          'SG Kashmir Willow Cricket Bat Full Size Short Handle',
          'SS Kashmir Willow Cricket Bat Full Size Men',
          'Cosco Light Weight Tennis Cricket Ball Pack of 6',
          'DSC Cricket Kit Bag with External Bat Compartment'
        ]
      },
      {
        id: 'badminton',
        label: 'Badminton Rackets & Shuttles',
        queries: [
          'Yonex Nanoray 7000I Graphite Badminton Racket with Full Cover',
          'Yonex Muscle Power 29 Lite Carbon Graphite Badminton Racket',
          'Yonex Mavis 350 Nylon Shuttlecock Pack of 6 Yellow',
          'Li-Ning G-Force Superlite Carbon Fiber Badminton Racket'
        ]
      },
      {
        id: 'gym_weights_accessories',
        label: 'Dumbbells & Home Gym',
        queries: [
          'Kore PVC 20 kg Home Gym Set with Dumbbells and Rods',
          'Kobo Cast Iron Hex Dumbbells Pair 5kg',
          'Boldfit Resistance Loop Bands Set of 5 for Workout and Exercise',
          'Cockatoo Dual Action Abdominal Toning Exerciser Ab Roller'
        ]
      },
      {
        id: 'yoga_fitness_mats',
        label: 'Yoga Mats & Skipping Ropes',
        queries: [
          'Boldfit 6mm High Density Anti-Skid Yoga Mat for Men and Women with Carry Strap',
          'Strauss Anti Skid NBR Exercise Yoga Mat 10mm Thick',
          'Boldfit High Speed Skipping Rope with Tangle-Free Steel Ball Bearings'
        ]
      },
      {
        id: 'football_sports',
        label: 'Football & Basketball',
        queries: [
          'Nivia Storm Football Size 5 Heavy Duty Rubber Moulded',
          'Cosco Torino Official Match Football Size 5',
          'Spalding NBA Official Size 7 Outdoor Basketball'
        ]
      }
    ]
  },
  {
    id: 'auto',
    label: 'Auto Accessories',
    icon: 'Car',
    description: 'Helmets, dash cams, tyre inflators, car vacuum cleaners and riding gear',
    subCategories: [
      {
        id: 'riding_helmets',
        label: 'Motorcycle Helmets',
        queries: [
          'Vega Crux Open Face Helmet with Smoke Sun Visor ISI Certified',
          'Steelbird SBA-7 7Wings Full Face Helmet with Inner Smoke Sun Visor',
          'Studds Ninja Elite Flip Up Full Face Motorcycle Helmet',
          'Axor Apex Venomous Full Face Racing Motorcycle Helmet ECE Certified'
        ]
      },
      {
        id: 'car_dash_cams',
        label: 'Dash Cams & Electronics',
        queries: [
          '70mai Pro Plus+ A500S Dual Channel 2.7K Car Dash Cam with Built-in GPS',
          'DDPAI N1 Dual Dash Cam 1296P Front and 1080P Rear Recording',
          'Qubo Car Dash Camera Pro with Full HD 1080P Night Vision'
        ]
      },
      {
        id: 'tyre_inflators_pumps',
        label: 'Tyre Inflators & Pressure Gauges',
        queries: [
          'Tusa Digital Heavy Duty Fast 12V Car Tyre Inflator Air Compressor',
          'Mi Portable Electric Air Compressor 2 with Preset Pressure and LED Light',
          'Qubo Smart Tyre Inflator for Cars and Bikes with Emergency Torch'
        ]
      },
      {
        id: 'car_vacuum_wash',
        label: 'Car Care & Vacuum Cleaners',
        queries: [
          'AGARO Grand High Power Wet and Dry Car Vacuum Cleaner 12V DC',
          'Wavex Touchless Car Wash Shampoo Snow Foam 1 Litre',
          '3M Microfiber Cloth for Car Cleaning and Detailing Pack of 4',
          'Formula 1 Carnauba Liquid Car Wax and Polish 473ml'
        ]
      },
      {
        id: 'riding_gear',
        label: 'Riding Gloves & Jackets',
        queries: [
          'Rynox Urban X All Weather Motorcycle Riding Gloves with Knuckle Protection',
          'Royal Enfield Windproof Heavy Duty Waterproof Riding Jacket',
          'Motul C1 Chain Clean and C2 Chain Lube Combo Spray 400ml'
        ]
      }
    ]
  }
];

export const VALID_TAXONOMY_CATEGORIES = CATALOG_TAXONOMY.map((c) => c.id);

export function findCategoryTaxonomy(categoryId: string): CategoryTaxonomy | undefined {
  const clean = (categoryId || '').toLowerCase().trim();
  return CATALOG_TAXONOMY.find((c) => c.id === clean);
}
