/**
 * Enhanced Document Classification Layer
 * Supports Invoices, Statements, Purchase Orders, Receipts, Passports, ID Cards, Certificates, and General Documents.
 */

const CLASSIFIERS = [
  {
    category: 'passport',
    label: 'Passport (ICAO MRZ)',
    matcher: (text) => {
      let score = 0;
      const matched = [];

      // Check for MRZ pattern (P< or 44-char ICAO line)
      if (/P<[A-Z]{3}[A-Z<]{30,}/i.test(text) || /[A-Z0-9<]{36,44}/.test(text)) {
        score += 65;
        matched.push('MRZ Pattern Detected');
      }

      const keywords = [
        'PASSPORT', 'REPUBLIC', 'SURNAME', 'GIVEN NAMES',
        'NATIONALITY', 'DATE OF BIRTH', 'DATE OF EXPIRY',
        'SEX', 'PLACE OF BIRTH', 'AUTHORITY', 'PASSPORT NO'
      ];

      const upper = text.toUpperCase();
      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 15;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'statement',
    label: 'Bank / Financial Statement',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const keywords = [
        'STATEMENT OF ACCOUNT', 'ACCOUNT STATEMENT', 'BANK STATEMENT',
        'OPENING BALANCE', 'CLOSING BALANCE', 'AVAILABLE BALANCE',
        'TOTAL CREDITS', 'TOTAL DEBITS', 'TRANSACTION HISTORY',
        'ACCOUNT NUMBER', 'A/C NO', 'WITHDRAWAL', 'DEPOSIT', 'STATEMENT PERIOD'
      ];

      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 20;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'order',
    label: 'Purchase / Sales Order',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const keywords = [
        'PURCHASE ORDER', 'P.O. NUMBER', 'PO NUMBER', 'P.O. NO',
        'ORDER DATE', 'SALES ORDER', 'ORDER NUMBER', 'SHIP TO',
        'VENDOR', 'DELIVERY DATE', 'ITEM DESCRIPTION', 'ORDERED BY'
      ];

      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 20;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'invoice',
    label: 'Bill / Commercial Invoice',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const strongKeywords = [
        'INVOICE', 'TAX INVOICE', 'BILL TO', 'INVOICE NUMBER',
        'INV NO', 'INVOICE DATE', 'DUE DATE', 'SUBTOTAL', 'GSTIN', 'VAT NO'
      ];

      const secondaryKeywords = [
        'TOTAL AMOUNT', 'BALANCE DUE', 'QUANTITY', 'UNIT PRICE',
        'RATE', 'HSN', 'TAXABLE AMOUNT', 'DISCOUNT', 'TERMS & CONDITIONS'
      ];

      strongKeywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 25;
          matched.push(kw);
        }
      });

      secondaryKeywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 10;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'receipt',
    label: 'Retail / Cafe Receipt',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const keywords = [
        'RECEIPT', 'CASHIER', 'CHANGE DUE', 'TOTAL',
        'SUBTOTAL', 'STORE #', 'TERMINAL', 'ITEMS',
        'CASH', 'CREDIT CARD', 'VISA', 'MASTERCARD', 'THANK YOU FOR SHOPPING'
      ];

      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 18;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'id_card',
    label: 'Identity Document / ID Card',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const keywords = [
        'IDENTITY CARD', 'DRIVING LICENCE', 'DRIVING LICENSE',
        'NATIONAL ID', 'PERMANENT ACCOUNT NUMBER', 'INCOME TAX DEPARTMENT',
        'AADHAAR', 'VOTER ID', 'ELECTION COMMISSION', 'DATE OF BIRTH', 'DOB',
        'FATHER', 'HUSBAND', 'VALID TILL'
      ];

      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 20;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'certificate',
    label: 'Certificate / Award',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const keywords = [
        'THIS IS TO CERTIFY', 'CERTIFICATE OF', 'HAS SUCCESSFULLY COMPLETED',
        'AWARDED TO', 'IN RECOGNITION OF', 'HONOR OF', 'DATE OF CONFERRAL',
        'AUTHORIZED SIGNATORY'
      ];

      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 25;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  },
  {
    category: 'review_article',
    label: 'Literature / Review / Prose Document',
    matcher: (text) => {
      let score = 0;
      const matched = [];
      const upper = text.toUpperCase();

      const keywords = [
        'PLAY REVIEW', 'BOOK REVIEW', 'PARAGRAPH', 'SHAKESPEARE',
        'THEATRE', 'THEATER', 'COMEDIES', 'TRAGEDY', 'ESSAY',
        'ARTICLE', 'REPORT', 'STORY', 'PERFORMANCE', 'NOVEL', 'AUTHOR'
      ];

      keywords.forEach(kw => {
        if (upper.includes(kw)) {
          score += 25;
          matched.push(kw);
        }
      });

      return { score, matched };
    }
  }
];

export function classifyDocument(rawText) {
  if (!rawText || rawText.trim().length < 5) {
    return {
      category: 'general',
      label: 'General Document',
      confidence: 50,
      matchedKeywords: [],
      explanation: 'General document layout detected.'
    };
  }

  let bestMatch = {
    category: 'general',
    label: 'General Document',
    score: 10,
    matchedKeywords: [],
    explanation: 'General text content recognized.'
  };

  for (const classifier of CLASSIFIERS) {
    const result = classifier.matcher(rawText);
    if (result.score > bestMatch.score) {
      bestMatch = {
        category: classifier.category,
        label: classifier.label,
        score: result.score,
        matchedKeywords: result.matched,
        explanation: `Classified based on ${result.matched.slice(0, 4).join(', ')}.`
      };
    }
  }

  const confidence = Math.min(98, Math.max(45, Math.round(bestMatch.score * 1.2)));

  return {
    category: bestMatch.category,
    label: bestMatch.label,
    confidence,
    matchedKeywords: bestMatch.matchedKeywords,
    explanation: bestMatch.explanation
  };
}
