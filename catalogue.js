/* CATALOGUE : 10 articles par marque (avec les produits déjà présents dans app.js).
   ⚠ Les PRIX ci-dessous sont des estimations de départ : à corriger dans la page « Gestion ».
   Photos : déposez images/produits/<id>.jpg (l'id = nom en minuscules avec des tirets, visible dans Gestion).
   Tant qu'une photo manque, une vignette élégante aux couleurs de la marque s'affiche. */
const BRANDS = [
  { id: 'infinix', label: 'Infinix', match: 'Infinix', color: '#0b5d3b' },
  { id: 'tecno', label: 'Tecno', match: 'Tecno', color: '#1459c9' },
  { id: 'iphone', label: 'iPhone', match: 'Apple', color: '#2b2b30' },
  { id: 'samsung', label: 'Samsung', match: 'Samsung', color: '#14357a' },
  { id: 'nasco', label: 'Nasco', match: 'Nasco', color: '#c4161c' },
  { id: 'ilux', label: 'Ilux', match: 'Ilux', color: '#6b2fa0' },
  { id: 'smart', label: 'Smart', match: 'Smart', color: '#0f7c8a' }
];
// [marque, série, nom, catégorie, prix FCFA, stock, drapeaux : o=promo p=populaire n=nouveau]
const RAW = [
  ['infinix', 'Smart', 'Infinix Smart 8', 'smartphones', 65000, 20, 'p'],
  ['infinix', 'Smart', 'Infinix Smart 9', 'smartphones', 75000, 18, 'n'],
  ['infinix', 'Hot', 'Infinix Hot 30', 'smartphones', 90000, 14, 'po'],
  ['infinix', 'Hot', 'Infinix Hot 50i', 'smartphones', 95000, 16, 'n'],
  ['infinix', 'Note', 'Infinix Note 30', 'smartphones', 115000, 10, 'o'],
  ['infinix', 'Note', 'Infinix Note 40', 'smartphones', 140000, 11, 'p'],
  ['infinix', 'Zero', 'Infinix Zero Flip', 'smartphones', 480000, 3, 'n'],
  ['infinix', 'GT', 'Infinix GT 20 Pro', 'smartphones', 260000, 5, 'n'],
  ['tecno', 'Pop', 'Tecno Pop 8', 'smartphones', 55000, 22, 'p'],
  ['tecno', 'Spark', 'Tecno Spark Go 1', 'smartphones', 60000, 20, 'o'],
  ['tecno', 'Spark', 'Tecno Spark 40', 'smartphones', 120000, 15, 'pn'],
  ['tecno', 'Spark', 'Tecno Spark 30', 'smartphones', 105000, 12, 'n'],
  ['tecno', 'Camon', 'Tecno Camon 30', 'smartphones', 150000, 9, 'po'],
  ['tecno', 'Camon', 'Tecno Camon 40 Pro', 'smartphones', 220000, 6, 'n'],
  ['tecno', 'Pova', 'Tecno Pova 6 Pro', 'smartphones', 175000, 7, ''],
  ['tecno', 'Phantom', 'Tecno Phantom X2', 'smartphones', 330000, 3, ''],
  ['iphone', 'iPhone 11', 'Apple iPhone 11', 'smartphones', 150000, 8, 'o'],
  ['iphone', 'iPhone 12', 'Apple iPhone 12', 'smartphones', 190000, 7, 'p'],
  ['iphone', 'iPhone 13', 'Apple iPhone 13', 'smartphones', 260000, 6, 'p'],
  ['iphone', 'iPhone 14', 'Apple iPhone 14 Pro', 'smartphones', 480000, 4, ''],
  ['iphone', 'iPhone 17', 'Apple iPhone 17 Pro', 'smartphones', 950000, 3, 'n'],
  ['iphone', 'iPhone 15', 'Apple iPhone 15', 'smartphones', 450000, 4, 'p'],
  ['iphone', 'iPhone 16', 'Apple iPhone 16', 'smartphones', 620000, 3, 'n'],
  ['iphone', 'iPhone Air', 'Apple iPhone Air', 'smartphones', 800000, 2, 'n'],
  ['samsung', 'Galaxy A', 'Samsung Galaxy A05', 'smartphones', 70000, 18, 'o'],
  ['samsung', 'Galaxy A', 'Samsung Galaxy A15', 'smartphones', 105000, 14, 'p'],
  ['samsung', 'Galaxy A', 'Samsung Galaxy A25 5G', 'smartphones', 150000, 10, ''],
  ['samsung', 'Galaxy A', 'Samsung Galaxy A35 5G', 'smartphones', 200000, 8, 'p'],
  ['samsung', 'Galaxy S', 'Samsung Galaxy S23', 'smartphones', 420000, 4, 'o'],
  ['samsung', 'Galaxy S', 'Samsung Galaxy S24', 'smartphones', 520000, 3, ''],
  ['samsung', 'Galaxy S', 'Samsung Galaxy S25 Ultra', 'smartphones', 900000, 2, 'n'],
  ['samsung', 'Galaxy Z', 'Samsung Galaxy Z Flip 5', 'smartphones', 450000, 2, ''],
  ['samsung', 'Galaxy Tab', 'Samsung Galaxy Tab A9', 'smartphones', 120000, 6, ''],
  ['nasco', 'Téléviseurs', 'Nasco TV LED 32\'\' HD', 'televiseurs', 75000, 12, 'p'],
  ['nasco', 'Téléviseurs', 'Nasco Smart TV 50\'\' 4K', 'televiseurs', 200000, 6, 'o'],
  ['nasco', 'Téléviseurs', 'Nasco Smart TV 55\'\' 4K', 'televiseurs', 240000, 5, ''],
  ['nasco', 'Audio', 'Nasco Enceinte Bluetooth portable', 'accessoires', 35000, 10, 'n'],
  ['nasco', 'Froid', 'Nasco Réfrigérateur combiné', 'refrigerateurs', 190000, 6, 'p'],
  ['nasco', 'Froid', 'Nasco Congélateur coffre', 'refrigerateurs', 175000, 5, ''],
  ['nasco', 'Climatisation', 'Nasco Climatiseur Split R32', 'climatiseurs', 160000, 7, 'o'],
  ['nasco', 'Lavage', 'Nasco Machine à laver frontale', 'lavage', 165000, 5, ''],
  ['nasco', 'Petit électroménager', 'Nasco Bouilloire inox', 'electromenager', 18000, 15, 'p'],
  ['ilux', 'Téléviseurs', 'Ilux Smart TV 43\'\' Full HD', 'televiseurs', 140000, 8, 'p'],
  ['ilux', 'Froid', 'Ilux Réfrigérateur combiné', 'refrigerateurs', 230000, 4, ''],
  ['ilux', 'Froid', 'Ilux Congélateur coffre', 'refrigerateurs', 150000, 6, 'o'],
  ['ilux', 'Climatisation', 'Ilux Climatiseur Split', 'climatiseurs', 195000, 5, 'p'],
  ['ilux', 'Ventilation', 'Ilux Ventilateur sur pied blanc', 'climatiseurs', 28000, 12, 'p'],
  ['ilux', 'Ventilation', 'Ilux Ventilateur sur pied noir et rouge', 'climatiseurs', 32000, 10, ''],
  ['ilux', 'Cuisson', 'Ilux Cuisinière 4 feux gaz avec four', 'electromenager', 110000, 5, 'p'],
  ['ilux', 'Petit électroménager', 'Ilux Bouilloire inox', 'electromenager', 15000, 15, 'o'],
  ['ilux', 'Petit électroménager', 'Ilux Blender', 'electromenager', 45000, 10, 'n'],
  ['ilux', 'Audio', 'Ilux Système home cinéma', 'accessoires', 95000, 5, 'p'],
  ['smart', 'Téléviseurs', 'Smart TV Google TV', 'televiseurs', 185000, 6, 'pn'],
  ['smart', 'Téléviseurs', 'Smart Téléviseur LED', 'televiseurs', 120000, 8, 'p'],
  ['smart', 'Froid', 'Smart Réfrigérateur 2 portes', 'refrigerateurs', 170000, 6, 'p'],
  ['smart', 'Froid', 'Smart Mini réfrigérateur 2 portes', 'refrigerateurs', 95000, 6, 'o'],
  ['smart', 'Ventilation', 'Smart Ventilateur sur pied télécommande', 'climatiseurs', 45000, 10, 'n'],
  ['smart', 'Ventilation', 'Smart Ventilateur sur pied noir', 'climatiseurs', 32000, 12, 'p'],
  ['smart', 'Ventilation', 'Smart Ventilateur mural', 'climatiseurs', 28000, 10, ''],
  ['smart', 'Cuisson', 'Smart Cuisinière 4 feux gaz', 'electromenager', 90000, 7, ''],
  ['smart', 'Petit électroménager', 'Smart Bouilloire inox', 'electromenager', 18000, 20, 'o'],
  ['smart', 'Petit électroménager', 'Smart Fer à repasser vapeur', 'electromenager', 12000, 20, '']
];
const WAR = { infinix: '12 mois de garantie Carlcare', tecno: '13 mois de garantie Carlcare', iphone: '3 mois de garantie en boutique', samsung: '12 mois de garantie officielle Samsung', nasco: '12 mois de garantie', ilux: '12 mois de garantie', smart: '12 mois de garantie' };
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DESC = {
  'tecno-spark-40': 'Le Tecno Spark 40 : design fin de 7,67 mm, grand écran 6,67 pouces 120 Hz et batterie 5 200 mAh avec charge rapide 45 W. Original, garanti Carlcare.',
  'samsung-galaxy-s25-ultra': 'Le haut de gamme Samsung : écran 6,9 pouces Dynamic AMOLED 2X 120 Hz, capteur principal 200 MP, S Pen intégré et puissance Snapdragon 8 Elite for Galaxy. Original, garantie officielle Samsung.',
  'infinix-zero-flip': "Le smartphone pliable à clapet d'Infinix : grand écran AMOLED 120 Hz et mini-écran externe pour les notifications et les selfies."
};
const SPECS = {
  'tecno-spark-40': { 'Écran': "6,67'' 120 Hz", 'Épaisseur': '7,67 mm', 'Batterie': '5 200 mAh, charge 45 W', 'Appareil photo': '50 MP' },
  'samsung-galaxy-s25-ultra': { 'Écran': "6,9'' Dynamic AMOLED 2X 120 Hz", 'Processeur': 'Snapdragon 8 Elite for Galaxy', 'Appareil photo': 'Principal 200 MP', 'Stylet': 'S Pen intégré', 'Batterie': '5 000 mAh' },
  'infinix-zero-flip': { 'Format': 'Pliable à clapet', 'Écrans': 'AMOLED 120 Hz + écran externe' }
};
const EXTRA_PRODUCTS = RAW.map((r) => {
  const b = BRANDS.find((x) => x.id === r[0]), id = slug(r[2]);
  return { id, name: r[2], category: r[3], brand: b.match, series: r[1], price: r[4], originalPrice: r[6].includes('o') ? Math.round(r[4] * 1.1 / 1000) * 1000 : undefined,
    isPromo: r[6].includes('o'), isPopular: r[6].includes('p'), isNew: r[6].includes('n'), inStock: true, stockCount: r[5], image: 'images/produits/' + id + '.jpg',
    warranty: WAR[r[0]], description: DESC[id] || (r[2] + ' : produit original ' + b.label + ' (série ' + r[1] + '), vérifié devant vous avant paiement.'), specs: SPECS[id] || {} };
});
