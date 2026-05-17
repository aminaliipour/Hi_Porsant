import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";

  // ساخت و دانلود فایل اکسل (در صورت موجود بودن xlsx) یا CSV به‌عنوان fallback
  async function handleDownloadExcel() {
    const reportElement = document.getElementById("report-main-container");
    if (!reportElement) return;

    // جمع‌آوری داده‌ها از جداول داخل گزارش
    const tables = Array.from(reportElement.querySelectorAll('table')) as HTMLTableElement[];
    const sheets: Array<{ name: string, data: any[][] }> = [];

    if (tables.length === 0) {
      // اگر جدولی نیست، خروجی متن ساده از محتوای کارت‌ها بساز
      const text = reportElement.innerText || '';
      const csv = '\uFEFF' + text.split('\n').map(r => '"' + r.replace(/"/g, '""') + '"').join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    tables.forEach((table, idx) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      const data: any[][] = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => (cell.textContent || '').trim());
      });
      sheets.push({ name: `Sheet${idx + 1}`, data });
    });

    // تلاش برای استفاده از کتابخانه xlsx در صورت نصب بودن
    try {
      // dynamic import - اگر xlsx نصب نباشد خطا می‌افتد و به fallback می‌رویم
      // @ts-ignore
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const wb = XLSX.utils.book_new();
      sheets.forEach(s => {
        const ws = XLSX.utils.aoa_to_sheet(s.data);
        XLSX.utils.book_append_sheet(wb, ws, s.name);
      });
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      return;
    } catch (e) {
      // fallback to CSV (with BOM for Excel UTF-8)
      const csvParts: string[] = [];
      sheets.forEach((s, idx) => {
        if (idx > 0) csvParts.push('\r\n');
        s.data.forEach(row => {
          const line = row.map(cell => '"' + (cell || '').replace(/"/g, '""') + '"').join(',');
          csvParts.push(line);
        });
      });
      const csv = '\uFEFF' + csvParts.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
  }

export default function ReportPdfButton() {
  const handleDownloadPdf = async () => {
  // فقط بخش اصلی گزارش را برای PDF بگیر (بدون دکمه‌ها)
  const reportElement = document.getElementById("report-main-container");
    if (!reportElement) return;
    // اعمال فونت IRANSansWeb و بهبود رندر قبل از گرفتن canvas
    const prevFont = (reportElement as HTMLElement).style.fontFamily || '';
    (reportElement as HTMLElement).classList.add('font-iransans');
    (reportElement as HTMLElement).style.letterSpacing = '0px';
  ((reportElement as any).style as any).webkitFontSmoothing = 'antialiased';
    (reportElement as HTMLElement).style.textRendering = 'optimizeLegibility';
    try {
      // اگر مرورگر پشتیبانی می‌کند، صبر کن تا فونت بارگذاری شود
      // @ts-ignore
      if (document.fonts && document.fonts.load) {
        // @ts-ignore
        await document.fonts.load("16px 'IRANSansWeb'");
        // @ts-ignore
        await document.fonts.ready;
      } else {
        // fallback: کمی تاخیر
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 200));
    }

    // Render title to image to ensure Persian ligatures join correctly in the capture
    const titleEl = document.querySelector('#report-main-container .report-title') as HTMLElement | null;
    let titleBackup: { html: string } | null = null;
    if (titleEl) {
      try {
        titleBackup = { html: titleEl.innerHTML };
        const computed = window.getComputedStyle(titleEl);
        const fontSize = parseFloat(computed.fontSize || '24');
        const fontWeight = computed.fontWeight || '700';
        const padding = 8;
        // create a canvas sized to the element
        const canvasEl = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(300, Math.ceil(titleEl.offsetWidth * dpr));
        const height = Math.ceil((fontSize + padding * 2) * dpr);
        canvasEl.width = width;
        canvasEl.height = height;
        canvasEl.style.width = `${width / dpr}px`;
        canvasEl.style.height = `${height / dpr}px`;
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.fillStyle = computed.color || '#fff';
          ctx.font = `${fontWeight} ${fontSize}px IRANSansWeb`;
          ctx.textAlign = 'right';
          ctx.direction = 'rtl';
          ctx.textBaseline = 'middle';
          // fill background transparent (keep card background)
          // draw text at right edge with small padding
          const x = titleEl.offsetWidth - padding;
          const y = (height / dpr) / 2;
          ctx.fillText(titleEl.textContent || '', x, y);
        }
        const imgUrl = canvasEl.toDataURL('image/png');
        // replace title content with image
        titleEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        titleEl.appendChild(img);
      } catch (e) {
        // ignore and continue
      }
    }

    // Temporarily hide any elements marked with .no-print to guarantee they're not captured
    const hiddenEls: Array<{el: Element, prev: string}> = [];
    document.querySelectorAll('.no-print').forEach((el) => {
      const prev = (el as HTMLElement).style.display || '';
      hiddenEls.push({ el, prev });
      (el as HTMLElement).style.display = 'none';
    });

    // constrain report to A4 landscape width to avoid horizontal overflow during capture
    const prevWidth = (reportElement as HTMLElement).style.width || '';
    const prevFontSize = (reportElement as HTMLElement).style.fontSize || '';
    const prevLineHeight = (reportElement as HTMLElement).style.lineHeight || '';
    const prevTransform = (reportElement as HTMLElement).style.transform || '';
    const prevTransformOrigin = (reportElement as HTMLElement).style.transformOrigin || '';

    // target A4 landscape width in px
    const targetWidth = 1123;
    // scale down so table contents become much smaller and fit better
    // lowered from 0.72 to 0.65 to shrink remaining large cells
    const scaleFactor = 0.65;

    // set element width larger so after scaling it matches targetWidth
    (reportElement as HTMLElement).style.width = `${Math.round(targetWidth / scaleFactor)}px`;
    (reportElement as HTMLElement).style.boxSizing = 'border-box';
    // reduce base font size and line-height
    (reportElement as HTMLElement).style.fontSize = '8px';
    (reportElement as HTMLElement).style.lineHeight = '1';
    // apply CSS transform scale to shrink content visually
    (reportElement as HTMLElement).style.transformOrigin = 'top left';
    (reportElement as HTMLElement).style.transform = `scale(${scaleFactor})`;

    // inject temporary style to reduce paddings in tables and tighten spacing
    const tempStyle = document.createElement('style');
    tempStyle.id = 'report-pdf-temp-style';
    tempStyle.innerHTML = `
      /* Force uniform small font and tighter spacing for PDF export */
      #report-main-container, #report-main-container * { font-size: 7px !important; font-family: IRANSansWeb, Tahoma, Arial, sans-serif !important; line-height: 1 !important; }
      #report-main-container table td, #report-main-container table th { padding: 12px !important; }
      #report-main-container table th { font-size: 7px !important; }
      #report-main-container .report-card, #report-main-container .card { padding: 4px !important; }
      #report-main-container .report-title img { max-height: 40px !important; }
      #report-main-container .font-bold, #report-main-container strong { font-size: 7px !important; }
    `;
    document.head.appendChild(tempStyle);
    // capture at higher resolution for better PDF quality
    const dpr = (window.devicePixelRatio && window.devicePixelRatio > 1) ? window.devicePixelRatio : 1;
    const qualityFactor = 2 // increase for higher quality (2x DPR)
    const captureScale = dpr * qualityFactor
    const canvas = await html2canvas(reportElement as HTMLElement, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: "#fff",
      // improve timeout for images
      imageTimeout: 0,
      logging: false
    });
    // restore original width and text styles
    (reportElement as HTMLElement).style.width = prevWidth;
    (reportElement as HTMLElement).style.fontSize = prevFontSize;
    (reportElement as HTMLElement).style.lineHeight = prevLineHeight;
    (reportElement as HTMLElement).style.transform = prevTransform;
    (reportElement as HTMLElement).style.transformOrigin = prevTransformOrigin;
    // remove temporary style
    const existingTemp = document.getElementById('report-pdf-temp-style');
    if (existingTemp && existingTemp.parentNode) existingTemp.parentNode.removeChild(existingTemp);

    // restore hidden elements and styles before PDF creation
    hiddenEls.forEach(({ el, prev }) => {
      (el as HTMLElement).style.display = prev || '';
    });
    (reportElement as HTMLElement).classList.remove('font-iransans');
    (reportElement as HTMLElement).style.fontFamily = prevFont;

    // restore title if replaced by image
    if (titleEl && titleBackup) {
      titleEl.innerHTML = titleBackup.html;
    }

    // create multi-page PDF preserving on-screen scale (landscape)
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // convert canvas to image and split into pages based on aspect ratio
    const imgProps = { width: canvasWidth, height: canvasHeight };
    // height of one PDF page in canvas pixels
    const pxPerMm = canvasWidth / pageWidth; // px per mm when image width == pageWidth
    const pageHeightPx = Math.floor(pageHeight * pxPerMm);

    let yOffset = 0;
    while (yOffset < canvasHeight) {
      const sliceHeight = Math.min(pageHeightPx, canvasHeight - yOffset);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, yOffset, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);
      }
      const imgData = pageCanvas.toDataURL('image/png');
      // add page image scaled to pageWidth x pageHeight (maintain aspect)
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, (sliceHeight / pxPerMm));
      yOffset += sliceHeight;
      if (yOffset < canvasHeight) pdf.addPage();
    }

    pdf.save('report.pdf');
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleDownloadPdf} variant="secondary">
        دانلود PDF گزارش
      </Button>
      <Button onClick={handleDownloadExcel} variant="outline">
        دانلود Excel گزارش
      </Button>
    </div>
  );
}
