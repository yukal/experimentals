'use strict';

const crypto = require('crypto');

const canonicalXMLText = (text) => text.replace(/\s+(<)|(>)\s+/g, (match, val2, val3) => val2 || val3);
const canonicalTimestamp = () => new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const getSignatureOf = (data, algo = 'sha1') => crypto.createHash(algo).update(data).digest('hex');

// Should be converted to cp1251
const xmlDate = canonicalTimestamp();
const xmlData = `
    <?xml version="1.0" encoding="utf-8"?>
    <DAT FN="1234567890" TN="ПН 345612052809" ZN="АА57506761" DI="415" V="1">
        <Z NO="275">
            <TXS TX="0" SMI="25123" />
            <TXS TX="1" TS="20091201" TXPR="20.00" TXI="40854" TXO="1000" DTPR="0.00" DTI="0" DTO="0" TXTY="0" TXAL="0" SMI="245123" SMO="6000" />
            <M NM="ГОТІВКА" SMI="245123" SMO="6000" />
            <IO NM="ГОТІВКА" SMI="10000" SMO="249123" />
            <NC NI="18" NO="1" />
        </Z>
        <TS>${xmlDate}</TS>
    </DAT>
`;

// Encode XML
// const xmlCanonical = xmlData.trim().replace(/(<.*?>)\s+/g, '$1');
const xmlCanonical = canonicalXMLText(xmlData);
const xmlBase64 = Buffer.from(xmlCanonical).toString('base64');

console.log('XML CANONICAL:\n%s\n', xmlCanonical);
console.log('XML BASE64:\n%s\n', xmlBase64);
console.log('XML BASE64 SIGNATURE:');
console.log('(md5)    %s', getSignatureOf(xmlBase64, 'md5'));
console.log('(sha1)   %s', getSignatureOf(xmlBase64));
console.log('(sha256) %s', getSignatureOf(xmlBase64, 'sha256'));
console.log('(sha512) %s', getSignatureOf(xmlBase64, 'sha512'));
