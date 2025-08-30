import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";

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

    // capture at device pixel ratio so on-screen size is preserved
    const scale = (window.devicePixelRatio && window.devicePixelRatio > 1) ? window.devicePixelRatio : 1;
    const canvas = await html2canvas(reportElement as HTMLElement, {
      scale,
      useCORS: true,
      backgroundColor: "#fff"
    });

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

    // create multi-page PDF preserving on-screen scale
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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
      const imgData = pageCanvas.toDataURL('image/jpeg', 1);
      // add page image scaled to pageWidth x pageHeight (maintain aspect)
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, (sliceHeight / pxPerMm));
      yOffset += sliceHeight;
      if (yOffset < canvasHeight) pdf.addPage();
    }

    pdf.save('report.pdf');
  };

  return (
    <Button onClick={handleDownloadPdf} variant="secondary">
      دانلود PDF گزارش
    </Button>
  );
}
