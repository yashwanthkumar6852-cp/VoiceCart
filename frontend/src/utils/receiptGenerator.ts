import { OrderRecord } from '../types';

export const generateAndPrintReceipt = (
  order: OrderRecord,
  paymentId?: string,
  method?: string,
  amount?: number,
  paidAt?: string
) => {
  const printWindow = window.open('', '_blank', 'width=840,height=960');
  if (!printWindow) {
    alert('Please allow popups to download/print the order receipt.');
    return;
  }

  const finalPaymentId = paymentId || order.paymentDetails?.paymentId || order.paymentId || 'PAY-VC-' + order.orderId;
  const finalMethod = method || order.paymentDetails?.method || order.paymentMethod || 'Instant Payment';
  const finalAmount = amount || order.totalAmount || 0;
  const finalPaidAt = paidAt || order.paidAt || order.orderedAt || new Date().toISOString();

  const rawItems = order.orderItems || order.items || [];
  const itemsHtml = rawItems.length > 0
    ? rawItems
        .map((item: any) => {
          const title = item.title || item.product?.title || order.productTitle;
          const store = (item.store || item.product?.store || order.store || 'amazon').toUpperCase();
          const seller = item.seller || item.product?.seller || 'VoiceCart Partner';
          const qty = item.quantity || 1;
          const price = item.price || item.currentPrice || item.product?.price || order.totalAmount;
          const mrp = item.mrp || item.product?.mrp || price;

          return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${title}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Store: <strong>${store}</strong> • Seller: ${seller}</div>
            ${item.variant?.color ? `<div style="font-size: 11px; color: #6366f1;">Variant: ${item.variant.color}</div>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-weight: 600;">${qty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px; text-decoration: line-through;">₹${(mrp * qty).toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">₹${(price * qty).toLocaleString()}</td>
        </tr>
      `;
        })
        .join('')
    : `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">${order.productTitle}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">1</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b;">—</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">₹${finalAmount.toLocaleString()}</td>
        </tr>
      `;

  const dateFormatted = new Date(finalPaidAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const addr = order.deliveryAddress;
  const addrHtml = addr
    ? `<strong>${addr.fullName}</strong><br/>${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br/>${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong><br/>Phone: ${addr.phone}`
    : 'Registered Customer Address';

  const receiptContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>VoiceCart Receipt - ${order.orderId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; color: #0f172a; background: #fff; }
        .receipt-card { max-width: 740px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 14px; padding: 36px; box-shadow: 0 4px 25px rgba(0,0,0,0.06); position: relative; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 18px; margin-bottom: 20px; }
        .brand { font-size: 24px; font-weight: 800; color: #6366f1; display: flex; align-items: center; gap: 8px; }
        .demo-badge { background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #86efac; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 13px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { font-size: 11px; color: #64748b; margin-bottom: 2px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
        .meta-value { font-weight: 700; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
        .total-box { margin-left: auto; max-width: 320px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 2px dashed #cbd5e1; font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 6px; }
        .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5; }
        @media print {
          body { padding: 0; }
          .receipt-card { border: none; box-shadow: none; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div>
            <div class="brand">🎙️ VoiceCart</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 3px;">Live Multi-Store Shopping Assistant • Official Tax Receipt</div>
          </div>
          <div style="text-align: right;">
            <span class="demo-badge">PAID INVOICE</span>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Order: <strong>#${order.orderId}</strong></div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <span class="meta-label">Customer & Delivery Address</span>
            <div style="color: #0f172a; line-height: 1.4; margin-top: 4px;">${addrHtml}</div>
          </div>
          <div>
            <span class="meta-label">Payment Information</span>
            <div style="color: #0f172a; line-height: 1.4; margin-top: 4px;">
              <div>Method: <strong>${finalMethod}</strong></div>
              <div>Transaction Ref: <code style="color: #6366f1; font-weight: 700;">${finalPaymentId}</code></div>
              <div>Status: <strong style="color: #16a34a;">PAID (Verified)</strong></div>
              <div>Date & Time: ${dateFormatted}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">MRP</th>
              <th style="text-align: right;">Final Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 4px;">
            <span>Items Subtotal:</span>
            <span>₹${finalAmount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #10b981; font-weight: 600; margin-bottom: 4px;">
            <span>Delivery Charges:</span>
            <span>FREE</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 4px;">
            <span>Taxes & GST:</span>
            <span>₹0.00 (Included)</span>
          </div>
          <div class="total-row">
            <span>Total Paid:</span>
            <span style="color: #6366f1;">₹${finalAmount.toLocaleString()}.00</span>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; text-align: center; color: #166534; font-size: 12px; font-weight: 600;">
          ✅ Transaction Status: AUTHORIZED & CAPTURED (VoiceCart Pay)
        </div>

        <div class="footer">
          <div>This is a computer generated invoice by VoiceCart Instant Checkout. No physical signature required.</div>
          <div>Payments in this build are simulated; no money is charged. VoiceCart Multi-Store Assistant.</div>
        </div>

        <div class="no-print" style="margin-top: 24px; text-align: center;">
          <button onclick="window.print()" style="background: #6366f1; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(receiptContent);
  printWindow.document.close();
};
