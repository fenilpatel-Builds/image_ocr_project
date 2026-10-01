/**
 * Purchase & Sales Order Structured Parser
 * Extracts Order/PO Number, Order Date, Delivery Date, Vendor, Ship To,
 * Payment Terms, Subtotal, Tax, Shipping, and Total Order Value.
 */

export function parseOrder(rawText, wordTokens = []) {
  const fields = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. PO Number / Order Number
  const poMatch = rawText.match(/(?:PURCHASE\s*ORDER\s*(?:NO|NUMBER|#)?|P\.?O\.?\s*(?:NO|NUMBER|#)?|ORDER\s*(?:NO|NUMBER|#))[:.\s]*([A-Z0-9\-_/]+)/i);
  if (poMatch) {
    fields.push({
      name: 'Purchase Order / Order #',
      value: poMatch[1].trim(),
      type: 'string',
      confidence: 0.94,
      verified: 0
    });
  }

  // 2. Order Date
  const orderDateMatch = rawText.match(/(?:ORDER\s*DATE|DATE\s*OF\s*ORDER|DATE)[:.\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i);
  if (orderDateMatch) {
    fields.push({
      name: 'Order Date',
      value: orderDateMatch[1].trim(),
      type: 'date',
      confidence: 0.90,
      verified: 0
    });
  }

  // 3. Delivery / Expected Date
  const deliveryDateMatch = rawText.match(/(?:DELIVERY\s*DATE|EXPECTED\s*DATE|SHIP\s*DATE|DUE\s*DATE)[:.\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i);
  if (deliveryDateMatch) {
    fields.push({
      name: 'Delivery / Ship Date',
      value: deliveryDateMatch[1].trim(),
      type: 'date',
      confidence: 0.88,
      verified: 0
    });
  }

  // 4. Vendor / Supplier
  const vendorMatch = rawText.match(/(?:VENDOR|SUPPLIER|SELLER)[:.\s]*([^\n\r]+)/i);
  if (vendorMatch) {
    fields.push({
      name: 'Vendor / Supplier',
      value: vendorMatch[1].replace(/^(Name|Company)[:\s]*/i, '').trim(),
      type: 'string',
      confidence: 0.86,
      verified: 0
    });
  }

  // 5. Buyer / Ship To / Customer
  const shipToMatch = rawText.match(/(?:SHIP\s*TO|DELIVER\s*TO|BUYER|ORDERED\s*BY)[:.\s]*([^\n\r]+)/i);
  if (shipToMatch) {
    fields.push({
      name: 'Ship To / Buyer',
      value: shipToMatch[1].replace(/^(Name|Company)[:\s]*/i, '').trim(),
      type: 'string',
      confidence: 0.85,
      verified: 0
    });
  }

  // 6. Payment Terms
  const termsMatch = rawText.match(/(?:PAYMENT\s*TERMS|TERMS)[:.\s]*([^\n\r]+)/i);
  if (termsMatch) {
    fields.push({
      name: 'Payment Terms',
      value: termsMatch[1].trim(),
      type: 'string',
      confidence: 0.88,
      verified: 0
    });
  }

  // 7. Shipping Method / Carrier
  const carrierMatch = rawText.match(/(?:SHIPPING\s*METHOD|CARRIER|SHIP\s*VIA)[:.\s]*([^\n\r]+)/i);
  if (carrierMatch) {
    fields.push({
      name: 'Shipping Method / Carrier',
      value: carrierMatch[1].trim(),
      type: 'string',
      confidence: 0.87,
      verified: 0
    });
  }

  // 8. Currency
  let currency = '$';
  if (/₹|INR|Rs\.?/i.test(rawText)) currency = '₹';
  else if (/€|EUR/i.test(rawText)) currency = '€';
  else if (/£|GBP/i.test(rawText)) currency = '£';
  fields.push({
    name: 'Currency',
    value: currency,
    type: 'string',
    confidence: 0.92,
    verified: 0
  });

  // 9. Subtotal
  const subtotalMatch = rawText.match(/(?:SUBTOTAL|SUB-TOTAL|NET\s*AMOUNT)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (subtotalMatch) {
    fields.push({
      name: 'Subtotal Amount',
      value: subtotalMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.91,
      verified: 0
    });
  }

  // 10. Tax
  const taxMatch = rawText.match(/(?:TAX|VAT|GST)(?:\s*\(\d+%\))?[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (taxMatch) {
    fields.push({
      name: 'Tax Amount',
      value: taxMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.89,
      verified: 0
    });
  }

  // 11. Shipping & Handling
  const shippingMatch = rawText.match(/(?:SHIPPING|FREIGHT|DELIVERY\s*FEE|HANDLING)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (shippingMatch) {
    fields.push({
      name: 'Shipping & Handling',
      value: shippingMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.88,
      verified: 0
    });
  }

  // 12. Total Order Value
  const totalMatch = rawText.match(/(?:TOTAL\s*ORDER\s*AMOUNT|TOTAL\s*AMOUNT|GRAND\s*TOTAL|TOTAL)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (totalMatch) {
    fields.push({
      name: 'Total Order Value',
      value: totalMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.94,
      verified: 0
    });
  }

  return fields;
}
