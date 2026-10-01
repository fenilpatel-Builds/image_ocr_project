/**
 * Modular Parser Registry
 * Allows easy registration of new document types and handlers.
 */

import { parseInvoice } from './invoiceParser.js';
import { parsePassport } from './passportParser.js';
import { parseReceipt } from './receiptParser.js';
import { parseIdCard } from './idCardParser.js';
import { parseCertificate, parseGeneralDocument, parseReviewOrArticle } from './generalParser.js';
import { parseStatement } from './statementParser.js';
import { parseOrder } from './orderParser.js';

const PARSER_REGISTRY = {
  invoice: parseInvoice,
  bill: parseInvoice,
  statement: parseStatement,
  order: parseOrder,
  passport: parsePassport,
  receipt: parseReceipt,
  id_card: parseIdCard,
  certificate: parseCertificate,
  review_article: parseReviewOrArticle,
  prose: parseReviewOrArticle,
  general: parseGeneralDocument,
  unknown: parseGeneralDocument
};

/**
 * Register a new document type parser dynamically at runtime
 */
export function registerParser(documentType, parserFn) {
  PARSER_REGISTRY[documentType.toLowerCase()] = parserFn;
}

/**
 * Main dispatch function: takes category, verbatim OCR text, and token details,
 * returns normalized structured fields with confidence rating.
 */
export function parseDocument(category, rawText, wordTokens = []) {
  const normCategory = (category || 'general').toLowerCase();
  const parser = PARSER_REGISTRY[normCategory] || PARSER_REGISTRY.general;

  const rawFields = parser(rawText, wordTokens);

  // Normalize confidence rating tags
  return rawFields.map(field => {
    const conf = field.confidence ?? 0.85;
    let rating = 'HIGH';
    if (conf < 0.65) rating = 'NEEDS_REVIEW';
    else if (conf < 0.85) rating = 'MEDIUM';

    return {
      name: field.name,
      value: field.value ?? '',
      type: field.type || 'string',
      confidence: conf,
      rating,
      verified: field.verified ? 1 : 0,
      user_edited: 0
    };
  });
}
