import type { PurchaseOrderRecord, PurchaseOrderItemRecord } from "@/services/purchaseOrderService";
import type { StoreSettingsRecord } from "@/services/storeSettingsService";

type PdfItem = PurchaseOrderItemRecord & {
  hsnCode?: string | null;
  gstRate?: number | null;
  discountPercent?: number | null;
  name?: string | null;
  description?: string | null;
  uom?: string | null;
  UOM?: string | null;
};

const escapePdfText = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, "?").replace(/[\\()]/g, "\\$&");

const wrap = (value: string, width: number) => {
  const words = String(value || "-").trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  });
  return lines.length ? lines : ["-"];
};

const formatDate = (value?: string | null) => {
  if (!value) return "XX/XX/XXX";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const amountInWords = (value: number) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (number: number) =>
    number < 20 ? ones[number] : `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""}`;
  const threeDigits = (number: number) =>
    number >= 100 ? `${twoDigits(Math.floor(number / 100))} Hundred${number % 100 ? ` ${twoDigits(number % 100)}` : ""}` : twoDigits(number);

  const rounded = Math.round(Number(value || 0));
  if (rounded === 0) return "Zero Rupees Only";
  let remainder = rounded;
  const parts: string[] = [];
  const sections = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];
  sections.forEach(([base, label]) => {
    const count = Math.floor(remainder / Number(base));
    if (count) parts.push(`${threeDigits(count)} ${label}`);
    remainder %= Number(base);
  });
  if (remainder) parts.push(threeDigits(remainder));
  return `Indian Rupees ${parts.join(" ")} Only`;
};

export const createPurchaseOrderPdf = (
  purchaseOrder: PurchaseOrderRecord,
  storeSettings?: StoreSettingsRecord | null,
): Blob => {
  const pages: string[][] = [];
  let commands: string[] = [];

  const beginPage = () => {
    commands = [];
    pages.push(commands);
  };

  const addText = (
    value: string,
    x: number,
    y: number,
    options: { size?: number; font?: "F1" | "F2"; align?: "left" | "right" } = {},
  ) => {
    const size = options.size ?? 8;
    const font = options.font ?? "F1";
    const text = escapePdfText(value);
    if (options.align === "right") {
      const alignedX = Math.max(left, x - text.length * size * 0.52);
      commands.push(`0.1 0.1 0.1 rg BT /${font} ${size} Tf 1 0 0 1 ${alignedX} ${y} Tm (${text}) Tj ET`);
    } else {
      commands.push(`0.1 0.1 0.1 rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${text}) Tj ET`);
    }
  };

  const rect = (x: number, y: number, width: number, height: number, fill = false) => {
    commands.push(`0.1 0.1 0.1 RG ${fill ? "0.98 0.98 0.98 rg" : "1 1 1 rg"} ${x} ${y} ${width} ${height} re ${fill ? "B" : "S"}`);
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    commands.push(`0.1 0.1 0.1 RG 0.55 w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const poNumber = purchaseOrder.name || `PO-${purchaseOrder.id}`;
  const vendorAddress = [
    purchaseOrder.vendorAddress,
    purchaseOrder.vendorCity,
    purchaseOrder.vendorState,
    purchaseOrder.vendorZip,
  ].filter(Boolean).join(", ");
  const items = purchaseOrder.items as PdfItem[];

  beginPage();
  const left = 28;
  const right = 584;
  const width = right - left;

  const companyName = storeSettings?.storeName || "Pavilions and Interiors (India) Pvt. Ltd.";
  const companyAddress = storeSettings?.contactAddress || "XL-1641, Press Club Road, Kochi-682 011, Kerala";
  const companyGst = storeSettings?.gstNumber || "32AACCP5781C1ZO";
  wrap(companyName, 42).slice(0, 2).forEach((text, index) =>
    addText(text, left, 754 - index * 14, { size: 11, font: "F2" }),
  );
  wrap(companyAddress, 46).slice(0, 2).forEach((text, index) =>
    addText(text, left, 726 - index * 12, { size: 8 }),
  );
  addText(`GST No: ${companyGst}`, left, 702, { size: 8 });

  rect(348, 690, 236, 76);
  addText("Purchase Order", 360, 752, { size: 10, font: "F2" });
  addText(`Purchase Order No.: ${poNumber}`, 360, 734, { size: 8, font: "F2" });
  addText(`Dated: ${formatDate(purchaseOrder.orderDate)}`, 360, 722, { size: 8 });
  line(348, 714, 584, 714);
  addText(`Requisition/Quotation No.: PR-${purchaseOrder.purchaseRequestId}`, 360, 704, { size: 8, font: "F2" });
  addText(`Dated: ${formatDate(purchaseOrder.dueDate)}`, 360, 692, { size: 8 });

  rect(left, 612, width, 86);
  line(348, 612, 348, 698);
  addText(`Vendor's Name & Address: ${purchaseOrder.vendorName ? `Ms. ${purchaseOrder.vendorName}` : "Ms. -"}`, left + 8, 684, { size: 8, font: "F2" });
  const vendorLines = wrap(vendorAddress || "-", 58);
  vendorLines.slice(0, 3).forEach((text, index) => addText(text, left + 8, 670 - index * 12, { size: 8 }));
  if (purchaseOrder.vendorGstNumber) addText(`GST: ${purchaseOrder.vendorGstNumber}`, left + 8, 620, { size: 8 });

  addText(`Delivery At: ${purchaseOrder.deliveryAddress || purchaseOrder.projectName || "-"}`, 360, 684, { size: 8, font: "F2" });
  addText(`Payment Terms: ${(purchaseOrder as PurchaseOrderRecord & { paymentTerms?: string }).paymentTerms || "-"}`, 360, 650, { size: 8, font: "F2" });
  addText(`Project Name: ${purchaseOrder.projectName || "-"}`, 360, 618, { size: 8, font: "F2" });

  const columns = [
    { x: left, w: 28, label: "Sl.No." },
    { x: left + 28, w: 178, label: "Description of Goods" },
    { x: left + 206, w: 48, label: "HSN Code" },
    { x: left + 254, w: 42, label: "Gst Rate" },
    { x: left + 296, w: 38, label: "Qty" },
    { x: left + 334, w: 42, label: "UOM" },
    { x: left + 376, w: 72, label: "Rate Per Unit" },
    { x: left + 448, w: 42, label: "Disc %" },
    { x: left + 490, w: 66, label: "Amount" },
  ];
  const tableTop = 594;
  const headerHeight = 28;
  columns.forEach((column) => rect(column.x, tableTop - headerHeight, column.w, headerHeight));
  const headerLabels: Record<string, string[]> = {
    "Sl.No.": ["Sl.", "No."],
    "Description of Goods": ["Description", "of Goods"],
    "HSN Code": ["HSN", "Code"],
    "Gst Rate": ["GST", "Rate"],
    "Qty": ["Qty"],
    "UOM": ["UOM"],
    "Rate Per Unit": ["Rate Per", "Unit"],
    "Disc %": ["Disc", "%"],
    "Amount": ["Amount"],
  };
  columns.forEach((column) => {
    const labelLines = headerLabels[column.label] ?? [column.label];
    const startY = labelLines.length > 1 ? tableTop - 10 : tableTop - 14;
    labelLines.forEach((text, index) =>
      addText(text, column.x + column.w / 2 - text.length * 2.1, startY - index * 9, { size: 7, font: "F2" }),
    );
  });

  const itemRowCount = 16;
  const rowHeight = 18;
  for (let row = 0; row < itemRowCount; row += 1) {
    const y = tableTop - headerHeight - (row + 1) * rowHeight;
    columns.forEach((column) => rect(column.x, y, column.w, rowHeight));
  }

  items.slice(0, itemRowCount).forEach((item, index) => {
    const y = tableTop - headerHeight - (index + 1) * rowHeight + 6;
    const discount = item.discountPercent ?? 0;
    const gstRate = item.gstRate ?? 0;
    addText(String(index + 1), left + 7, y, { size: 8 });
    const itemName = item.itemName || item.name || item.description || `Item ${item.itemId}`;
    const uom = item.unit || item.uom || item.UOM || "-";
    const description = `${itemName} | Qty: ${item.quantity} | UOM: ${uom}`;
    const nameLines = wrap(description, 38);
    nameLines.slice(0, 1).forEach((text) => addText(text, left + 32, y, { size: 7 }));
    addText(item.hsnCode || "-", left + 210, y, { size: 7 });
    addText(gstRate ? `${gstRate}%` : "-", left + 258, y, { size: 7 });
    addText(String(item.quantity), left + 300, y, { size: 7 });
    addText(uom, left + 338, y, { size: 7 });
    addText(formatAmount(item.vendorPrice), left + 448, y, { size: 7, align: "right" });
    addText(discount ? `${discount}%` : "-", left + 452, y, { size: 7 });
    addText(formatAmount(item.totalPrice), 580, y, { size: 7, align: "right" });
  });

  let summaryTop = tableTop - headerHeight - itemRowCount * rowHeight;
  rect(left, summaryTop - 18, width, 18);
  addText("Total", left + 8, summaryTop - 12, { size: 8, font: "F2" });
  const goodsTotal = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  addText(formatAmount(goodsTotal), 580, summaryTop - 12, { size: 8, font: "F2", align: "right" });

  rect(left, summaryTop - 90, width, 72);
  line(348, summaryTop - 90, 348, summaryTop - 18);
  addText(`Delivery At: ${purchaseOrder.deliveryAddress || purchaseOrder.projectName || "-"}`, left + 8, summaryTop - 30, { size: 8, font: "F2" });
  addText(`Freight Charges: -`, 360, summaryTop - 30, { size: 8, font: "F2" });
  addText(`CGST: -`, 360, summaryTop - 48, { size: 8, font: "F2" });
  addText(`SGST: -`, 360, summaryTop - 66, { size: 8, font: "F2" });
  addText(`Net Amount: ${formatAmount(purchaseOrder.totalAmount)}`, 360, summaryTop - 84, { size: 8, font: "F2" });

  const bottomTop = summaryTop - 96;
  rect(left, bottomTop - 38, width, 38);
  const amountWords = amountInWords(purchaseOrder.totalAmount);
  const amountWordLines = wrap(`Amount Chargeable (In Words): ${amountWords}`, 82);
  amountWordLines.slice(0, 2).forEach((text, index) =>
    addText(text, left + 8, bottomTop - 12 - index * 10, { size: 7, font: "F2" }),
  );

  rect(left, bottomTop - 92, width, 54);
  const terms = wrap(purchaseOrder.termsAndConditions || "-", 118);
  addText(`Special Remarks: (Terms & Conditions): ${terms.slice(0, 3).join(" ")}`, left + 8, bottomTop - 50, { size: 7, font: "F2" });

  rect(left, 30, width, 46);
  addText("Entered By", left + 8, 58, { size: 8, font: "F2" });
  addText(`For ${companyName}`, 348, 58, { size: 8, font: "F2" });
  addText("Authorized Signatory", 348, 38, { size: 8, font: "F2" });

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  pages.forEach((page, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const stream = page.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = document.length;
    document += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    document += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: "application/pdf" });
};
