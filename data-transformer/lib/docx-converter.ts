import fs from 'fs';
import mammoth from 'mammoth';

export const extractTextFromDocx = async (inputPath: string): Promise<string> => {
  try {
    const docxBuf = fs.readFileSync(inputPath);
    const result = await mammoth.extractRawText({ buffer: docxBuf });
    console.log('Text extraction successful');
    return result.value;
  } catch (err) {
    console.error('Text extraction failed:', err);
    throw err;
  }
}; 