# 🔬 VoiceCart Image Pipeline Diagnostic Report (100 Products)

> **Scope:** Audit of 100 products across all categories (all, mobiles, electronics, fashion, footwear, beauty, home, appliances), live search queries (iPhone 15, boAt earbuds, Samsung TV, shoes, mixer grinder), multi-store comparison, user cart, and past orders.

## 1. Executive Summary & Failure Classification

| Failure Reason | Count | Percentage | Primary Root Cause |
| :--- | :---: | :---: | :--- |
| **http_error (404/410)** | 57 | 57.0% | Stale/dead Amazon image ASIN hashes in fallback catalog returning HTTP 404 Not Found |
| **wrong_product (Stock Photo)** | 25 | 25.0% | Hardcoded Unsplash stock images assigned across past orders and search fallbacks |
| **timeout** | 8 | 8.0% | Unresponsive or heavily throttled asset CDNs taking > 5000ms |
| **valid_unique** | 10 | 10.0% | Real, unique, working product CDN image |
| **duplicate_image (Catalog-wide)** | 46 URLs | - | 46 distinct image URLs are cross-assigned to between 2 and 12 different products simultaneously |

### Breakdown by Store

| Store | Total Inspected | Valid Unique | HTTP Error (404) | Timeout | Stock/Wrong Image |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **AMAZON** | 26 | 6 | 19 | 0 | 1 |
| **FLIPKART** | 27 | 4 | 16 | 4 | 3 |
| **MEESHO** | 26 | 0 | 22 | 4 | 0 |
| **VOICECART** | 21 | 0 | 0 | 0 | 21 |

### Breakdown by Category / Source

| Category / Source | Sampled | Valid Unique | HTTP 404 | Timeout | Stock/Wrong Product |
| :--- | :---: | :---: | :---: | :---: | :---: |
| all | 9 | 4 | 5 | 0 | 0 |
| mobiles | 7 | 2 | 5 | 0 | 0 |
| electronics | 12 | 4 | 7 | 1 | 0 |
| fashion | 9 | 0 | 9 | 0 | 0 |
| footwear | 9 | 0 | 9 | 0 | 0 |
| beauty | 9 | 0 | 9 | 0 | 0 |
| home | 9 | 0 | 8 | 1 | 0 |
| appliances | 11 | 0 | 5 | 6 | 0 |
| iphone 15 | 1 | 0 | 0 | 0 | 1 |
| wireless earbuds boat | 2 | 0 | 0 | 0 | 2 |
| samsung smart tv | 1 | 0 | 0 | 0 | 1 |
| past_orders | 21 | 0 | 0 | 0 | 21 |

## 2. Validator Strictness & Allowed CDN Analysis

- **Validator Rule That Removes The Most Images:** Rejecting images without checking HTTP status, or relying on unverified static strings.
- **Overly Strict CDN Whitelists:** Several genuine merchant and thumbnail CDNs (`rukminim2.flixcart.com`, `encrypted-tbn0.gstatic.com` from Google Shopping, `images.meesho.com`, and `m.media-amazon.com`) must be explicitly allow-listed. In SerpApi responses, valid Google Shopping thumbnails are often 120px to 300px; rejecting thumbnails under 400px discards 100% of live Google Shopping / SerpApi thumbnail results.
- **Two-Tier Solution Needed:** Acceptable thumbnails (>= 120px) should display immediately, while full high-res images (>= 400px) are resolved or upgraded in the background.

## 3. Comprehensive 100-Product Audit Table

| # | Store | Product ID | Title | Raw Provider Image Fields | Chosen URL | Status / Failure Reason |
| -: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | amazon | `amz_apple_iphone_15_128gb` | Apple iPhone 15 (128 GB) - Black... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71d7rfSl0...` | ✅ valid_unique (200 OK) |
| 2 | amazon | `amz_boat_airdopes_141_bla` | boAt Airdopes 141 Bluetooth Truly Wirele... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51HBom8xz...` | ✅ valid_unique (200 OK) |
| 3 | amazon | `amz_samsung_43_inch_cryst` | Samsung 108 cm (43 inches) Crystal 4K Vi... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71RXCZu63...` | ❌ http_error (404) |
| 4 | flipkart | `fk_oppo_k14x_5g_icy_blue_` | OPPO K14x 5G (Icy Blue, 64 GB) (4 GB RAM... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81Os1SDWp...` | ✅ valid_unique (200 OK) |
| 5 | flipkart | `fk_noise_colorfit_pulse_3` | Noise ColorFit Pulse 3 with 1.96" TFT Di... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61SSVxTSs...` | ✅ valid_unique (200 OK) |
| 6 | flipkart | `fk_levis_mens_slim_fit_je` | Levi's Men's 511 Slim Fit Low Rise Stret... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81vYk7L+N...` | ❌ http_error (404) |
| 7 | meesho | `meesho_realme_p4r_5g_spee` | realme P4R 5G (Speed Blue, 128 GB Storag... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71Ge91v64...` | ❌ http_error (404) |
| 8 | meesho | `meesho_livesmart_4_fold_u` | Livesmart 4 Fold Automatic Windproof Rai... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61w8tG24u...` | ❌ http_error (404) |
| 9 | meesho | `meesho_m10_tws_wireless_e` | M10 TWS Bluetooth Wireless Earbuds with ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51NqFhBvH...` | ❌ http_error (404) |
| 10 | amazon | `amz_samsung_galaxy_m35_5g` | Samsung Galaxy M35 5G (Moonlight Blue, 6... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81x594W6n...` | ❌ http_error (404) |
| 11 | amazon | `amz_oneplus_nord_ce4_5g_d` | OnePlus Nord CE4 (Dark Chrome, 8GB RAM, ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61abLrCfF...` | ✅ valid_unique (200 OK) |
| 12 | flipkart | `fk_realme_12_plus_5g_pion` | realme 12+ 5G (Pioneer Green, 128 GB) (8... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71V--WZVU...` | ✅ valid_unique (200 OK) |
| 13 | flipkart | `fk_motorola_edge_50_fusio` | Motorola Edge 50 Fusion (Marshmallow Blu... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/712y2Vl2a...` | ❌ http_error (404) |
| 14 | meesho | `meesho_oppo_k14x_5g_icy_b` | OPPO K14x 5G (Icy Blue, 64 GB Storage, 4... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81wOuL90g...` | ❌ http_error (404) |
| 15 | meesho | `meesho_redmi_13c_5g_start` | Redmi 13C 5G (Startrail Black, 128 GB St... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71c8lB4Q1...` | ❌ http_error (404) |
| 16 | amazon | `amz_sony_wh1000xm4_anc_he` | Sony WH-1000XM4 Wireless Industry Leadin... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51SKmu2G9...` | ✅ valid_unique (200 OK) |
| 17 | amazon | `amz_mi_20000mah_power_ban` | Xiaomi 20000mAh Power Bank 3i with 18W F... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71lVwl3q-...` | ✅ valid_unique (200 OK) |
| 18 | amazon | `amz_apple_ipad_10th_gen_b` | Apple iPad (10th Generation): with A14 B... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61uA2UVnY...` | ✅ valid_unique (200 OK) |
| 19 | flipkart | `fk_boat_stone_352_bluetoo` | boAt Stone 352 10W Portable Bluetooth Sp... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61kWB+bVL...` | ❌ http_error (404) |
| 20 | flipkart | `fk_realme_10000mah_30w_da` | realme 10000 mAh 30W Dart Charge Power B... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61lV2q7Zz...` | ❌ http_error (404) |
| 21 | flipkart | `fk_samsung_galaxy_tab_a9_` | Samsung Galaxy Tab A9+ (11.0 inch, 64 GB... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71k4v7GvI...` | ❌ timeout (TIMEOUT) |
| 22 | meesho | `meesho_wireless_bluetooth` | WS-858 Wireless Bluetooth Handheld Karao... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61j1r7-z7...` | ❌ http_error (404) |
| 23 | meesho | `meesho_mini_portable_ther` | Mini Portable Wireless Bluetooth Thermal... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51o+y31+V...` | ❌ http_error (404) |
| 24 | meesho | `meesho_rgb_sound_reactive` | RGB Sound Reactive 32-Bit Voice Activate... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61Z7eG-y8...` | ❌ http_error (404) |
| 25 | amazon | `amz_symbol_mens_cotton_sh` | Amazon Brand - Symbol Men's Regular Fit ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71-6C3WvU...` | ❌ http_error (404) |
| 26 | amazon | `amz_allen_solly_mens_polo` | Allen Solly Men's Regular Fit Solid Polo... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61NvhV514...` | ❌ http_error (404) |
| 27 | amazon | `amz_us_polo_mens_slim_fit` | U.S. POLO ASSN. Men's Slim Fit Cotton Ch... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71xNqX3f5...` | ❌ http_error (404) |
| 28 | flipkart | `fk_peter_england_mens_sli` | Peter England Men's Slim Fit Full Sleeve... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71P4U7N1k...` | ❌ http_error (404) |
| 29 | flipkart | `fk_highlander_mens_slim_f` | HIGHLANDER Men's Slim Fit Cotton Stretch... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71g6NqXvY...` | ❌ http_error (404) |
| 30 | meesho | `meesho_womens_cotton_anar` | Women's Pure Cotton Printed Anarkali Kur... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81hOqT4B3...` | ❌ http_error (404) |
| 31 | meesho | `meesho_mens_oversized_cot` | Men's Oversized Fit 100% Pure Cotton Typ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/6125yA88e...` | ❌ http_error (404) |
| 32 | meesho | `meesho_bollywood_georgett` | Bollywood Style Pure Georgette Sequence ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81dGqT4eW...` | ❌ http_error (404) |
| 33 | amazon | `amz_puma_softride_pro_sho` | Puma Men's Softride Pro Walking & Runnin... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61+y5w9w2...` | ❌ http_error (404) |
| 34 | amazon | `amz_nike_revolution_7_run` | Nike Men's Revolution 7 Road Running & J... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71d1V1p-o...` | ❌ http_error (404) |
| 35 | amazon | `amz_red_tape_mens_sneaker` | Red Tape Men's Classic Casual Sneaker Sh... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61uK7G3j9...` | ❌ http_error (404) |
| 36 | flipkart | `fk_sparx_mens_running_sho` | Sparx Men's Lightweight Mesh Walking & R... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71W8c9gQn...` | ❌ http_error (404) |
| 37 | flipkart | `fk_asian_wonder_13_runnin` | Asian Men's Wonder-13 Lightweight Mesh S... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61b7L4B6z...` | ❌ http_error (404) |
| 38 | flipkart | `fk_campus_first_running_s` | Campus Men's FIRST Running & Gym Trainin... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61q24N49y...` | ❌ http_error (404) |
| 39 | meesho | `meesho_mens_trendy_chunky` | Men's Trendy Chunky White Streetwear Cas... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61dC481+y...` | ❌ http_error (404) |
| 40 | meesho | `meesho_lightweight_mesh_g` | Men's Ultra-Lightweight Breathable Mesh ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61fK2R56t...` | ❌ http_error (404) |
| 41 | meesho | `meesho_classic_mens_leath` | Men's Classic Slip-On Driving Loafers Ca... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71Gq5N43e...` | ❌ http_error (404) |
| 42 | amazon | `amz_minimalist_2pct_salic` | Minimalist 2% Salicylic Acid Face Serum ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61u9o1mDq...` | ❌ http_error (404) |
| 43 | amazon | `amz_cetaphil_gentle_skin_` | Cetaphil Gentle Skin Cleanser for Dry to... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51rP0i12L...` | ❌ http_error (404) |
| 44 | amazon | `amz_mamaearth_onion_hair_` | Mamaearth Onion Hair Oil for Hair Fall C... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61jC+kZkI...` | ❌ http_error (404) |
| 45 | flipkart | `fk_plum_green_tea_oil_fre` | Plum Green Tea Oil-Free Moisturizer with... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51a3hXq1Q...` | ❌ http_error (404) |
| 46 | flipkart | `fk_biotique_morning_necta` | Biotique Morning Nectar Flawless Skin No... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61R48kG1c...` | ❌ http_error (404) |
| 47 | flipkart | `fk_maybelline_superstay_m` | Maybelline New York Super Stay Matte Ink... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51o7b4K2a...` | ❌ http_error (404) |
| 48 | meesho | `meesho_12_shade_matte_nud` | 12-Shade Waterproof Long Lasting Matte L... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61e-U7y01...` | ❌ http_error (404) |
| 49 | meesho | `meesho_vitamin_c_face_ser` | Vitamin C 20% Glowing Face Serum with Hy... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51z548P1b...` | ❌ http_error (404) |
| 50 | meesho | `meesho_organic_rose_water` | Pure Organic Gulab Jal / Rose Water Faci... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/51e3Fq88y...` | ❌ http_error (404) |
| 51 | amazon | `amz_livesmart_4_fold_umbr` | Livesmart 4 Fold Windproof Automatic Ope... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61mZzS47X...` | ❌ http_error (404) |
| 52 | amazon | `amz_solimo_microfibre_rev` | Amazon Brand - Solimo Microfibre Reversi... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/81Wb2iQ4a...` | ❌ http_error (404) |
| 53 | flipkart | `fk_story_at_home_blackout` | Story@Home 100% Blackout Solid Door Curt... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71wL1X-gJ...` | ❌ http_error (404) |
| 54 | flipkart | `fk_wakefit_sleeping_pillo` | Wakefit Hollow Fiber Sleeping Pillows (S... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61rR38p6y...` | ❌ http_error (404) |
| 55 | flipkart | `fk_pigeon_handy_mini_chop` | Pigeon Polypropylene Handy Mini Plastic ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71D0b2r1u...` | ❌ http_error (404) |
| 56 | meesho | `meesho_floral_glace_cotto` | All Around Elastic Fitted Pure Glace Cot... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71oO84P1y...` | ❌ timeout (TIMEOUT) |
| 57 | meesho | `meesho_3tier_kitchen_modu` | 3-Tier Multi-Purpose Modular Kitchen Veg... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61v-v+5vF...` | ❌ http_error (404) |
| 58 | amazon | `amz_philips_air_fryer_hd9` | Philips Daily Collection 4.1L Rapid Air ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61P4c7bK8...` | ❌ http_error (404) |
| 59 | amazon | `amz_bajaj_rex_500w_mixer_` | Bajaj Rex 500W Mixer Grinder with Nutri-... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71y684G1e...` | ❌ http_error (404) |
| 60 | flipkart | `fk_lg_7kg_5star_washing_m` | LG 7.0 Kg 5 Star Smart Inverter Fully-Au... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71m4+7xP-...` | ❌ timeout (TIMEOUT) |
| 61 | flipkart | `fk_godrej_180l_4star_refr` | Godrej 180 L 4 Star Advanced Inverter Di... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61V1h4-s2...` | ❌ timeout (TIMEOUT) |
| 62 | flipkart | `fk_prestige_iris_750w_mix` | Prestige IRIS 750 Watt Mixer Grinder wit... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71fL9Wz7Z...` | ❌ timeout (TIMEOUT) |
| 63 | meesho | `meesho_portable_single_st` | Heavy Duty 1000W Electric Cooking Stove ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61t78N24e...` | ❌ timeout (TIMEOUT) |
| 64 | meesho | `meesho_handheld_garment_s` | Portable Handheld Garment Steamer 1000W ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61g6Yq4Zz...` | ❌ timeout (TIMEOUT) |
| 65 | meesho | `meesho_electric_egg_boile` | Automatic Electric Egg Boiler and Poache... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61t7q4Yy2...` | ❌ timeout (TIMEOUT) |
| 66 | flipkart | `fk_apple_iphone_15_128gb_` | Apple iPhone 15 (Black, 128 GB)... | images[1], fallbackCatalogImageUrl | `https://images.unsplash.com/photo-16950481331...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 67 | amazon | `amz_boat_airdopes_141_anc` | boAt Airdopes 141 ANC TWS Earbuds with 3... | images[2], fallbackCatalogImageUrl | `https://images.unsplash.com/photo-16062205889...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 68 | flipkart | `fk_boat_airdopes_141_blac` | boAt Airdopes 141 with 42 hrs Playtime, ... | images[2], fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15906582680...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 69 | flipkart | `fk_samsung_43_inch_crysta` | SAMSUNG Crystal 4K Vivid 108 cm (43 inch... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15933596778...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 70 | voicecart | `order_DEMO_1791655972244` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 71 | voicecart | `order_DEMO_1791544464422` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 72 | voicecart | `order_DEMO_1791544317482` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 73 | voicecart | `order_DEMO_1791544163369` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 74 | voicecart | `order_DEMO_1791544086502` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 75 | voicecart | `order_DEMO_1791539273740` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 76 | voicecart | `order_DEMO_1791538511532` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 77 | voicecart | `order_DEMO_1791538437038` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 78 | voicecart | `order_DEMO_1791526771448` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 79 | voicecart | `order_DEMO_1791526695615` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 80 | voicecart | `order_DEMO_1791525449365` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 81 | voicecart | `order_DEMO_1791524852890` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 82 | voicecart | `order_DEMO_1791524803335` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 83 | voicecart | `order_DEMO_1791524721075` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 84 | voicecart | `order_DEMO_1791523162237` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 85 | voicecart | `order_DEMO_1791523100977` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 86 | voicecart | `order_DEMO_1791486569470` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 87 | voicecart | `order_DEMO_1791486476678` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 88 | voicecart | `order_DEMO_1791486141945` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 89 | voicecart | `order_DEMO_1791484333309` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 90 | voicecart | `order_DEMO_1791484291064` | VoiceCart SoundMax Pro... | fallbackCatalogImageUrl | `https://images.unsplash.com/photo-15232753356...` | ❌ wrong_product (Unsplash placeholder stock photo assigned to product) |
| 91 | amazon | `amz_kent_grand_ro_water_p` | KENT Grand RO Water Purifier - 8L Tank -... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61H4h5+Xb...` | ❌ http_error (404) |
| 92 | flipkart | `fk_crompton_ozone_75l_des` | Crompton Ozone 75 Litres Desert Air Cool... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61K5Q-2gV...` | ❌ http_error (404) |
| 93 | meesho | `meesho_usb_rechargeable_p` | USB Rechargeable Portable Mini Electric ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61w7sY2w2...` | ❌ http_error (404) |
| 94 | amazon | `amz_milton_thermosteel_du` | Milton Thermosteel Duo Deluxe 1000 ml Va... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71U1Q1f1G...` | ❌ http_error (404) |
| 95 | meesho | `meesho_ultrasonic_aroma_d` | Ultrasonic Essential Oil Aromatherapy Di... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61b7L4P2t...` | ❌ http_error (404) |
| 96 | meesho | `meesho_cotton_linen_casua` | Men's Solid Pure Cotton Linen Mandarin C... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61vYk8N2y...` | ❌ http_error (404) |
| 97 | amazon | `amz_jbl_flip_6_portable_b` | JBL Flip 6 Wireless Portable Bluetooth S... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61s780f2d...` | ❌ http_error (404) |
| 98 | flipkart | `fk_boat_rockerz_450_bluet` | boAt Rockerz 450 with 15 Hours Battery, ... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/61u1VALn6...` | ✅ valid_unique (200 OK) |
| 99 | meesho | `meesho_10000mah_slim_pock` | 10000 mAh Ultra Slim Dual Output Fast Ch... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71VfGg-xG...` | ❌ http_error (404) |
| 100 | amazon | `amz_redmi_note_13_pro_5g_` | Redmi Note 13 Pro 5G (Midnight Black, 8G... | images[1], fallbackCatalogImageUrl | `https://m.media-amazon.com/images/I/71dWgCHn1...` | ❌ http_error (404) |
