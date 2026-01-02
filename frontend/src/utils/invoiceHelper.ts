// File: src/utils/invoiceHelper.ts

export const generateInvoiceID = (driverPhone: string | number, vehicleNo: string, tripSeq: number) => {
    // 1. Current Date (YYMMDD)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;

    // 2. Vehicle Last 4 Digits
    const cleanVeh = (vehicleNo || "0000").replace(/[^a-zA-Z0-9]/g, '');
    const vehPart = cleanVeh.slice(-4).toUpperCase();

    // 3. Driver Phone Last 3 Digits
    const phonePart = String(driverPhone || "000").slice(-3);

    // 4. Trip Sequence (01, 02...)
    const seqPart = String(tripSeq || 1).padStart(2, '0');

    // Combine: 260101-9999-123-01
    return `${datePart}${vehPart}${phonePart}${seqPart}`;
};