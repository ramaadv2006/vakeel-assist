import { jsPDF } from "jspdf";

function cleanText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/₹/g, "Rs. ")
    .replace(/\u00A0/g, " ");
}

/**
 * Direct Vector PDF Generator for DraftMitra using jsPDF
 *
 * A4 dimensions: 210mm x 297mm
 * Page 1 Margins: Top 32mm (Court Stamps), Left 28mm (Binding), Right 20mm, Bottom 20mm
 * Page 2 Margins: Top 18mm, Left 15mm, Right 15mm, Bottom 18mm, Vertical Fold at 105mm
 */
export function generateAndDownloadPdf(page1Blocks, page2Blocks, fileName = "Legal_Draft.pdf") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // --- PAGE 1: PETITION ---
  const p1MarginLeft = 28;
  const p1MarginRight = 20;
  const p1MarginTop = 32;
  const p1MarginBottom = 20;
  const p1ContentWidth = pageWidth - p1MarginLeft - p1MarginRight; // 162mm
  const p1MaxY = pageHeight - p1MarginBottom; // 277mm

  let currentY = p1MarginTop;

  // Font sizes & spacing in mm (pt to mm: 1pt ~ 0.3528mm)
  // Base font 12.5pt (17px) ~ 4.4mm text height, line spacing 6.8mm
  const baseFontSize = 12.5;
  const baseLineHeight = 6.8;

  doc.setFont("times", "normal");
  doc.setFontSize(baseFontSize);
  doc.setTextColor(17, 17, 17);

  function checkPageBreak(neededHeight) {
    if (currentY + neededHeight > p1MaxY) {
      doc.addPage();
      currentY = 25; // standard top margin for subsequent continuation pages
    }
  }

  for (const b of page1Blocks) {
    switch (b.t) {
      case "small": {
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        const text = cleanText(b.v);
        const lines = doc.splitTextToSize(text, p1ContentWidth);
        checkPageBreak(lines.length * 5 + 3);
        for (const line of lines) {
          doc.text(line, pageWidth / 2, currentY, { align: "center" });
          currentY += 4.8;
        }
        currentY += 2;
        break;
      }
      case "titleTop": {
        doc.setFont("times", "bold");
        doc.setFontSize(13.5);
        const text = cleanText(b.v);
        checkPageBreak(10);
        doc.text(text, pageWidth / 2, currentY, { align: "center" });
        const textWidth = doc.getTextWidth(text);
        doc.setLineWidth(0.3);
        doc.line((pageWidth - textWidth) / 2, currentY + 1, (pageWidth + textWidth) / 2, currentY + 1);
        currentY += 8;
        break;
      }
      case "center": {
        doc.setFont("times", "bold");
        doc.setFontSize(12.5);
        const text = cleanText(b.v);
        const lines = doc.splitTextToSize(text, p1ContentWidth);
        checkPageBreak(lines.length * 6 + 4);
        for (const line of lines) {
          doc.text(line, pageWidth / 2, currentY, { align: "center" });
          currentY += 6.2;
        }
        currentY += 2;
        break;
      }
      case "left": {
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        const rawLines = cleanText(b.v).split("\n");
        for (const rLine of rawLines) {
          const lines = doc.splitTextToSize(rLine, p1ContentWidth);
          checkPageBreak(lines.length * 6);
          for (const line of lines) {
            doc.text(line, p1MarginLeft, currentY);
            currentY += 6.0;
          }
        }
        currentY += 2;
        break;
      }
      case "right": {
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        const rawLines = cleanText(b.v).split("\n");
        for (const rLine of rawLines) {
          const lines = doc.splitTextToSize(rLine, p1ContentWidth);
          checkPageBreak(lines.length * 6);
          for (const line of lines) {
            doc.text(line, pageWidth - p1MarginRight, currentY, { align: "right" });
            currentY += 6.0;
          }
        }
        currentY += 2;
        break;
      }
      case "party": {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        const nameText = cleanText(b.v);
        const nameLines = doc.splitTextToSize(nameText, p1ContentWidth - 45);
        const rawRole = cleanText(b.role || "");
        const roleText = rawRole ? (rawRole.startsWith("...") ? rawRole : `...${rawRole}`) : "";
        checkPageBreak(Math.max(nameLines.length * 6, 6) + 3);

        const startY = currentY;
        for (const line of nameLines) {
          doc.text(line, p1MarginLeft, currentY);
          currentY += 5.8;
        }

        if (roleText) {
          doc.setFont("times", "italic");
          doc.setFontSize(11.5);
          doc.text(roleText, pageWidth - p1MarginRight, startY, { align: "right" });
        }
        currentY += 2;
        break;
      }
      case "versus": {
        doc.setFont("times", "italic");
        doc.setFontSize(11.5);
        checkPageBreak(8);
        doc.text("— Versus —", pageWidth / 2, currentY, { align: "center" });
        currentY += 7;
        break;
      }
      case "title": {
        doc.setFont("times", "bold");
        doc.setFontSize(12.5);
        const rawLines = cleanText(b.v).split("\n");
        let totalTitleHeight = 0;
        const allWrapped = [];
        for (const rLine of rawLines) {
          const lines = doc.splitTextToSize(rLine, p1ContentWidth);
          allWrapped.push(...lines);
          totalTitleHeight += lines.length * 6.2;
        }
        checkPageBreak(totalTitleHeight + 6);
        currentY += 3;
        for (const line of allWrapped) {
          doc.text(line, pageWidth / 2, currentY, { align: "center" });
          const textWidth = doc.getTextWidth(line);
          doc.setLineWidth(0.3);
          doc.line((pageWidth - textWidth) / 2, currentY + 0.8, (pageWidth + textWidth) / 2, currentY + 0.8);
          currentY += 6.5;
        }
        currentY += 3;
        break;
      }
      case "num": {
        doc.setFont("times", "normal");
        doc.setFontSize(baseFontSize);
        const numPrefix = `${b.n}. `;
        doc.setFont("times", "bold");
        const prefixWidth = doc.getTextWidth(numPrefix);
        doc.setFont("times", "normal");

        const text = cleanText(b.v);
        const lines = doc.splitTextToSize(text, p1ContentWidth - prefixWidth - 1);
        checkPageBreak(lines.length * baseLineHeight + 3);

        doc.setFont("times", "bold");
        doc.text(numPrefix, p1MarginLeft, currentY);
        doc.setFont("times", "normal");

        if (lines.length > 0) {
          doc.text(lines[0], p1MarginLeft + prefixWidth, currentY);
          currentY += baseLineHeight;
          for (let i = 1; i < lines.length; i++) {
            doc.text(lines[i], p1MarginLeft + prefixWidth, currentY);
            currentY += baseLineHeight;
          }
        }
        currentY += 2;
        break;
      }
      case "para": {
        doc.setFont("times", "normal");
        doc.setFontSize(baseFontSize);
        const firstLineWidth = p1ContentWidth - 8;
        const rawText = cleanText(b.v).trim();
        const words = rawText.split(/\s+/);

        const wrappedLines = [];
        let curLine = "";
        let isFirst = true;

        for (const w of words) {
          const test = curLine ? `${curLine} ${w}` : w;
          const maxW = isFirst ? firstLineWidth : p1ContentWidth;
          if (doc.getTextWidth(test) <= maxW) {
            curLine = test;
          } else {
            if (curLine) wrappedLines.push(curLine);
            curLine = w;
            isFirst = false;
          }
        }
        if (curLine) wrappedLines.push(curLine);

        checkPageBreak(wrappedLines.length * baseLineHeight + 3);

        for (let i = 0; i < wrappedLines.length; i++) {
          const xPos = i === 0 ? p1MarginLeft + 8 : p1MarginLeft;
          doc.text(wrappedLines[i], xPos, currentY);
          currentY += baseLineHeight;
        }
        currentY += 2;
        break;
      }
      case "prayer": {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        checkPageBreak(15);
        doc.text("PRAYER:", p1MarginLeft + 4, currentY);
        const textWidth = doc.getTextWidth("PRAYER:");
        doc.line(p1MarginLeft + 4, currentY + 0.8, p1MarginLeft + 4 + textWidth, currentY + 0.8);
        currentY += 6.5;

        doc.setFont("times", "normal");
        doc.setFontSize(baseFontSize);
        const prayerLines = doc.splitTextToSize(cleanText(b.v), p1ContentWidth - 8);
        checkPageBreak(prayerLines.length * baseLineHeight + 4);
        for (const pLine of prayerLines) {
          doc.text(pLine, p1MarginLeft + 8, currentY);
          currentY += baseLineHeight;
        }
        currentY += 3;
        break;
      }
      case "table": {
        const rows = b.rows || [];
        const colWidths = [14, 32, 32, 54, 30]; // total 162mm
        const colHeaders = ["S.No.", "Date of Filing", "Date of Doc", "Description", "Remarks"];
        checkPageBreak(25);

        // Draw Table Header
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        let curX = p1MarginLeft;
        for (let i = 0; i < colHeaders.length; i++) {
          doc.rect(curX, currentY, colWidths[i], 8);
          doc.text(colHeaders[i], curX + colWidths[i] / 2, currentY + 5.5, { align: "center" });
          curX += colWidths[i];
        }
        currentY += 8;

        // Draw Rows
        doc.setFont("times", "normal");
        doc.setFontSize(9.5);
        for (const r of rows) {
          const rowData = [
            cleanText(r.sno),
            cleanText(r.filedDate),
            cleanText(r.docDate),
            cleanText(r.desc),
            cleanText(r.remarks),
          ];
          const rowHeight = 8;
          checkPageBreak(rowHeight + 2);
          curX = p1MarginLeft;
          for (let i = 0; i < rowData.length; i++) {
            doc.rect(curX, currentY, colWidths[i], rowHeight);
            const align = i === 0 ? "center" : "left";
            const textX = align === "center" ? curX + colWidths[i] / 2 : curX + 2;
            doc.text(rowData[i], textX, currentY + 5.5, { align });
            curX += colWidths[i];
          }
          currentY += rowHeight;
        }
        currentY += 4;
        break;
      }
      case "signdual": {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        checkPageBreak(22);
        currentY += 6;
        doc.text(cleanText(b.left || "Accused"), p1MarginLeft, currentY);
        doc.text(cleanText(b.right || "Counsel for Accused"), pageWidth - p1MarginRight, currentY, { align: "right" });
        currentY += 8;
        break;
      }
      case "sign": {
        doc.setFont("times", "normal");
        doc.setFontSize(11.5);
        checkPageBreak(22);
        currentY += 6;
        if (b.place) {
          doc.text(`Place: ${cleanText(b.place)}`, p1MarginLeft, currentY);
        }
        if (b.date) {
          doc.text(`Date: ${cleanText(b.date)}`, p1MarginLeft, currentY + 5.5);
        }
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(cleanText(b.label || "Counsel"), pageWidth - p1MarginRight, currentY + 5.5, { align: "right" });
        currentY += 12;
        break;
      }
      case "signblock": {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        const raw = cleanText(b.v || "");
        const lines = raw.split("\n");

        if (b.dual || /\s{4,}/.test(raw)) {
          checkPageBreak(25);
          currentY += 8;
          for (const line of lines) {
            const parts = line.split(/\s{4,}/);
            if (parts.length >= 2) {
              doc.text(parts[0].trim(), p1MarginLeft, currentY);
              doc.text(parts[1].trim(), pageWidth - p1MarginRight, currentY, { align: "right" });
            } else {
              doc.text(line.trim(), pageWidth - p1MarginRight, currentY, { align: "right" });
            }
            currentY += 6.0;
          }
        } else {
          checkPageBreak(lines.length * 6 + 10);
          currentY += 8;
          for (const line of lines) {
            doc.text(line.trim(), pageWidth - p1MarginRight, currentY, { align: "right" });
            currentY += 6.0;
          }
        }
        currentY += 4;
        break;
      }
      case "space": {
        currentY += 3;
        break;
      }
      case "pre": {
        doc.setFont("courier", "normal");
        doc.setFontSize(9.5);
        const text = cleanText(b.v);
        const lines = doc.splitTextToSize(text, p1ContentWidth);
        checkPageBreak(lines.length * 4.5 + 4);
        for (const line of lines) {
          doc.text(line, p1MarginLeft, currentY);
          currentY += 4.5;
        }
        doc.setFont("times", "normal");
        doc.setFontSize(baseFontSize);
        currentY += 2;
        break;
      }
    }
  }

  // --- PAGE 2: FOLDED BACKING SHEET / DOCKET ---
  if (page2Blocks && page2Blocks.length > 0) {
    doc.addPage();

    // Draw vertical center dashed fold line
    const foldX = 105;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(foldX, 15, foldX, pageHeight - 15);
    doc.setLineDashPattern([], 0);

    // Right column bounds (Docket covers right half)
    const docketLeft = 115;
    const docketRight = pageWidth - 15; // 195mm
    const docketWidth = docketRight - docketLeft; // 80mm
    const docketCenterX = docketLeft + docketWidth / 2; // 155mm

    let docketY = 24;

    const mainDocketBlocks = page2Blocks.filter((b) => b.t !== "signblock");
    const signDocketBlocks = page2Blocks.filter((b) => b.t === "signblock");

    for (const b of mainDocketBlocks) {
      switch (b.t) {
        case "center": {
          doc.setFont("times", "bold");
          doc.setFontSize(11.5);
          const lines = doc.splitTextToSize(cleanText(b.v), docketWidth);
          for (const line of lines) {
            doc.text(line, docketCenterX, docketY, { align: "center" });
            docketY += 5.5;
          }
          docketY += 3;
          break;
        }
        case "left": {
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          const rawLines = cleanText(b.v).split("\n");
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, docketWidth);
            for (const line of lines) {
              doc.text(line, docketLeft, docketY);
              docketY += 5.2;
            }
          }
          docketY += 2;
          break;
        }
        case "party": {
          doc.setFont("times", "bold");
          doc.setFontSize(11.5);
          const nameLines = doc.splitTextToSize(cleanText(b.v), docketWidth);
          for (const line of nameLines) {
            doc.text(line, docketLeft, docketY);
            docketY += 5.2;
          }
          if (b.role) {
            doc.setFont("times", "italic");
            doc.setFontSize(10.5);
            doc.text(cleanText(b.role), docketLeft, docketY);
            docketY += 5.2;
          }
          docketY += 2;
          break;
        }
        case "versus": {
          doc.setFont("times", "italic");
          doc.setFontSize(11);
          doc.text("— Versus —", docketCenterX, docketY, { align: "center" });
          docketY += 6;
          break;
        }
        case "title": {
          doc.setFont("times", "bold");
          doc.setFontSize(12);
          const rawLines = cleanText(b.v).split("\n");
          docketY += 3;
          for (const rLine of rawLines) {
            const lines = doc.splitTextToSize(rLine, docketWidth);
            for (const line of lines) {
              doc.text(line, docketCenterX, docketY, { align: "center" });
              const textWidth = doc.getTextWidth(line);
              doc.setLineWidth(0.3);
              doc.line(docketCenterX - textWidth / 2, docketY + 0.8, docketCenterX + textWidth / 2, docketY + 0.8);
              docketY += 5.8;
            }
          }
          docketY += 4;
          break;
        }
        case "para": {
          doc.setFont("times", "normal");
          doc.setFontSize(11);
          const lines = doc.splitTextToSize(cleanText(b.v), docketWidth);
          for (const line of lines) {
            doc.text(line, docketLeft, docketY);
            docketY += 5.5;
          }
          docketY += 2;
          break;
        }
        case "space": {
          docketY += 3;
          break;
        }
      }
    }

    if (signDocketBlocks.length > 0) {
      const signY = Math.max(docketY + 15, pageHeight - 48);
      let curSignY = signY;
      for (const b of signDocketBlocks) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        const lines = cleanText(b.v).split("\n");
        for (const line of lines) {
          doc.text(line.trim(), docketRight, curSignY, { align: "right" });
          curSignY += 5.5;
        }
      }
    }
  }

  // Directly trigger client-side download
  doc.save(fileName);
}
