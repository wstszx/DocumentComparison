import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { DocumentStructure, DocumentPage, DocumentLine, PositionIndex, DocumentPosition, DocumentMetadata } from '../types/advanced';

// 配置PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class AdvancedDocumentParser {
  static async parseDocument(file: File): Promise<DocumentStructure> {
    const baseStructure: Partial<DocumentStructure> = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      pages: [],
      sections: [],
    };

    try {
      switch (file.type) {
        case 'application/pdf':
          return await this.parsePDFDocument(file, baseStructure);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseWordDocument(file, baseStructure);
        case 'text/plain':
          return await this.parseTextDocument(file, baseStructure);
        default:
          return await this.parseTextDocument(file, baseStructure);
      }
    } catch (error) {
      console.error('文档解析错误:', error);
      throw new Error(`无法解析文档: ${error}`);
    }
  }

  private static async parsePDFDocument(file: File, baseStructure: Partial<DocumentStructure>): Promise<DocumentStructure> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    const pages: DocumentPage[] = [];
    let totalCharacterCount = 0;
    let totalLineCount = 0;
    let currentOffset = 0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      
      // 提取文本内容并构建行结构
      const pageText = textContent.items
        .filter((item: any) => item.str && item.str.trim())
        .map((item: any) => item.str)
        .join(' ');
      
      const lines = this.buildLineStructure(pageText, pageNum, currentOffset);
      
      pages.push({
        pageNumber: pageNum,
        content: pageText,
        lines,
        height: viewport.height,
        width: viewport.width,
        renderOffset: currentOffset,
      });
      
      totalCharacterCount += pageText.length;
      totalLineCount += lines.length;
      currentOffset += pageText.length + 1; // +1 for page break
    }

    const positionIndex = this.buildPositionIndex(pages);
    const metadata = await this.extractPDFMetadata(pdf);

    return {
      ...baseStructure,
      pageCount: pdf.numPages,
      lineCount: totalLineCount,
      characterCount: totalCharacterCount,
      pages,
      sections: this.extractSections(pages),
      positionIndex,
      metadata,
    } as DocumentStructure;
  }

  private static async parseWordDocument(file: File, baseStructure: Partial<DocumentStructure>): Promise<DocumentStructure> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const content = result.value || '';
    const lines = this.buildLineStructure(content, 1, 0);
    
    const page: DocumentPage = {
      pageNumber: 1,
      content,
      lines,
      height: 0,
      width: 0,
      renderOffset: 0,
    };

    const positionIndex = this.buildPositionIndex([page]);
    const metadata: DocumentMetadata = {
      title: file.name,
      modifiedDate: new Date(file.lastModified),
    };

    return {
      ...baseStructure,
      pageCount: 1,
      lineCount: lines.length,
      characterCount: content.length,
      pages: [page],
      sections: this.extractSections([page]),
      positionIndex,
      metadata,
    } as DocumentStructure;
  }

  private static async parseTextDocument(file: File, baseStructure: Partial<DocumentStructure>): Promise<DocumentStructure> {
    const content = await file.text();
    const lines = this.buildLineStructure(content, 1, 0);
    
    const page: DocumentPage = {
      pageNumber: 1,
      content,
      lines,
      height: 0,
      width: 0,
      renderOffset: 0,
    };

    const positionIndex = this.buildPositionIndex([page]);
    const metadata: DocumentMetadata = {
      title: file.name,
      modifiedDate: new Date(file.lastModified),
      encoding: 'UTF-8',
    };

    return {
      ...baseStructure,
      pageCount: 1,
      lineCount: lines.length,
      characterCount: content.length,
      pages: [page],
      sections: this.extractSections([page]),
      positionIndex,
      metadata,
    } as DocumentStructure;
  }

  private static buildLineStructure(content: string, pageNumber: number, pageOffset: number): DocumentLine[] {
    const lines: DocumentLine[] = [];
    const textLines = content.split('\n');
    let currentOffset = pageOffset;

    textLines.forEach((lineContent, index) => {
      lines.push({
        lineNumber: index + 1,
        content: lineContent,
        startOffset: currentOffset,
        endOffset: currentOffset + lineContent.length,
        pageNumber,
      });
      currentOffset += lineContent.length + 1; // +1 for newline
    });

    return lines;
  }

  private static buildPositionIndex(pages: DocumentPage[]): PositionIndex {
    const offsetToPosition = new Map<number, DocumentPosition>();
    const positionToOffset = new Map<string, number>();
    const lineIndex = new Map<number, DocumentLine>();
    const pageIndex = new Map<number, DocumentPage>();

    pages.forEach(page => {
      pageIndex.set(page.pageNumber, page);
      
      page.lines.forEach(line => {
        lineIndex.set(line.lineNumber, line);
        
        // 为每个字符位置创建索引
        for (let i = line.startOffset; i <= line.endOffset; i++) {
          const position: DocumentPosition = {
            page: page.pageNumber,
            line: line.lineNumber,
            column: i - line.startOffset + 1,
            offset: i - line.startOffset,
            absoluteOffset: i,
          };
          
          offsetToPosition.set(i, position);
          positionToOffset.set(`${position.page}-${position.line}-${position.column}`, i);
        }
      });
    });

    return {
      offsetToPosition,
      positionToOffset,
      lineIndex,
      pageIndex,
    };
  }

  private static extractSections(pages: DocumentPage[]) {
    // 简单的章节提取逻辑，可以根据需要扩展
    const sections = [];
    let sectionId = 1;

    pages.forEach(page => {
      const lines = page.content.split('\n');
      lines.forEach((line, index) => {
        // 检测标题行（简单规则：全大写或以数字开头）
        if (line.trim().length > 0 && (line === line.toUpperCase() || /^\d+\./.test(line.trim()))) {
          sections.push({
            id: `section-${sectionId++}`,
            title: line.trim(),
            level: 1,
            startPosition: {
              page: page.pageNumber,
              line: index + 1,
              column: 1,
              offset: 0,
              absoluteOffset: page.renderOffset + line.indexOf(line.trim()),
            },
            endPosition: {
              page: page.pageNumber,
              line: index + 1,
              column: line.length,
              offset: line.length - 1,
              absoluteOffset: page.renderOffset + line.length,
            },
            content: line.trim(),
          });
        }
      });
    });

    return sections;
  }

  private static async extractPDFMetadata(pdf: any): Promise<DocumentMetadata> {
    try {
      const metadata = await pdf.getMetadata();
      return {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        createdDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : undefined,
        modifiedDate: metadata.info?.ModDate ? new Date(metadata.info.ModDate) : undefined,
      };
    } catch (error) {
      return {};
    }
  }
}