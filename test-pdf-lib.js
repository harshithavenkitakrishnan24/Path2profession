const pdf = require('pdf-parse');
console.log('Type of pdf-parse export:', typeof pdf);
console.log('Keys of pdf-parse export:', Object.keys(pdf));

const dummyBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

try {
    pdf(dummyBuffer).then(data => {
        console.log('PDF Parse success:', data.text);
    }).catch(err => {
        console.log('PDF Parse error (expected for dummy):', err.message);
    });
} catch (e) {
    console.log('PDF Parse catch:', e.message);
}
