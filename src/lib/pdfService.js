import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkitModule from "fontkit";

function getFontBytes(fontFilename) {
  const possiblePaths = [
    path.join(process.cwd(), "fonts", fontFilename),
    path.join(process.cwd(), "public", "fonts", fontFilename),
    path.resolve("fonts", fontFilename),
    path.resolve("public", "fonts", fontFilename),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  }

  throw new Error(`Font file ${fontFilename} not found in searched paths.`);
}

export async function createPdfFromNotes(notes) {
  const pdfDoc = await PDFDocument.create();

  // Resolve fontkit instance correctly across CommonJS / ESM / Webpack bundles
  const fk =
    fontkitModule && typeof fontkitModule.open === "function"
      ? fontkitModule
      : fontkitModule?.default && typeof fontkitModule.default.open === "function"
      ? fontkitModule.default
      : fontkitModule;

  pdfDoc.registerFontkit(fk);

  const regularFontBytes = getFontBytes("NotoSans-Regular.ttf");
  const boldFontBytes = getFontBytes("NotoSans-Bold.ttf");

  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  let page = pdfDoc.addPage();
  let y = page.getHeight() - 50;
  const maxWidth = 500;
  const lineHeight = 18;

  function wrapTextToWidth(text, font, fontSize, maxW) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine + word + " ";
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxW) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
  }

  function drawLines(lines, font, fontSize, color, indent = 60) {
    for (const line of lines) {
      if (y < 80) {
        page = pdfDoc.addPage();
        y = page.getHeight() - 50;
      }
      page.drawText(line, { x: indent, y, size: fontSize, font, color });
      y -= lineHeight;
    }
  }

  function drawMarkdownTable(tableLines, regFont, bFont) {
    const rows = tableLines
      .filter((line) => line.trim() !== "")
      .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()));

    if (!rows.length) return;
    const colCount = rows[0].length || 1;
    const tableMaxWidth = 500;
    const cellPadding = 6;
    const cellWidth = Math.floor(tableMaxWidth / colCount);

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      if (y < 100) {
        page = pdfDoc.addPage();
        y = page.getHeight() - 50;
      }

      let x = 50;
      let maxHeightInRow = 0;

      const cellLinesArr = rows[rowIdx].map((cell, colIdx) => {
        const font = rowIdx === 0 ? bFont : regFont;
        const wrapped = wrapTextToWidth(cell, font, 12, cellWidth - 2 * cellPadding);
        maxHeightInRow = Math.max(maxHeightInRow, wrapped.length * lineHeight + cellPadding * 2);
        return wrapped;
      });

      for (let colIdx = 0; colIdx < colCount; colIdx++) {
        const font = rowIdx === 0 ? bFont : regFont;
        const cellLines = cellLinesArr[colIdx] || [];

        // Draw border first
        page.drawRectangle({
          x,
          y: y - maxHeightInRow,
          width: cellWidth,
          height: maxHeightInRow,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });

        // Draw text with padding
        let textY = y - cellPadding;
        for (const line of cellLines) {
          page.drawText(line, {
            x: x + cellPadding,
            y: textY - lineHeight,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
          textY -= lineHeight;
        }

        x += cellWidth;
      }

      y -= maxHeightInRow + 5;
    }

    y -= 10;
  }

  for (const { topic, content } of notes) {
    const heading = topic.toUpperCase();
    const headingLines = wrapTextToWidth(heading, boldFont, 16, maxWidth);
    drawLines(headingLines, boldFont, 16, rgb(0.2, 0.2, 0.7), 50);
    y -= 8;

    const cleaned = content
      .replace(/\*\*/g, "")
      .replace(/[_#`]/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();

    const lines = cleaned.split("\n");

    let tableMode = false;
    let tableBuffer = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Detect markdown table
      if (line.startsWith("|") && line.endsWith("|")) {
        tableMode = true;
        tableBuffer.push(line);
        continue;
      }

      if (tableMode && (!line.startsWith("|") || !line.endsWith("|"))) {
        drawMarkdownTable(tableBuffer, regularFont, boldFont);
        tableBuffer = [];
        tableMode = false;
      }

      const isSubheading = /^[A-Z][A-Za-z ]+:\s*$/.test(line);
      const font = isSubheading ? boldFont : regularFont;

      const wrapped = wrapTextToWidth(line, font, 12, maxWidth);
      drawLines(wrapped, font, 12, rgb(0, 0, 0));
      y -= 8;
    }

    if (tableMode) {
      drawMarkdownTable(tableBuffer, regularFont, boldFont);
      tableBuffer = [];
      tableMode = false;
    }

    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
