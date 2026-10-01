/**
 * Client-Side Tesseract.js OCR Service
 * - Web Worker execution to prevent UI freezing
 * - Worker caching / Singleton lifecycle management
 * - Real-time progress tracking
 * - Detailed token & line confidence mapping
 * - Multi-language support (English, Spanish, French, German, Hindi)
 * - Zero external API calls
 */

import { createWorker } from 'tesseract.js';
import { repairOcrText, isGarbageLine } from './deepFieldExtractor.js';

class TesseractOCRService {
  constructor() {
    this.worker = null;
    this.currentLanguage = null;
    this.isInitializing = false;
  }

  /**
   * Retrieves or initializes the cached Tesseract worker for the requested language
   */
  async getWorker(language = 'eng', onProgress = null) {
    // If worker exists for the same language, reuse it directly!
    if (this.worker && this.currentLanguage === language) {
      return this.worker;
    }

    // If worker exists for another language, gracefully terminate before switching
    if (this.worker) {
      await this.terminate();
    }

    this.isInitializing = true;
    if (onProgress) {
      onProgress({ status: 'initializing', progress: 0.1, message: `Loading Tesseract ${language} engine...` });
    }

    try {
      // Tesseract.js v5 createWorker
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (onProgress && m) {
            let userMessage = m.status;
            if (m.status === 'loading tesseract core') userMessage = 'Loading WebAssembly OCR core...';
            else if (m.status === 'loading language traineddata') userMessage = `Loading ${language} language model...`;
            else if (m.status === 'initializing api') userMessage = 'Initializing local OCR engine...';
            else if (m.status === 'recognizing text') userMessage = 'Recognizing text patterns...';

            onProgress({
              status: m.status,
              progress: typeof m.progress === 'number' ? m.progress : 0.5,
              message: userMessage
            });
          }
        }
      });

      this.worker = worker;
      this.currentLanguage = language;
      this.isInitializing = false;
      return this.worker;
    } catch (err) {
      this.isInitializing = false;
      this.worker = null;
      throw new Error(`Failed to initialize Tesseract OCR engine (${language}): ${err.message}`);
    }
  }

  /**
   * Run local OCR on an image source (Canvas, Blob, or URL)
   */
  async recognize(imageSource, { language = 'eng', onProgress = null } = {}) {
    const startTime = performance.now();

    const worker = await this.getWorker(language, onProgress);

    if (onProgress) {
      onProgress({ status: 'recognizing text', progress: 0.2, message: 'Processing image through local OCR...' });
    }

    try {
      // First pass: Standard Auto page segmentation
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
        preserve_interword_spaces: '1'
      });

      let result = await worker.recognize(imageSource);
      let words = result.data.words || [];

      // Smart Dual-Pass Fallback:
      // If auto segmentation yielded few words (< 20 words) or low confidence (< 68%),
      // try PSM 6 (single uniform text block, ideal for paragraphs, reviews, articles, receipts)
      if (words.length < 20 || (result.data.confidence && result.data.confidence < 68)) {
        try {
          if (onProgress) {
            onProgress({ status: 'optimizing', progress: 0.7, message: 'Optimizing text segmentation (PSM 6 block mode)...' });
          }
          await worker.setParameters({
            tessedit_pageseg_mode: '6',
            preserve_interword_spaces: '1'
          });
          const blockResult = await worker.recognize(imageSource);
          const blockWords = blockResult.data.words || [];
          if (blockWords.length > words.length || (blockResult.data.confidence || 0) > (result.data.confidence || 0)) {
            result = blockResult;
            words = blockWords;
          }
        } catch (e) {
          console.warn('Fallback block segmentation warning:', e);
        }
      }

      const endTime = performance.now();
      const processingTimeMs = Math.round(endTime - startTime);

      const rawText = repairOcrText(result.data.text || '');
      const confidenceAvg = Math.round(result.data.confidence || 0);

      // Extract word-level details with confidence scores
      const normalizedWords = words.map(w => ({
        text: w.text,
        confidence: Math.round(w.confidence || 0),
        bbox: w.bbox
      }));

      // Extract lines and filter garbage noise lines
      const lines = (result.data.lines || []).map(l => ({
        text: repairOcrText(l.text).trim(),
        confidence: Math.round(l.confidence || 0)
      })).filter(l => l.text.length > 0 && !isGarbageLine(l.text));

      if (onProgress) {
        onProgress({ status: 'completed', progress: 1.0, message: 'OCR text recognition completed successfully!' });
      }

      return {
        rawText,
        confidenceAvg,
        processingTimeMs,
        words: normalizedWords,
        lines,
        wordCount: normalizedWords.length,
        language,
        engine: 'Tesseract.js v5 (Browser WebAssembly / Worker)'
      };
    } catch (err) {
      console.error('Tesseract recognition error:', err);
      throw new Error(`OCR processing failed: ${err.message}. Try adjusting image contrast or deskewing.`);
    }
  }

  /**
   * Gracefully terminate worker to free memory
   */
  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (e) {
        console.warn('Worker termination warning:', e);
      }
      this.worker = null;
      this.currentLanguage = null;
    }
  }
}

export const ocrService = new TesseractOCRService();
