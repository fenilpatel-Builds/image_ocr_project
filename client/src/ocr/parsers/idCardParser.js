/**
 * Identity Document Parser (Driver's License, National ID, PAN / Aadhaar card)
 * Extracts Full Name, Father's Name, ID/License Number, DOB, Gender, Expiry, Issuing Authority.
 */

export function parseIdCard(rawText, wordTokens = []) {
  const fields = [];

  // 1. ID Number (Generic alphanumeric identifier or License format)
  const idMatch = rawText.match(/(?:DL\s*NO|LICENCE\s*NO|ID\s*NO|AADHAAR\s*NO|CARD\s*NO|NUMBER)[:.\s]*([A-Z0-9\-\s]{8,20})/i) ||
                  rawText.match(/\b([A-Z]{2}[0-9]{2}[0-9]{11})\b/) || // DL format
                  rawText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/) || // PAN format
                  rawText.match(/\b([0-9]{4}\s[0-9]{4}\s[0-9]{4})\b/); // Aadhaar format

  if (idMatch) {
    fields.push({
      name: 'Document / ID Number',
      value: idMatch[1].trim(),
      type: 'string',
      confidence: 0.92,
      verified: 0
    });
  }

  // 2. Full Name
  const nameMatch = rawText.match(/(?:NAME)[:.\s]*([A-Z\s]{3,35})/i);
  if (nameMatch) {
    fields.push({
      name: 'Full Name',
      value: nameMatch[1].trim(),
      type: 'string',
      confidence: 0.85,
      verified: 0
    });
  }

  // 3. Father / Spouse Name
  const fatherMatch = rawText.match(/(?:S\/O|D\/O|W\/O|FATHER(?:'S)?\s*NAME)[:.\s]*([A-Z\s]{3,35})/i);
  if (fatherMatch) {
    fields.push({
      name: "Father / Guardian's Name",
      value: fatherMatch[1].trim(),
      type: 'string',
      confidence: 0.82,
      verified: 0
    });
  }

  // 4. Date of Birth
  const dobMatch = rawText.match(/(?:DOB|DATE\s*OF\s*BIRTH|BIRTH\s*DATE)[:.\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})/i);
  if (dobMatch) {
    fields.push({
      name: 'Date of Birth',
      value: dobMatch[1].trim(),
      type: 'date',
      confidence: 0.90,
      verified: 0
    });
  }

  // 5. Gender / Sex
  const genderMatch = rawText.match(/(?:GENDER|SEX)[:.\s]*(MALE|FEMALE|TRANSGENDER|M|F)\b/i);
  if (genderMatch) {
    const g = genderMatch[1].toUpperCase();
    fields.push({
      name: 'Gender',
      value: g === 'M' ? 'Male' : g === 'F' ? 'Female' : g,
      type: 'string',
      confidence: 0.92,
      verified: 0
    });
  }

  // 6. Validity / Expiry Date
  const validMatch = rawText.match(/(?:VALID\s*(?:TILL|UPTO)|EXPIRES?|EXPIRY)[:.\s]*([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})/i);
  if (validMatch) {
    fields.push({
      name: 'Valid Till / Expiry',
      value: validMatch[1].trim(),
      type: 'date',
      confidence: 0.88,
      verified: 0
    });
  }

  // 7. Issuing Authority / Jurisdiction
  const authMatch = rawText.match(/(?:ISSUING\s*AUTHORITY|GOVERNMENT\s*OF\s*[A-Z\s]+|STATE\s*OF\s*[A-Z\s]+)/i);
  if (authMatch) {
    fields.push({
      name: 'Issuing Authority',
      value: authMatch[0].trim(),
      type: 'string',
      confidence: 0.80,
      verified: 0
    });
  }

  return fields;
}
