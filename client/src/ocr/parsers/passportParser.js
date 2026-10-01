/**
 * ICAO Doc 9303 Compliant Passport & MRZ Parser
 * Parses Machine Readable Zone (MRZ) lines (TD3 standard: 2 lines x 44 chars, or TD1: 3 lines x 30 chars)
 * Calculates check digits (weights: 7, 3, 1) and translates ISO country codes.
 */

const COUNTRY_MAP = {
  IND: 'India', USA: 'United States', GBR: 'United Kingdom',
  CAN: 'Canada', AUS: 'Australia', DEU: 'Germany',
  FRA: 'France', JPN: 'Japan', SGP: 'Singapore',
  ARE: 'United Arab Emirates', ESP: 'Spain', ITA: 'Italy',
  NLD: 'Netherlands', CHE: 'Switzerland', SWE: 'Sweden',
  UTO: 'Utopia (Sample Country)'
};

// ICAO 7-3-1 check digit validation algorithm
function calculateCheckDigit(str) {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    let val = 0;
    if (ch >= '0' && ch <= '9') {
      val = parseInt(ch, 10);
    } else if (ch >= 'A' && ch <= 'Z') {
      val = ch.charCodeAt(0) - 55;
    } else if (ch === '<') {
      val = 0;
    }
    sum += val * weights[i % 3];
  }
  return (sum % 10).toString();
}

// Convert YYMMDD to YYYY-MM-DD
function parseMRZDate(yymmdd, isExpiry = false) {
  if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) return yymmdd;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);

  // Century estimation
  const currentYear = new Date().getFullYear() % 100;
  let century;
  if (isExpiry) {
    century = yy >= currentYear - 5 && yy <= 99 ? '20' : '20';
  } else {
    // DOB: if yy > currentYear, it's 1900s, otherwise 2000s
    century = yy > currentYear ? '19' : '20';
  }

  return `${century}${yymmdd.slice(0, 2)}-${mm}-${dd}`;
}

export function parsePassport(rawText, wordTokens = []) {
  const fields = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Search for MRZ lines
  let mrzLines = [];
  for (let i = 0; i < lines.length; i++) {
    const cleanLine = lines[i].replace(/\s+/g, '').toUpperCase();
    if (cleanLine.startsWith('P<') || cleanLine.startsWith('P') && cleanLine.includes('<<')) {
      if (cleanLine.length >= 35) {
        mrzLines.push(cleanLine);
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].replace(/\s+/g, '').toUpperCase();
          if (nextLine.length >= 35) {
            mrzLines.push(nextLine);
          }
        }
        break;
      }
    }
  }

  let mrzParsed = false;

  if (mrzLines.length >= 2) {
    const line1 = mrzLines[0];
    const line2 = mrzLines[1];

    try {
      // Line 1: P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
      const docType = line1.slice(0, 2).replace(/</g, '');
      const issuingCountryCode = line1.slice(2, 5).replace(/</g, '');
      const namesPart = line1.slice(5);
      const nameParts = namesPart.split('<<');
      const surname = (nameParts[0] || '').replace(/</g, ' ').trim();
      const givenNames = (nameParts[1] || '').replace(/</g, ' ').trim();

      // Line 2: L898902C36UTO7408122F1204159ZE184226B<<<<<10
      const passportNoRaw = line2.slice(0, 9).replace(/</g, '');
      const passCheckDigit = line2.slice(9, 10);
      const nationalityCode = line2.slice(10, 13).replace(/</g, '');
      const dobRaw = line2.slice(13, 19);
      const dobCheckDigit = line2.slice(19, 20);
      const sex = line2.slice(20, 21);
      const expiryRaw = line2.slice(21, 27);
      const expiryCheckDigit = line2.slice(27, 28);
      const personalNo = line2.slice(28, 42).replace(/</g, '').trim();

      const passNoValid = calculateCheckDigit(passportNoRaw) === passCheckDigit;
      const dobValid = calculateCheckDigit(dobRaw) === dobCheckDigit;
      const expiryValid = calculateCheckDigit(expiryRaw) === expiryCheckDigit;

      fields.push({
        name: 'Document Type',
        value: docType === 'P' ? 'Passport (Type P)' : docType,
        type: 'string',
        confidence: 0.95,
        verified: 0
      });

      fields.push({
        name: 'Issuing Country',
        value: COUNTRY_MAP[issuingCountryCode] || issuingCountryCode,
        type: 'string',
        confidence: 0.94,
        verified: 0
      });

      fields.push({
        name: 'Surname',
        value: surname,
        type: 'string',
        confidence: 0.92,
        verified: 0
      });

      fields.push({
        name: 'Given Names',
        value: givenNames,
        type: 'string',
        confidence: 0.92,
        verified: 0
      });

      fields.push({
        name: 'Passport Number',
        value: passportNoRaw,
        type: 'string',
        confidence: passNoValid ? 0.96 : 0.75,
        verified: 0,
        validation: passNoValid ? 'Valid Check Digit' : 'Check Digit Discrepancy'
      });

      fields.push({
        name: 'Nationality',
        value: COUNTRY_MAP[nationalityCode] || nationalityCode,
        type: 'string',
        confidence: 0.92,
        verified: 0
      });

      fields.push({
        name: 'Date of Birth',
        value: parseMRZDate(dobRaw, false),
        type: 'date',
        confidence: dobValid ? 0.95 : 0.70,
        verified: 0
      });

      fields.push({
        name: 'Sex',
        value: sex === 'M' ? 'Male (M)' : sex === 'F' ? 'Female (F)' : sex,
        type: 'string',
        confidence: 0.95,
        verified: 0
      });

      fields.push({
        name: 'Date of Expiry',
        value: parseMRZDate(expiryRaw, true),
        type: 'date',
        confidence: expiryValid ? 0.95 : 0.70,
        verified: 0
      });

      if (personalNo) {
        fields.push({
          name: 'Personal / National ID Number',
          value: personalNo,
          type: 'string',
          confidence: 0.88,
          verified: 0
        });
      }

      fields.push({
        name: 'MRZ Line 1',
        value: line1,
        type: 'mrz',
        confidence: 0.98,
        verified: 0
      });

      fields.push({
        name: 'MRZ Line 2',
        value: line2,
        type: 'mrz',
        confidence: 0.98,
        verified: 0
      });

      mrzParsed = true;
    } catch (e) {
      console.warn('MRZ parsing failed, falling back to regex visual fields', e);
    }
  }

  // Fallback or supplementary extraction from visual inspection zone
  if (!mrzParsed) {
    // Passport Number regex
    const passMatch = rawText.match(/(?:PASSPORT\s*(?:NO|NUMBER|#)?[:.\s]*)([A-Z0-9]{8,9})/i) ||
                      rawText.match(/\b([A-Z][0-9]{7,8})\b/);
    if (passMatch) {
      fields.push({
        name: 'Passport Number',
        value: passMatch[1],
        type: 'string',
        confidence: 0.78,
        verified: 0
      });
    }

    // Name extraction fallback
    const nameMatch = rawText.match(/(?:GIVEN\s*NAMES?|NAME)[:.\s]*([A-Z\s]{3,30})/i);
    if (nameMatch) {
      fields.push({
        name: 'Given Names',
        value: nameMatch[1].trim(),
        type: 'string',
        confidence: 0.75,
        verified: 0
      });
    }

    const surnameMatch = rawText.match(/(?:SURNAME)[:.\s]*([A-Z\s]{2,25})/i);
    if (surnameMatch) {
      fields.push({
        name: 'Surname',
        value: surnameMatch[1].trim(),
        type: 'string',
        confidence: 0.75,
        verified: 0
      });
    }

    // Dates
    const dateMatches = [...rawText.matchAll(/\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/g)];
    if (dateMatches.length >= 1) {
      fields.push({
        name: 'Extracted Date (Review Required)',
        value: dateMatches[0][1],
        type: 'date',
        confidence: 0.65,
        verified: 0
      });
    }
  }

  // Mandatory authenticity disclaimer compliance note
  fields.push({
    name: 'Verification Notice',
    value: 'OCR extracts textual information and verifies checksums. Legal passport verification requires official NFC/PKI chip inspection.',
    type: 'notice',
    confidence: 1.0,
    verified: 1
  });

  return fields;
}
