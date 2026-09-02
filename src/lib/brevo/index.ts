/**
 * Brevo (formerly Sendinblue) transactional email client.
 * SERVER SIDE ONLY — never expose BREVO_API_KEY to the browser.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
  replyTo?: EmailRecipient;
}

/**
 * Send a transactional email via Brevo.
 * Returns true on success, false on failure (never throws — won't break checkout).
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY not set — skipping email send.');
    return false;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@toolsman.in';
  const senderName = process.env.BREVO_SENDER_NAME ?? 'TOOLSMAN';

  try {
    const payload: Record<string, unknown> = {
      sender: { email: senderEmail, name: senderName },
      to: params.to,
      subject: params.subject,
      replyTo: params.replyTo,
    };

    if (params.templateId) {
      payload.templateId = params.templateId;
      payload.params = params.params ?? {};
    } else {
      payload.htmlContent = params.htmlContent;
      payload.textContent = params.textContent;
    }

    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Brevo] Email send failed:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Brevo] Email send exception:', err);
    return false;
  }
}

/**
 * Send order confirmation email.
 */
export async function sendOrderConfirmation(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderTotal: number;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress: string;
}): Promise<void> {
  const templateIdStr = process.env.BREVO_ORDER_CONFIRMED_TEMPLATE_ID;
  const templateId = templateIdStr ? parseInt(templateIdStr, 10) : undefined;

  if (templateId) {
    await sendEmail({
      to: [{ email: params.customerEmail, name: params.customerName }],
      subject: `Order Confirmed — ${params.orderNumber}`,
      templateId,
      params: {
        customer_name: params.customerName,
        order_number: params.orderNumber,
        order_total: `₹${params.orderTotal.toLocaleString('en-IN')}`,
        order_items: params.orderItems,
        shipping_address: params.shippingAddress,
      },
    });
  } else {
    // Fallback plain HTML email
    const itemsHtml = params.orderItems
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price.toLocaleString('en-IN')}</td></tr>`
      )
      .join('');

    await sendEmail({
      to: [{ email: params.customerEmail, name: params.customerName }],
      subject: `Order Confirmed — ${params.orderNumber} | TOOLSMAN`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #111; padding: 20px; text-align: center;">
            <h1 style="color: #f97316; margin: 0;">TOOLSMAN</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Order Confirmed! 🎉</h2>
            <p>Hi ${params.customerName},</p>
            <p>Your order <strong>${params.orderNumber}</strong> has been confirmed. We'll notify you when it ships.</p>
            <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 20px 0;">
              <thead style="background: #f3f4f6;">
                <tr><th>Product</th><th>Qty</th><th>Price</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p><strong>Total: ₹${params.orderTotal.toLocaleString('en-IN')}</strong></p>
            <p><strong>Shipping to:</strong> ${params.shippingAddress}</p>
            <p>Thank you for shopping with TOOLSMAN!</p>
          </div>
        </div>
      `,
    });
  }
}

/**
 * Send order status update email.
 */
export async function sendOrderStatusUpdate(params: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  newStatus: string;
  note?: string;
}): Promise<void> {
  const statusLabels: Record<string, string> = {
    confirmed:  'Order Confirmed',
    processing: 'Order Being Processed',
    packed:     'Order Packed',
    shipped:    'Order Shipped',
    delivered:  'Order Delivered',
    cancelled:  'Order Cancelled',
  };

  const label = statusLabels[params.newStatus] ?? params.newStatus;

  await sendEmail({
    to: [{ email: params.customerEmail, name: params.customerName }],
    subject: `${label} — ${params.orderNumber} | TOOLSMAN`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #111; padding: 20px; text-align: center;">
          <h1 style="color: #f97316; margin: 0;">TOOLSMAN</h1>
        </div>
        <div style="padding: 30px;">
          <h2>${label}</h2>
          <p>Hi ${params.customerName},</p>
          <p>Your order <strong>${params.orderNumber}</strong> status has been updated to: <strong>${label}</strong></p>
          ${params.note ? `<p>Note: ${params.note}</p>` : ''}
          <p>Track your order by logging into your TOOLSMAN account.</p>
        </div>
      </div>
    `,
  });
}
