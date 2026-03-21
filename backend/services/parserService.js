const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from a buffer containing PDF data
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractTextFromPDF = async (buffer) => {
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('PDF buffer is empty');
        }
        const data = await pdf(buffer);
        if (!data || !data.text) {
            throw new Error('No text found in PDF. Is it a scanned image?');
        }
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
};

/**
 * Extract text from a buffer containing Docx data
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractTextFromDocx = async (buffer) => {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('Error extracting text from Docx:', error);
        throw new Error('Failed to parse Docx file');
    }
};

module.exports = {
    extractTextFromPDF,
    extractTextFromDocx
};
