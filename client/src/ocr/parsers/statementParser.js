/**
 * Bank & Financial Statement Structured Parser
 * Extracts Account Holder, Account Number, Bank Name, Statement Period,
 * Balances, Credits, Debits, Currency, and Transaction Rows.
 */

export function parseStatement(rawText, wordTokens = []) {
  const fields = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Bank / Institution Name
  let bankName = '';
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    if (/BANK|FINANCIAL|CREDIT UNION|FEDERAL|TREASURY|CHASE|WELLS|CITI|HSBC|HDFC|BARCLAYS/i.test(l) && l.length < 50) {
      bankName = l;
      break;
    }
  }
  if (!bankName && lines.length > 0) {
    bankName = lines[0];
  }
  if (bankName) {
    fields.push({
      name: 'Financial Institution',
      value: bankName,
      type: 'string',
      confidence: 0.88,
      verified: 0
    });
  }

  // 2. Account Holder / Customer Name
  const holderMatch = rawText.match(/(?:ACCOUNT\s*HOLDER|CUSTOMER\s*NAME|CLIENT\s*NAME|STATEMENT\s*FOR|NAME)[:.\s]*([A-Za-z\s.]{3,40})/i);
  if (holderMatch) {
    fields.push({
      name: 'Account Holder',
      value: holderMatch[1].trim(),
      type: 'string',
      confidence: 0.86,
      verified: 0
    });
  }

  // 3. Account Number / Card Number
  const acctMatch = rawText.match(/(?:ACCOUNT\s*(?:NO|NUMBER|#)|A\/C\s*NO|ACCOUNT\s*ID)[:.\s]*([A-Z0-9\-\s*]{4,25})/i);
  if (acctMatch) {
    fields.push({
      name: 'Account Number',
      value: acctMatch[1].trim(),
      type: 'string',
      confidence: 0.94,
      verified: 0
    });
  }

  // 4. Statement Period
  const periodMatch = rawText.match(/(?:STATEMENT\s*PERIOD|PERIOD|BILLING\s*CYCLE)[:.\s]*([^\n\r]+)/i);
  if (periodMatch) {
    fields.push({
      name: 'Statement Period',
      value: periodMatch[1].trim(),
      type: 'string',
      confidence: 0.89,
      verified: 0
    });
  }

  // 5. Statement / Issue Date
  const dateMatch = rawText.match(/(?:STATEMENT\s*DATE|DATE\s*OF\s*ISSUE|ISSUE\s*DATE|DATE)[:.\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i);
  if (dateMatch) {
    fields.push({
      name: 'Statement Date',
      value: dateMatch[1].trim(),
      type: 'date',
      confidence: 0.90,
      verified: 0
    });
  }

  // 6. Currency
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

  // 7. Opening Balance
  const openBalMatch = rawText.match(/(?:OPENING\s*BALANCE|PREVIOUS\s*BALANCE|STARTING\s*BALANCE)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (openBalMatch) {
    fields.push({
      name: 'Opening Balance',
      value: openBalMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.92,
      verified: 0
    });
  }

  // 8. Closing / Ending / Available Balance
  const closeBalMatch = rawText.match(/(?:CLOSING\s*BALANCE|ENDING\s*BALANCE|AVAILABLE\s*BALANCE|CURRENT\s*BALANCE|NEW\s*BALANCE)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (closeBalMatch) {
    fields.push({
      name: 'Closing / Available Balance',
      value: closeBalMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.94,
      verified: 0
    });
  }

  // 9. Total Deposits / Credits
  const creditsMatch = rawText.match(/(?:TOTAL\s*CREDITS?|TOTAL\s*DEPOSITS?|CREDITS)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (creditsMatch) {
    fields.push({
      name: 'Total Credits / Deposits',
      value: creditsMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.90,
      verified: 0
    });
  }

  // 10. Total Withdrawals / Debits
  const debitsMatch = rawText.match(/(?:TOTAL\s*DEBITS?|TOTAL\s*WITHDRAWALS?|DEBITS)[:.\s]*[$€£₹]?\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i);
  if (debitsMatch) {
    fields.push({
      name: 'Total Debits / Withdrawals',
      value: debitsMatch[1].replace(/,/g, ''),
      type: 'number',
      confidence: 0.90,
      verified: 0
    });
  }

  // 11. Branch / IFSC / SWIFT / Routing Number
  const routingMatch = rawText.match(/(?:ROUTING\s*(?:NO|NUMBER|#)|IFSC\s*(?:CODE)?|SWIFT\s*(?:CODE)?|BRANCH\s*CODE)[:.\s]*([A-Z0-9]{5,15})/i);
  if (routingMatch) {
    fields.push({
      name: 'Routing / IFSC / SWIFT Code',
      value: routingMatch[1].trim(),
      type: 'string',
      confidence: 0.92,
      verified: 0
    });
  }

  return fields;
}
