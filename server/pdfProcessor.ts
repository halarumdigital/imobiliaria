import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// @ts-ignore
const pdf = require('pdf-parse');

export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log(`📄 Extraindo texto do PDF: ${pdfUrl}`);
    
    // Download the PDF file from the URL
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Extract text using pdf-parse
    const data = await pdf(uint8Array);
    
    console.log(`✅ Texto extraído com sucesso. Caracteres: ${data.text.length}`);
    return data.text;
  } catch (error: any) {
    console.error(`❌ Erro ao extrair texto do PDF: ${pdfUrl}`, error);
    throw new Error(`Erro ao processar PDF: ${error.message}`);
  }
}

export async function extractTextFromMultiplePDFs(pdfUrls: string[]): Promise<string> {
  try {
    if (!pdfUrls || pdfUrls.length === 0) {
      return '';
    }

    console.log(`📚 Processando ${pdfUrls.length} PDF(s) para treinamento...`);
    
    const extractedTexts = await Promise.all(
      pdfUrls.map(async (url, index) => {
        try {
          const text = await extractTextFromPDF(url);
          return `\n\n=== DOCUMENTO ${index + 1} ===\n${text}\n=== FIM DOCUMENTO ${index + 1} ===\n`;
        } catch (error: any) {
          console.error(`Erro ao processar PDF ${index + 1}:`, error);
          return `\n\n=== DOCUMENTO ${index + 1} - ERRO NO PROCESSAMENTO ===\n`;
        }
      })
    );

    const combinedText = extractedTexts.join('');
    console.log(`✅ Processamento concluído. Total de caracteres: ${combinedText.length}`);
    
    return combinedText;
  } catch (error: any) {
    console.error('❌ Erro ao processar múltiplos PDFs:', error);
    throw error;
  }
}