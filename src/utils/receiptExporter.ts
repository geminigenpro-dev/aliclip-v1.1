import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Captures a DOM element as a high-resolution PNG data URL
 * Uses html-to-image to fully support modern CSS (oklch, CSS variables, flexbox, etc.)
 */
async function captureElementToPng(
  element: HTMLElement,
  options?: { pixelRatio?: number; backgroundColor?: string }
): Promise<string> {
  const pixelRatio = options?.pixelRatio ?? 2.5;
  const backgroundColor = options?.backgroundColor ?? '#ffffff';

  // Always use skipFonts: true to prevent SecurityError when inspecting cross-origin stylesheets (e.g. Google Fonts)
  // The browser natively renders the loaded fonts in the SVG foreignObject canvas anyway
  return await toPng(element, {
    pixelRatio,
    backgroundColor,
    skipFonts: true,
    cacheBust: false,
  });
}

/**
 * Downloads a DOM element as a high-resolution PNG image
 */
export async function downloadElementAsPng(
  elementId: string,
  filename: string = 'comprobante.png'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found.`);
  }

  const dataUrl = await captureElementToPng(element, { pixelRatio: 2.5 });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

/**
 * Downloads a DOM element as an official PDF document
 */
export async function downloadElementAsPdf(
  elementId: string,
  filename: string = 'comprobante.pdf',
  documentTitle?: string
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found.`);
  }

  const dataUrl = await captureElementToPng(element, { pixelRatio: 2.5 });

  // Load image to calculate aspect ratio and page geometry
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load rendered image for PDF generation.'));
  });

  const imgWidth = img.naturalWidth || img.width || 600;
  const imgHeight = img.naturalHeight || img.height || 800;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (documentTitle) {
    pdf.setProperties({
      title: documentTitle,
      subject: 'Comprobante de Pago Digital',
      author: 'AliClip',
    });
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Margins
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = (imgHeight * contentWidth) / imgWidth;

  // Center vertically if it fits cleanly on a single page
  let startY = 15;
  if (contentHeight < pageHeight - 30) {
    startY = Math.max(15, (pageHeight - contentHeight) / 2 - 10);
  }

  pdf.addImage(
    dataUrl,
    'PNG',
    marginX,
    startY,
    contentWidth,
    Math.min(pageHeight - 20, contentHeight),
    undefined,
    'FAST'
  );

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  return true;
}

/**
 * Triggers printing of a receipt element cleanly
 * Uses high-res rasterization in an isolated frame for pixel-perfect printing
 */
export async function printReceiptElement(
  elementId: string,
  onFallback?: () => void
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  try {
    // Generate high-resolution image representation so all Tailwind styles and layout are preserved
    const dataUrl = await captureElementToPng(element, { pixelRatio: 2.5 });

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute(
      'style',
      'position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;z-index:-1;'
    );
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Imprimir Comprobante</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: auto;
      margin: 10mm;
    }
    body {
      background: #ffffff;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    img.printable-receipt {
      width: 100%;
      max-width: 520px;
      height: auto;
      display: block;
      margin: 0 auto;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <img class="printable-receipt" src="${dataUrl}" alt="Comprobante" />
  <script>
    window.onload = function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Iframe print error', e);
        }
      }, 250);
    };
  </script>
</body>
</html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print failed:', e);
          if (onFallback) onFallback();
        } finally {
          setTimeout(() => {
            if (printFrame.parentNode) {
              printFrame.parentNode.removeChild(printFrame);
            }
          }, 5000);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Error preparing receipt print frame:', err);
    try {
      window.print();
    } catch {
      if (onFallback) onFallback();
    }
  }
}

