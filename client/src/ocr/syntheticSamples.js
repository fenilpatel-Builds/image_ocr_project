/**
 * Synthetic Test Documents Generator
 * Renders realistic, high-resolution test documents onto an HTML5 Canvas.
 * ZERO REAL PII: Uses 100% fictional test data adhering to ICAO MRZ and accounting formats.
 * Produces genuine File/Blob instances that undergo real client-side Tesseract.js OCR.
 */

// Helper to convert canvas to File
function canvasToFile(canvas, fileName) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.98);
  });
}

// 1. Synthetic Commercial Tax Invoice
export async function generateSampleInvoice() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header bar
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, canvas.width, 16);

  // Company info
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('APEX CLOUD TECHNOLOGIES PVT LTD', 70, 90);

  ctx.fillStyle = '#475569';
  ctx.font = '18px sans-serif';
  ctx.fillText('84 Cyber Gateway, Tech Park Sector 5', 70, 125);
  ctx.fillText('Bengaluru, Karnataka 560103, India', 70, 150);
  ctx.fillText('Email: billing@apexcloud.io | Phone: +91 80 4455 6677', 70, 175);
  ctx.fillText('GSTIN: 29ABCDE1234F1Z5', 70, 200);

  // Big "TAX INVOICE" header
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('TAX INVOICE', 820, 95);

  // Invoice metadata box
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(780, 120, 350, 110);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Invoice Number:', 800, 155);
  ctx.font = '18px sans-serif';
  ctx.fillText('INV-2026-8842', 960, 155);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Invoice Date:', 800, 185);
  ctx.font = '18px sans-serif';
  ctx.fillText('15/10/2026', 960, 185);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Due Date:', 800, 215);
  ctx.font = '18px sans-serif';
  ctx.fillText('30/10/2026', 960, 215);

  // Separator
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(70, 245);
  ctx.lineTo(1130, 245);
  ctx.stroke();

  // Bill To section
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('BILL TO:', 70, 285);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Rahul Patel', 70, 320);
  ctx.fillStyle = '#475569';
  ctx.font = '18px sans-serif';
  ctx.fillText('Horizon Enterprises LLP', 70, 350);
  ctx.fillText('12 MG Road, Fort, Mumbai 400001', 70, 375);
  ctx.fillText('Email: rahul.patel@horizoncorp.in', 70, 400);

  // Line items table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(70, 440, 1060, 45);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(70, 440, 1060, 45);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('ITEM DESCRIPTION', 90, 470);
  ctx.fillText('QTY', 660, 470);
  ctx.fillText('UNIT RATE', 780, 470);
  ctx.fillText('AMOUNT', 980, 470);

  // Rows
  const items = [
    { desc: 'Enterprise Cloud Hosting (Annual)', qty: '1', rate: '₹ 35,000.00', total: '₹ 35,000.00' },
    { desc: 'Managed SSL Certificate & CDN Tier 1', qty: '2', rate: '₹ 4,500.00', total: '₹ 9,000.00' },
    { desc: 'Database Automated Backup Cluster', qty: '1', rate: '₹ 11,000.00', total: '₹ 11,000.00' }
  ];

  let y = 525;
  items.forEach((item, index) => {
    ctx.fillStyle = '#1e293b';
    ctx.font = '18px sans-serif';
    ctx.fillText(item.desc, 90, y);
    ctx.fillText(item.qty, 675, y);
    ctx.fillText(item.rate, 780, y);
    ctx.fillText(item.total, 970, y);

    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(70, y + 20);
    ctx.lineTo(1130, y + 20);
    ctx.stroke();

    y += 55;
  });

  // Totals box
  const totalsY = 740;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(700, totalsY, 430, 210);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(700, totalsY, 430, 210);

  ctx.fillStyle = '#475569';
  ctx.font = '18px sans-serif';
  ctx.fillText('Subtotal:', 730, totalsY + 40);
  ctx.fillText('₹ 55,000.00', 970, totalsY + 40);

  ctx.fillText('GST (18%):', 730, totalsY + 80);
  ctx.fillText('₹ 9,900.00', 970, totalsY + 80);

  ctx.fillText('Discount (Special):', 730, totalsY + 120);
  ctx.fillText('- ₹ 2,500.00', 960, totalsY + 120);

  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(720, totalsY + 145);
  ctx.lineTo(1110, totalsY + 145);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Total Amount:', 730, totalsY + 185);
  ctx.fillText('₹ 62,400.00', 950, totalsY + 185);

  // Footer notes
  ctx.fillStyle = '#64748b';
  ctx.font = '15px sans-serif';
  ctx.fillText('Payment Terms: Net 15 days. Please make checks payable to Apex Cloud Technologies Pvt Ltd.', 70, 1100);
  ctx.fillText('Bank Transfer: HDFC Bank | Account: 50200012345678 | IFSC: HDFC0001234', 70, 1130);
  ctx.fillText('Thank you for your business!', 70, 1170);

  return await canvasToFile(canvas, 'sample_commercial_invoice.jpg');
}

// 2. Synthetic Passport Information Page with ICAO 9303 MRZ
export async function generateSamplePassport() {
  const canvas = document.createElement('canvas');
  canvas.width = 1250;
  canvas.height = 880;
  const ctx = canvas.getContext('2d');

  // Passport page background (light pastel security pattern simulation)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border & subtle guilloche border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Header
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('REPUBLIC OF UTOPIA / PASSPORT', 80, 90);

  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  ctx.fillText('PASSEPORT', 80, 120);

  // Photo Box Placeholder
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(80, 160, 240, 300);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(80, 160, 240, 300);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('[ PHOTO SPECIMEN ]', 105, 310);

  // Visual Details Fields
  const drawField = (label, value, x, y) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(value, x, y + 25);
  };

  drawField('Type / Type', 'P', 380, 180);
  drawField('Country Code / Code Pays', 'UTO', 550, 180);
  drawField('Passport No / No du Passeport', 'A12345678', 800, 180);

  drawField('Surname / Nom', 'ERIKSSON', 380, 250);
  drawField('Given Names / Prenoms', 'ANNA MARIA', 380, 320);

  drawField('Nationality / Nationalite', 'UTOPIAN', 380, 390);
  drawField('Date of Birth / Date de Naissance', '12 AUG 1985', 680, 390);

  drawField('Sex / Sexe', 'F', 380, 460);
  drawField('Place of Birth / Lieu de Naissance', 'UTOPIA CITY', 550, 460);
  drawField('Date of Expiry / Date d expiration', '15 APR 2032', 800, 460);

  // Machine Readable Zone (MRZ) Section
  // Bottom 2 lines in OCR-B font simulation
  const mrzY = 660;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, mrzY - 30, canvas.width - 80, 180);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(40, mrzY - 30, canvas.width - 80, 180);

  // 2 Lines of standard 44-character ICAO Doc 9303 Type 3 MRZ:
  // Line 1: P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
  // Line 2: A123456789UTO8508125F3204152ZE184226B<<<<<08
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 30px "JetBrains Mono", "Courier New", monospace';
  ctx.fillText('P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<', 75, mrzY + 45);
  ctx.fillText('A123456789UTO8508125F3204152ZE184226B<<<<<08', 75, mrzY + 115);

  return await canvasToFile(canvas, 'sample_fictional_passport.jpg');
}

// 3. Synthetic Retail / Cafe Receipt
export async function generateSampleReceipt() {
  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');

  // Paper background
  ctx.fillStyle = '#fffdfa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Store header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 32px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GREENBEAN ORGANIC CAFE', canvas.width / 2, 80);

  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText('Store #104 - 5th Avenue Metro Mall', canvas.width / 2, 115);
  ctx.fillText('Phone: (555) 019-2834', canvas.width / 2, 140);
  ctx.fillText('GST / Tax ID: TAX-994821', canvas.width / 2, 165);

  ctx.fillText('------------------------------------------', canvas.width / 2, 195);

  ctx.textAlign = 'left';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText('Date: 28/09/2026       Time: 14:32:10', 40, 230);
  ctx.fillText('Order Number: ORD-99214', 40, 260);
  ctx.fillText('Cashier: Alex M.       Register: #02', 40, 290);

  ctx.textAlign = 'center';
  ctx.fillText('------------------------------------------', canvas.width / 2, 320);

  // Line items
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('ITEMS', 40, 350);
  ctx.fillText('QTY', 380, 350);
  ctx.fillText('TOTAL', 500, 350);

  const items = [
    { name: 'Oat Milk Caramel Latte', qty: '2', price: '$11.50' },
    { name: 'Avocado Sourdough Toast', qty: '1', price: '$9.25' },
    { name: 'Organic Berry Muffin', qty: '1', price: '$4.75' },
    { name: 'Sparkling Mineral Water', qty: '1', price: '$3.50' }
  ];

  let y = 390;
  ctx.font = '15px "JetBrains Mono", monospace';
  items.forEach(it => {
    ctx.fillText(it.name, 40, y);
    ctx.fillText(it.qty, 395, y);
    ctx.fillText(it.price, 500, y);
    y += 40;
  });

  ctx.textAlign = 'center';
  ctx.fillText('------------------------------------------', canvas.width / 2, y + 10);

  // Totals
  y += 45;
  ctx.textAlign = 'left';
  ctx.fillText('Subtotal:', 340, y);
  ctx.fillText('$29.00', 500, y);

  y += 35;
  ctx.fillText('State Tax (8.5%):', 340, y);
  ctx.fillText('$2.47', 500, y);

  y += 35;
  ctx.fillText('Tip:', 340, y);
  ctx.fillText('$4.50', 500, y);

  y += 40;
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('Total Amount:', 300, y);
  ctx.fillText('$35.97', 500, y);

  y += 50;
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText('Payment Method: VISA CREDIT CARD', 40, y);
  ctx.fillText('Card Ending: **** **** **** 4092', 40, y + 25);
  ctx.fillText('Approval Code: APV-771029', 40, y + 50);

  ctx.textAlign = 'center';
  ctx.fillText('******************************************', canvas.width / 2, y + 100);
  ctx.fillText('Thank you for shopping at GreenBean!', canvas.width / 2, y + 130);
  ctx.fillText('Visit us at www.greenbeanorganic.com', canvas.width / 2, y + 155);

  return await canvasToFile(canvas, 'sample_retail_receipt.jpg');
}

// 4. Synthetic National ID / Driver License Card
export async function generateSampleIdCard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  // Gradient card background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rounded border
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Top header banner
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(20, 20, canvas.width - 40, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('NATIONAL IDENTITY & DRIVER LICENCE', 50, 68);

  // Photo placeholder
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(60, 130, 200, 240);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 130, 200, 240);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('[ PHOTO ]', 120, 255);

  // Details
  const drawField = (label, val, x, y) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(val, x, y + 22);
  };

  drawField('Licence / ID Number', 'DL-9842-1082491', 300, 140);
  drawField('Full Name', 'Jane Doe', 300, 200);
  drawField("Father's / Spouse Name", 'Robert Doe', 300, 260);

  drawField('Date of Birth', '14/06/1992', 300, 320);
  drawField('Gender', 'Female (F)', 540, 320);
  drawField('Blood Group', 'O Positive (O+)', 720, 320);

  drawField('Valid Till / Expiry', '18/09/2034', 300, 380);
  drawField('Issuing Authority', 'Department of Motor Vehicles, State Central', 300, 440);

  // Bottom chip / barcode simulation
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(60, 420, 120, 50);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SECURE CHIP', 70, 450);

  return await canvasToFile(canvas, 'sample_identity_license_card.jpg');
}

// 5. Synthetic Gujarati Retail Bill / રસીદ
export async function generateSampleGujaratiBill() {
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 1450;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header bar
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(0, 0, canvas.width, 16);

  // Store Name in Gujarati
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('શ્રી ગણેશ સુપર સ્ટોર', 60, 95);

  ctx.fillStyle = '#334155';
  ctx.font = '20px sans-serif';
  ctx.fillText('કર ઇન્વોઇસ / વેચાણ રસીદ (Tax Invoice)', 60, 135);
  ctx.fillText('૧૨, સરદાર પટેલ માર્કેટ, સી.જી. રોડ, અમદાવાદ - ૩૮૦૦૦૯', 60, 168);
  ctx.fillText('મોબાઇલ: 98250 12345 | ઇમેઇલ: shreeganesh@store.in', 60, 200);
  ctx.fillText('જીએસટી નં (GSTIN): 24AABCS1429B1Z8', 60, 232);

  // Metadata box
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(700, 70, 340, 175);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('બિલ નંબર:', 720, 115);
  ctx.font = '18px sans-serif';
  ctx.fillText('GS-2026-1082', 840, 115);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('તારીખ:', 720, 165);
  ctx.font = '18px sans-serif';
  ctx.fillText('05/10/2026', 840, 165);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('સમય:', 720, 215);
  ctx.font = '18px sans-serif';
  ctx.fillText('14:35:10', 840, 215);

  // Customer line
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(60, 270, 980, 60);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(60, 270, 980, 60);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('ગ્રાહકનું નામ:', 80, 308);
  ctx.font = '20px sans-serif';
  ctx.fillText('રમેશભાઈ પટેલ (Rameshbhai Patel)', 210, 308);

  // Table header
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(60, 360, 980, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('ક્રમ', 80, 392);
  ctx.fillText('વસ્તુ / વિગત (Item Description)', 160, 392);
  ctx.fillText('જથ્થો (Qty)', 660, 392);
  ctx.fillText('ભાવ (Rate)', 790, 392);
  ctx.fillText('રકમ (Total)', 930, 392);

  // Items
  const items = [
    { no: '૧', name: 'કપાસિયા તેલ (૧ લિટર)', qty: '૧', rate: '૧૪૦.૦૦', total: '૧૪૦.૦૦' },
    { no: '૨', name: 'પ્રીમિયમ ચા (૫૦૦ ગ્રામ)', qty: '૨', rate: '૧૪૦.૦૦', total: '૨૮૦.૦૦' },
    { no: '૩', name: 'બાસમતી ચોખા (૫ કિલો)', qty: '૧', rate: '૪૫૦.૦૦', total: '૪૫૦.૦૦' },
    { no: '૪', name: 'દેશી ગોળ (૧ કિલો)', qty: '૧', rate: '૬૦.૦૦', total: '૬૦.૦૦' }
  ];

  let y = 445;
  items.forEach((it, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(60, y - 30, 980, 48);

    ctx.fillStyle = '#0f172a';
    ctx.font = '18px sans-serif';
    ctx.fillText(it.no, 85, y);
    ctx.fillText(it.name, 160, y);
    ctx.fillText(it.qty, 690, y);
    ctx.fillText('₹ ' + it.rate, 790, y);
    ctx.fillText('₹ ' + it.total, 930, y);

    y += 50;
  });

  // Totals box
  y += 20;
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(600, y, 440, 180);

  ctx.fillStyle = '#334155';
  ctx.font = '18px sans-serif';
  ctx.fillText('પેટા કુલ (Subtotal):', 630, y + 40);
  ctx.fillText('₹ ૯૩૦.૦૦', 930, y + 40);

  ctx.fillText('જીએસટી (GST 5%):', 630, y + 85);
  ctx.fillText('₹ ૪૬.૫૦', 930, y + 85);

  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('કુલ રકમ (Grand Total):', 630, y + 145);
  ctx.fillText('₹ ૯૭૬.૫૦', 910, y + 145);

  // Footer greeting in Gujarati
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText('પધારવા બદલ આભાર! આપની મુલાકાત અમારા માટે આનંદદાયક છે.', 260, y + 260);

  return await canvasToFile(canvas, 'sample_gujarati_invoice_bill.jpg');
}

// 6. Synthetic Hindi Retail Bill / रसीद / कैश मेमो
export async function generateSampleHindiBill() {
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 1450;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header bar
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, canvas.width, 16);

  // Store Name in Hindi
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('श्री कृष्णा सुपरमार्ट', 60, 95);

  ctx.fillStyle = '#334155';
  ctx.font = '20px sans-serif';
  ctx.fillText('कर इनवॉइस / कैश मेमो (Retail Tax Invoice)', 60, 135);
  ctx.fillText('१५, महात्मा गांधी मार्ग, सिविल लाइंस, जयपुर - ३०२००१', 60, 168);
  ctx.fillText('मोबाइल: 98290 54321 | ईमेल: contact@krishnamart.in', 60, 200);
  ctx.fillText('जीएसटी नं (GSTIN): 08AABCS9876C1Z4', 60, 232);

  // Metadata box
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(700, 70, 340, 175);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('बिल संख्या:', 720, 115);
  ctx.font = '18px sans-serif';
  ctx.fillText('SK-2026-4409', 840, 115);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('दिनांक:', 720, 165);
  ctx.font = '18px sans-serif';
  ctx.fillText('05/10/2026', 840, 165);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('समय:', 720, 215);
  ctx.font = '18px sans-serif';
  ctx.fillText('16:20:45', 840, 215);

  // Customer line
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(60, 270, 980, 60);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(60, 270, 980, 60);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('ग्राहक का नाम:', 80, 308);
  ctx.font = '20px sans-serif';
  ctx.fillText('राजेश कुमार शर्मा (Rajesh Kumar Sharma)', 230, 308);

  // Table header
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(60, 360, 980, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('क्र.सं.', 80, 392);
  ctx.fillText('विवरण (Item Description)', 160, 392);
  ctx.fillText('मात्रा (Qty)', 660, 392);
  ctx.fillText('दर (Rate)', 790, 392);
  ctx.fillText('राशि (Total)', 930, 392);

  // Items in Hindi
  const items = [
    { no: '१', name: 'सरसों का तेल (१ लीटर)', qty: '१', rate: '१४५.००', total: '१४५.००' },
    { no: '२', name: 'प्रीमियम चाय पत्ती (५०० ग्राम)', qty: '२', rate: '२२०.००', total: '४४०.००' },
    { no: '૩', name: 'बासमती चावल (५ किलो)', qty: '१', rate: '४८०.००', total: '४८०.००' },
    { no: '४', name: 'देसी गाय का घी (१ किलो)', qty: '૧', rate: '૬૫૦.૦૦', total: '૬૫૦.૦૦' }
  ];

  let y = 445;
  items.forEach((it, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(60, y - 30, 980, 48);

    ctx.fillStyle = '#0f172a';
    ctx.font = '18px sans-serif';
    ctx.fillText(it.no, 85, y);
    ctx.fillText(it.name, 160, y);
    ctx.fillText(it.qty, 690, y);
    ctx.fillText('₹ ' + it.rate, 790, y);
    ctx.fillText('₹ ' + it.total, 930, y);

    y += 50;
  });

  // Totals box
  y += 20;
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(600, y, 440, 180);

  ctx.fillStyle = '#334155';
  ctx.font = '18px sans-serif';
  ctx.fillText('उप-योग (Subtotal):', 630, y + 40);
  ctx.fillText('₹ १७१५.००', 930, y + 40);

  ctx.fillText('जीएसटी (GST 5%):', 630, y + 85);
  ctx.fillText('₹ ८५.७५', 930, y + 85);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('कुल राशि (Grand Total):', 630, y + 145);
  ctx.fillText('₹ १८००.७५', 910, y + 145);

  // Footer greeting in Hindi
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText('धन्यवाद! पुनः पधारें । आपका दिन शुभ और मंगलमय हो ।', 260, y + 260);

  return await canvasToFile(canvas, 'sample_hindi_invoice_bill.jpg');
}
