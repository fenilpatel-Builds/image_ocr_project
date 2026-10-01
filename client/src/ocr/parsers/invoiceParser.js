/**
 * Production-style Bill & Invoice Structured Data Parser
 * Extracts financial metadata, vendor information, customer details, tax identifiers,
 * line item breakdowns, and totals without hallucinating missing data.
 */

export function parseInvoice(rawText, wordTokens = []) {
  const fields = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Currency Detection
  let detectedCurrency = '$';
  if (/₹|INR|Rs\.?/i.test(rawText)) detectedCurrency = '₹';
  else if (/€|EUR/i.test(rawText)) detectedCurrency = '€';
  else if (/£|GBP/i.test(rawText)) detectedCurrency = '£';
  else if (/\$|USD/i.test(rawText)) detectedCurrency = '$';

  fields.push({
    name: 'Currency',
    value: detectedCurrency,
    type: 'string',
    confidence: 0.90,
    verified: 0
  });

  // 2. Company / Vendor Name (Usually one of the first non-trivial lines before "Invoice")
  let vendorName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (!/INVOICE|TAX INVOICE|BILL TO|RECEIPT|DATE|PAGE/i.test(l) && l.length > 2 && l.length < 50) {
      vendorName = l;
      break;
    }
  }
  if (vendorName) {
    fields.push({
      name: 'Business / Company Name',
      value: vendorName,
      type: 'string',
      confidence: 0.85,
      verified: 0
    });
  }

  // 3. Invoice / Bill Number
  const invNoMatch = rawText.match(/(?:INVOICE\s*(?:NO|NUMBER|#)|BILL\s*(?:NO|NUMBER|#))[:\s]*([A-Z0-9\-_/]+)/i) ||
                     rawText.match(/(?:INV|BILL)[-_\s#]*([A-Z0-9\-_/]{4,20})/i);
  if (invNoMatch) {
    fields.push({
      name: 'Invoice Number',
      value: invNoMatch[1].trim(),
      type: 'string',
      confidence: 0.92,
      verified: 0
    });
  }

  // 4. Invoice Date
  const datePattern = /(?:INVOICE\s*DATE|DATE|ISSUED)[:\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})/i;
  const dateMatch = rawText.match(datePattern);
  if (dateMatch) {
    fields.push({
      name: 'Invoice Date',
      value: dateMatch[1].trim(),
      type: 'date',
      confidence: 0.88,
      verified: 0
    });
  }

  // 5. Due Date
  const dueDateMatch = rawText.match(/(?:DUE\s*DATE|PAYMENT\s*DUE)[:\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})/i);
  if (dueDateMatch) {
    fields.push({
      name: 'Due Date',
      value: dueDateMatch[1].trim(),
      type: 'date',
      confidence: 0.87,
      verified: 0
    });
  }

  // 6. Customer Name
  const customerMatch = rawText.match(/(?:BILL\s*TO|BILLED\s*TO|CUSTOMER|CLIENT)[:\s]*([^\n\r]+)/i);
  if (customerMatch) {
    const custVal = customerMatch[1].replace(/^(Name|Client|Customer)[:\s]*/i, '').trim();
    if (custVal.length > 2 && custVal.length < 60) {
      fields.push({
        name: 'Customer Name',
        value: custVal,
        type: 'string',
        confidence: 0.82,
        verified: 0
      });
    }
  }

  // 7. Phone Number
  const phoneMatch = rawText.match(/(?:PHONE|TEL|CONTACT|MOBILE)[:.\s]*([+]?[0-9]{1,4}[-.\s]?[0-9]{3,5}[-.\s]?[0-9]{4,6})/i) ||
                    rawText.match(/\b(\+?[0-9]{1,3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})\b/);
  if (phoneMatch) {
    fields.push({
      name: 'Phone Number',
      value: phoneMatch[1].trim(),
      type: 'phone',
      confidence: 0.85,
      verified: 0
    });
  }

  // 8. Email Address
  const emailMatch = rawText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch) {
    fields.push({
      name: 'Email Address',
      value: emailMatch[1].toLowerCase().trim(),
      type: 'email',
      confidence: 0.94,
      verified: 0
    });
  }

  // 9. Tax / GST / VAT Number
  const gstinMatch = rawText.match(/(?:GSTIN|GST|VAT|TAX\s*ID)[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|[A-Z0-9]{9,15})/i);
  if (gstinMatch) {
    fields.push({
      name: 'Tax / GSTIN Number',
      value: gstinMatch[1].trim(),
      type: 'string',
      confidence: 0.93,
      verified: 0
    });
  }

  // 10. Subtotal
  const subtotalMatch = rawText.match(/(?:SUBTOTAL|SUB-TOTAL|NET\s*AMOUNT)[:\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (subtotalMatch) {
    fields.push({
      name: 'Subtotal Amount',
      value: subtotalMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.91,
      verified: 0
    });
  }

  // 11. Tax Amount / Rate
  const taxMatch = rawText.match(/(?:TAX|VAT|GST|SGST\+CGST)(?:\s*\(\d+%\))?[:\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (taxMatch) {
    fields.push({
      name: 'Tax Amount',
      value: taxMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.89,
      verified: 0
    });
  }

  // 12. Discount Amount
  const discountMatch = rawText.match(/(?:DISCOUNT|DISC)[:\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (discountMatch) {
    fields.push({
      name: 'Discount Amount',
      value: discountMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.85,
      verified: 0
    });
  }

  // 13. Total Amount Due
  const totalMatch = rawText.match(/(?:TOTAL\s*AMOUNT|GRAND\s*TOTAL|TOTAL\s*DUE|AMOUNT\s*DUE|BALANCE\s*DUE|TOTAL)[:\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (totalMatch) {
    fields.push({
      name: 'Total Amount',
      value: totalMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.94,
      verified: 0
    });
  }

  // 14. Line Items Table Parsing (matches patterns like "Widget Name 2 15.00 30.00")
  const lineItems = [];
  const lineItemRegex = /([A-Za-z0-9\s]{3,30})\s+(\d+)\s+([$€£₹]?\s*\d+(?:\.\d{2})?)\s+([$€£₹]?\s*\d+(?:\.\d{2})?)/g;
  let itemMatch;
  while ((itemMatch = lineItemRegex.exec(rawText)) !== null) {
    const desc = itemMatch[1].trim();
    if (!/TOTAL|SUBTOTAL|TAX|INVOICE|DUE|AMOUNT/i.test(desc)) {
      lineItems.push({
        description: desc,
        quantity: itemMatch[2],
        unitPrice: itemMatch[3].replace(/[$€£₹\s]/g, ''),
        total: itemMatch[4].replace(/[$€£₹\s]/g, '')
      });
    }
  }

  if (lineItems.length > 0) {
    fields.push({
      name: 'Detected Line Items Count',
      value: `${lineItems.length} items`,
      type: 'string',
      confidence: 0.85,
      verified: 0
    });

    fields.push({
      name: 'Line Items Detail',
      value: JSON.stringify(lineItems),
      type: 'json',
      confidence: 0.85,
      verified: 0
    });
  }

  return fields;
}
