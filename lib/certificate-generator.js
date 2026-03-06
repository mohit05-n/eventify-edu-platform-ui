import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Generates a professional PDF certificate as a Buffer using pdf-lib
 * @param {Object} data - Certificate data
 * @returns {Promise<Buffer>}
 */
export async function generateCertificatePDF(data) {
    const {
        participantName,
        eventTitle,
        eventDate,
        organizerName,
        certificateId
    } = data;

    // Create a new PDF in landscape A4
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape in points

    // Embed standard fonts (no external files needed)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    const width = page.getWidth();
    const height = page.getHeight();

    // Colors
    const primaryColor = rgb(0.388, 0.4, 0.945);   // #6366f1
    const darkColor = rgb(0.118, 0.106, 0.294);     // #1e1b4b
    const accentColor = rgb(0.961, 0.62, 0.043);    // #f59e0b
    const mutedColor = rgb(0.392, 0.455, 0.545);    // #64748b
    const white = rgb(1, 1, 1);

    // ─── Background & Border ───
    // Outer border
    page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: primaryColor, borderWidth: 2 });
    // Inner border
    page.drawRectangle({ x: 35, y: 35, width: width - 70, height: height - 70, borderColor: mutedColor, borderWidth: 1 });

    // Corner accents (triangles as filled rectangles for simplicity)
    const cornerSize = 8;
    // Top-left
    page.drawRectangle({ x: 20, y: height - 20 - cornerSize, width: cornerSize, height: cornerSize, color: primaryColor });
    // Top-right
    page.drawRectangle({ x: width - 20 - cornerSize, y: height - 20 - cornerSize, width: cornerSize, height: cornerSize, color: primaryColor });
    // Bottom-left
    page.drawRectangle({ x: 20, y: 20, width: cornerSize, height: cornerSize, color: primaryColor });
    // Bottom-right
    page.drawRectangle({ x: width - 20 - cornerSize, y: 20, width: cornerSize, height: cornerSize, color: primaryColor });

    // Decorative accent bar at top
    page.drawRectangle({ x: 60, y: height - 55, width: width - 120, height: 3, color: primaryColor });
    // Decorative accent bar at bottom
    page.drawRectangle({ x: 60, y: 55, width: width - 120, height: 3, color: primaryColor });

    // ─── Header ───
    const brandText = 'EventifyEDU';
    const brandWidth = helveticaBold.widthOfTextAtSize(brandText, 28);
    page.drawText(brandText, {
        x: (width - brandWidth) / 2,
        y: height - 100,
        size: 28,
        font: helveticaBold,
        color: primaryColor,
    });

    const subText = 'Official Educational Recognition';
    const subWidth = helvetica.widthOfTextAtSize(subText, 10);
    page.drawText(subText, {
        x: (width - subWidth) / 2,
        y: height - 118,
        size: 10,
        font: helvetica,
        color: mutedColor,
    });

    // ─── Title ───
    const titleText = 'Certificate of Participation';
    const titleWidth = timesRoman.widthOfTextAtSize(titleText, 40);
    page.drawText(titleText, {
        x: (width - titleWidth) / 2,
        y: height - 175,
        size: 40,
        font: timesRoman,
        color: darkColor,
    });

    // ─── "This is to certify that" ───
    const certifyText = 'This is to certify that';
    const certifyWidth = helvetica.widthOfTextAtSize(certifyText, 14);
    page.drawText(certifyText, {
        x: (width - certifyWidth) / 2,
        y: height - 220,
        size: 14,
        font: helvetica,
        color: mutedColor,
    });

    // ─── Participant Name ───
    const nameSize = 36;
    const nameWidth = timesItalic.widthOfTextAtSize(participantName, nameSize);
    const nameX = (width - nameWidth) / 2;
    page.drawText(participantName, {
        x: nameX,
        y: height - 268,
        size: nameSize,
        font: timesItalic,
        color: primaryColor,
    });

    // Underline under name
    page.drawRectangle({
        x: nameX - 10,
        y: height - 276,
        width: nameWidth + 20,
        height: 1.5,
        color: primaryColor,
    });

    // ─── "has successfully participated in the event" ───
    const partText = 'has successfully participated in the event';
    const partWidth = helvetica.widthOfTextAtSize(partText, 14);
    page.drawText(partText, {
        x: (width - partWidth) / 2,
        y: height - 305,
        size: 14,
        font: helvetica,
        color: mutedColor,
    });

    // ─── Event Title ───
    const eventSize = 22;
    const eventWidth = helveticaBold.widthOfTextAtSize(eventTitle, eventSize);
    page.drawText(eventTitle, {
        x: (width - eventWidth) / 2,
        y: height - 340,
        size: eventSize,
        font: helveticaBold,
        color: darkColor,
    });

    // ─── Event Date ───
    const dateText = `held on ${eventDate}`;
    const dateWidth = helvetica.widthOfTextAtSize(dateText, 12);
    page.drawText(dateText, {
        x: (width - dateWidth) / 2,
        y: height - 370,
        size: 12,
        font: helvetica,
        color: mutedColor,
    });

    // ─── Signature Lines ───
    // Organizer signature (left)
    page.drawRectangle({ x: 100, y: 115, width: 200, height: 1, color: mutedColor });
    const orgNameWidth = helveticaBold.widthOfTextAtSize(organizerName || 'Event Organizer', 11);
    page.drawText(organizerName || 'Event Organizer', {
        x: 100 + (200 - orgNameWidth) / 2,
        y: 98,
        size: 11,
        font: helveticaBold,
        color: darkColor,
    });
    const orgLabelText = 'Event Organizer';
    const orgLabelWidth = helvetica.widthOfTextAtSize(orgLabelText, 9);
    page.drawText(orgLabelText, {
        x: 100 + (200 - orgLabelWidth) / 2,
        y: 85,
        size: 9,
        font: helvetica,
        color: mutedColor,
    });

    // Admin signature (right)
    page.drawRectangle({ x: width - 300, y: 115, width: 200, height: 1, color: mutedColor });
    const adminText = 'EventifyEDU Admin';
    const adminTextWidth = helveticaBold.widthOfTextAtSize(adminText, 11);
    page.drawText(adminText, {
        x: width - 300 + (200 - adminTextWidth) / 2,
        y: 98,
        size: 11,
        font: helveticaBold,
        color: darkColor,
    });
    const adminLabel = 'Digital Verification Authority';
    const adminLabelWidth = helvetica.widthOfTextAtSize(adminLabel, 9);
    page.drawText(adminLabel, {
        x: width - 300 + (200 - adminLabelWidth) / 2,
        y: 85,
        size: 9,
        font: helvetica,
        color: mutedColor,
    });

    // ─── Footer (Certificate ID & Issue Date) ───
    page.drawText(`Certificate ID: ${certificateId}`, {
        x: 50,
        y: 45,
        size: 8,
        font: helvetica,
        color: mutedColor,
    });
    page.drawText(`Issued on: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: 58,
        size: 8,
        font: helvetica,
        color: mutedColor,
    });

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

/**
 * Generates and saves a certificate to a file
 * @param {Object} data - Certificate data
 * @returns {Promise<string>} - The relative file path
 */
export async function saveCertificateToFile(data) {
    try {
        const pdfBuffer = await generateCertificatePDF(data);
        const fileName = `certificate-${data.certificateId}.pdf`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        return `/uploads/certificates/${fileName}`;
    } catch (error) {
        console.error("[v0] Error saving certificate to file:", error);
        throw error;
    }
}
