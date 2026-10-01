/**
 * Retail / Cafe / Restaurant Receipt Structured Parser
 * Extracts Merchant Name, Date/Time, Terminal, Cashier, Item breakdown, Subtotal, Tax, Tip, Total, Payment Method.
 */

export function parseReceipt(rawText, wordTokens = []) {
  const fields = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Merchant / Store Name (first non-empty line)
  if (lines.length > 0) {
    fields.push({
      name: 'Merchant / Store Name',
      value: lines[0],
      type: 'string',
      confidence: 0.88,
      verified: 0
    });
  }

  // 2. Receipt / Ticket / Order Number
  const orderMatch = rawText.match(/(?:ORDER|TICKET|RECEIPT|CHECK|TRANS)\s*(?:NO|NUMBER|#)?[:.\s]*([A-Z0-9\-_]+)/i);
  if (orderMatch) {
    fields.push({
      name: 'Receipt / Order Number',
      value: orderMatch[1].trim(),
      type: 'string',
      confidence: 0.90,
      verified: 0
    });
  }

  // 3. Date & Time
  const dateMatch = rawText.match(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/);
  if (dateMatch) {
    fields.push({
      name: 'Receipt Date',
      value: dateMatch[1],
      type: 'date',
      confidence: 0.88,
      verified: 0
    });
  }

  const timeMatch = rawText.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\b/i);
  if (timeMatch) {
    fields.push({
      name: 'Time',
      value: timeMatch[1],
      type: 'string',
      confidence: 0.86,
      verified: 0
    });
  }

  // 4. Cashier / Server
  const cashierMatch = rawText.match(/(?:CASHIER|SERVER|OPERATOR)[:.\s]*([A-Za-z0-9\s]+)/i);
  if (cashierMatch) {
    fields.push({
      name: 'Cashier / Server',
      value: cashierMatch[1].trim(),
      type: 'string',
      confidence: 0.82,
      verified: 0
    });
  }

  // 5. Payment Method
  let paymentMethod = 'Unknown';
  if (/VISA|MASTER|AMEX|CREDIT|DEBIT/i.test(rawText)) paymentMethod = 'Credit / Debit Card';
  else if (/CASH/i.test(rawText)) paymentMethod = 'Cash';
  else if (/UPI|GPAY|PHONEPE|PAYTM/i.test(rawText)) paymentMethod = 'UPI Digital Payment';

  fields.push({
    name: 'Payment Method',
    value: paymentMethod,
    type: 'string',
    confidence: 0.85,
    verified: 0
  });

  // 6. Subtotal
  const subtotalMatch = rawText.match(/(?:SUBTOTAL|SUB TOTAL)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2})/i);
  if (subtotalMatch) {
    fields.push({
      name: 'Subtotal',
      value: subtotalMatch[1],
      type: 'number',
      confidence: 0.90,
      verified: 0
    });
  }

  // 7. Tax
  const taxMatch = rawText.match(/(?:TAX|VAT|GST)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2})/i);
  if (taxMatch) {
    fields.push({
      name: 'Tax Amount',
      value: taxMatch[1],
      type: 'number',
      confidence: 0.88,
      verified: 0
    });
  }

  // 8. Total Amount
  const totalMatch = rawText.match(/(?:TOTAL|AMOUNT DUE|BALANCE)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2})/i);
  if (totalMatch) {
    fields.push({
      name: 'Total Paid',
      value: totalMatch[1],
      type: 'number',
      confidence: 0.94,
      verified: 0
    });
  }

  return fields;
}
