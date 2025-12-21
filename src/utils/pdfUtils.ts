import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker - use CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise<string> - The extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const textParts: string[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      textParts.push(pageText);
    }
    
    const fullText = textParts.join('\n\n');
    
    // Clean up the text - remove excessive whitespace
    const cleanedText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    if (!cleanedText || cleanedText.length < 10) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }
    
    console.log(`[PDF] Extracted ${cleanedText.length} characters from ${file.name}`);
    return cleanedText;
    
  } catch (error) {
    console.error('[PDF] Error extracting text:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Check if a file is a text file
 */
export function isTextFile(file: File): boolean {
  return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
}
