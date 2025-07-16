import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { DocumentFile, DocumentPage } from '../types';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class DocumentParser {
  static async parseFile(file: File): Promise<DocumentFile> {
    const baseDoc: DocumentFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      content: '',
      lastModified: file.lastModified,
    };

    try {
      switch (file.type) {
        case 'application/pdf':
          return await this.parsePDF(file, baseDoc);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseWord(file, baseDoc);
        case 'text/plain':
          return await this.parseText(file, baseDoc);
        default:
          // Try to parse as text if type is unknown
          return await this.parseText(file, baseDoc);
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      // Fallback to text parsing
      try {
        return await this.parseText(file, baseDoc);
      } catch (fallbackError) {
        throw new Error(`Unable to parse document: ${error}`);
      }
    }
  }

  private static async parsePDF(file: File, baseDoc: DocumentFile): Promise<DocumentFile> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const pages: DocumentPage[] = [];
      let fullContent = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          pages.push({
            pageNumber: pageNum,
            content: pageText,
            height: page.getViewport({ scale: 1 }).height,
          });
          
          fullContent += `=== Page ${pageNum} ===\n${pageText}\n\n`;
        }
      }

      return {
        ...baseDoc,
        content: fullContent.trim() || 'No text content found in PDF',
        pages,
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF document');
    }
  }

  private static async parseWord(file: File, baseDoc: DocumentFile): Promise<DocumentFile> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        ...baseDoc,
        content: result.value || 'No text content found in Word document',
      };
    } catch (error) {
      console.error('Word parsing error:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  private static async parseText(file: File, baseDoc: DocumentFile): Promise<DocumentFile> {
    try {
      const content = await file.text();
      
      return {
        ...baseDoc,
        content: content || 'Empty text file',
      };
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error('Failed to parse text file');
    }
  }
}