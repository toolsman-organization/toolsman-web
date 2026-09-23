/**
 * Brevo (formerly Sendinblue) Transactional Email Service for TOOLSMAN.
 * SERVER SIDE ONLY — Never expose BREVO_API_KEY to the browser/client.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
  replyTo?: EmailRecipient;
}

export interface OrderItemData {
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export interface OrderEmailData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  shipping_address: {
    full_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  } | string | null;
  subtotal?: number;
  discount_amount?: number;
  shipping_amount?: number;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  razorpay_payment_id?: string | null;
  created_at?: string;
  order_items?: OrderItemData[];
}

/**
 * Safely validate whether an email string is provided, non-empty, and valid.
 * Never throws.
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Resolve base site URL for links in email templates.
 */
export function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}

function formatInr(amount: number | undefined | null): string {
  const num = typeof amount === 'number' ? amount : 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatAddress(address: OrderEmailData['shipping_address']): string {
  if (!address) return 'Address not provided';
  if (typeof address === 'string') return address;
  const parts = [
    address.full_name,
    address.address_line_1,
    address.address_line_2,
    address.landmark ? `Near ${address.landmark}` : '',
    address.city,
    address.district,
    address.state ? `${address.state} - ${address.pincode || ''}` : address.pincode,
    address.phone ? `Phone: ${address.phone}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Send a transactional email via Brevo REST API.
 * Returns true on success, false on failure. Never throws to avoid breaking calling flows.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY is not configured — skipping email dispatch.');
    return false;
  }

  const senderEmail = (process.env.BREVO_SENDER_EMAIL || 'orders@toolsman.in').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || 'TOOLSMAN').trim();

  try {
    const cleanTo = params.to
      .filter((r) => r && typeof r.email === 'string' && r.email.trim().length > 0)
      .map((r) => ({
        email: r.email.trim(),
        name: (r.name || r.email.split('@')[0] || 'Customer').trim(),
      }));

    if (cleanTo.length === 0) {
      console.warn('[Brevo] No valid recipient emails found — skipping send.');
      return false;
    }

    const payload: Record<string, unknown> = {
      sender: { email: senderEmail, name: senderName },
      to: cleanTo,
      subject: params.subject,
      replyTo: params.replyTo,
    };

    if (params.templateId) {
      payload.templateId = params.templateId;
      payload.params = params.params ?? {};
    } else {
      payload.htmlContent = params.htmlContent;
      if (params.textContent) payload.textContent = params.textContent;
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
      const errorText = await response.text();
      console.error('[Brevo] Email API response error:', response.status, errorText);
      return false;
    }

    console.log(`[Brevo] Email successfully sent: "${params.subject}" to ${cleanTo.map((t) => t.email).join(', ')}`);
    return true;
  } catch (err) {
    console.error('[Brevo] Email network/send exception:', err);
    return false;
  }
}

/* ==========================================================================
   1. CUSTOMER ORDER CONFIRMATION EMAIL
   ========================================================================== */

/**
 * Send Customer Order Confirmation Email.
 * Safe: If customer email is invalid or missing, silently skips without throwing.
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<boolean> {
  const rawEmail =
    order.customer_email ||
    (typeof order.shipping_address === 'object' && order.shipping_address
      ? ((order.shipping_address as Record<string, unknown>).email as string)
      : null);

  const customerEmail = typeof rawEmail === 'string' ? rawEmail.trim() : null;

  if (!isValidEmail(customerEmail)) {
    console.log(`[Brevo] Order #${order.order_number} has no valid customer email ("${order.customer_email}") — skipping customer confirmation.`);
    return false;
  }

  const siteUrl = getSiteBaseUrl();
  const trackOrderUrl = `${siteUrl}/track-order?order=${encodeURIComponent(order.order_number)}`;
  const templateIdStr = process.env.BREVO_ORDER_CONFIRMED_TEMPLATE_ID || process.env.BREVO_ORDER_CONFIRMATION_TEMPLATE_ID;
  const templateId = templateIdStr ? parseInt(templateIdStr, 10) : undefined;

  const items = order.order_items || [];
  const formattedAddress = formatAddress(order.shipping_address);
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Option A: Brevo Managed Template
  if (templateId && !isNaN(templateId)) {
    return sendEmail({
      to: [{ email: customerEmail!, name: order.customer_name }],
      subject: `Order Confirmed — TOOLSMAN #${order.order_number}`,
      templateId,
      params: {
        customer_name: order.customer_name,
        order_number: order.order_number,
        order_date: orderDate,
        order_total: formatInr(order.total_amount),
        subtotal: formatInr(order.subtotal ?? order.total_amount),
        shipping_amount: formatInr(order.shipping_amount ?? 0),
        discount_amount: formatInr(order.discount_amount ?? 0),
        payment_method: order.payment_method || 'Razorpay',
        razorpay_payment_id: order.razorpay_payment_id || 'Paid Online',
        shipping_address: formattedAddress,
        track_order_url: trackOrderUrl,
        items: items.map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: formatInr(i.unit_price),
          total: formatInr(i.total_price ?? i.unit_price * i.quantity),
        })),
      },
    });
  }

  // Option B: TOOLSMAN Branded Responsive HTML Template
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #222222; font-weight: bold;">
          ${item.product_name}
          ${item.product_code ? `<br/><span style="font-size: 11px; color: #777777; font-weight: normal;">Code: ${item.product_code}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #555555; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #222222; font-weight: bold; text-align: right;">
          ${formatInr(item.unit_price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed — TOOLSMAN #${order.order_number}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 30px 15px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
              
              <!-- Header Bar -->
              <tr>
                <td style="background-color: #111111; padding: 24px; text-align: center; border-bottom: 3px solid #f97316;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                    TOOLS<span style="color: #f97316;">MAN</span>
                  </h1>
                  <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
                    Industrial Equipment & Power Tools
                  </p>
                </td>
              </tr>

              <!-- Hero Success Message -->
              <tr>
                <td style="padding: 30px 30px 20px 30px; text-align: center;">
                  <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; background-color: #ecfdf5; border-radius: 50%; color: #059669; font-size: 26px; margin-bottom: 12px;">
                    ✓
                  </div>
                  <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px; font-weight: 800;">
                    Thank You for Your Order!
                  </h2>
                  <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                    Hi <strong>${order.customer_name}</strong>, your payment was successful and your order is now confirmed. We are getting your tools ready for shipment.
                  </p>
                </td>
              </tr>

              <!-- Order Info Pill -->
              <tr>
                <td style="padding: 0 30px 20px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; padding: 16px;">
                    <tr>
                      <td style="font-size: 12px; color: #6b7280; padding: 4px 8px;">Order Number:</td>
                      <td style="font-size: 13px; color: #111827; font-weight: 800; padding: 4px 8px; text-align: right;">#${order.order_number}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #6b7280; padding: 4px 8px;">Order Date:</td>
                      <td style="font-size: 12px; color: #111827; font-weight: 600; padding: 4px 8px; text-align: right;">${orderDate}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #6b7280; padding: 4px 8px;">Payment Method:</td>
                      <td style="font-size: 12px; color: #111827; font-weight: 600; padding: 4px 8px; text-align: right;">${order.payment_method ? order.payment_method.toUpperCase() : 'RAZORPAY (ONLINE)'}</td>
                    </tr>
                    ${order.razorpay_payment_id ? `
                    <tr>
                      <td style="font-size: 12px; color: #6b7280; padding: 4px 8px;">Payment ID:</td>
                      <td style="font-size: 11px; color: #4b5563; font-family: monospace; padding: 4px 8px; text-align: right;">${order.razorpay_payment_id}</td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>

              <!-- Order Items Table -->
              <tr>
                <td style="padding: 0 30px 20px 30px;">
                  <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
                    Items Ordered
                  </h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                        <th style="padding: 10px 8px; font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase; text-align: left;">Product</th>
                        <th style="padding: 10px 8px; font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                        <th style="padding: 10px 8px; font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase; text-align: right; width: 90px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Price Breakdown -->
              <tr>
                <td style="padding: 0 30px 25px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                    ${order.subtotal ? `
                    <tr>
                      <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">Subtotal:</td>
                      <td style="padding: 4px 0; font-size: 13px; color: #111827; font-weight: 600; text-align: right;">${formatInr(order.subtotal)}</td>
                    </tr>
                    ` : ''}
                    ${order.discount_amount && order.discount_amount > 0 ? `
                    <tr>
                      <td style="padding: 4px 0; font-size: 13px; color: #16a34a;">Discount:</td>
                      <td style="padding: 4px 0; font-size: 13px; color: #16a34a; font-weight: 600; text-align: right;">- ${formatInr(order.discount_amount)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">Delivery Charge:</td>
                      <td style="padding: 4px 0; font-size: 13px; color: #111827; font-weight: 600; text-align: right;">
                        ${(order.shipping_amount ?? 0) === 0 ? '<span style="color: #16a34a; font-weight: bold;">FREE</span>' : formatInr(order.shipping_amount)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 800; color: #111827; border-top: 2px solid #111827;">Total Paid:</td>
                      <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 900; color: #f97316; text-align: right; border-top: 2px solid #111827;">
                        ${formatInr(order.total_amount)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Shipping Address -->
              <tr>
                <td style="padding: 0 30px 25px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; padding: 16px;">
                    <tr>
                      <td>
                        <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">
                          Shipping Address
                        </h4>
                        <p style="margin: 0; font-size: 13px; color: #1f2937; line-height: 1.5;">
                          ${formattedAddress}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center" style="padding: 10px 30px 35px 30px;">
                  <a href="${trackOrderUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                    Track Your Order
                  </a>
                  <p style="margin: 12px 0 0 0; font-size: 11px; color: #9ca3af;">
                    You can track the live status of your shipment anytime at TOOLSMAN.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                  <p style="margin: 0 0 6px 0; font-weight: 600;">TOOLSMAN Quality & Support</p>
                  <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                    If you have questions about your order, reply to this email or contact our customer support.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: customerEmail!, name: order.customer_name }],
    subject: `Order Confirmed — TOOLSMAN #${order.order_number}`,
    htmlContent,
  });
}

/* ==========================================================================
   2. ADMIN NEW ORDER NOTIFICATION EMAIL
   ========================================================================== */

/**
 * Send Admin New Order Notification.
 * Triggered on successful payment verification.
 * Sent even if customer email is null/empty.
 */
export async function sendAdminNewOrderEmail(order: OrderEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

  if (!adminEmail || !isValidEmail(adminEmail)) {
    console.warn('[Brevo] ADMIN_NOTIFICATION_EMAIL is not configured or invalid — skipping admin notification.');
    return false;
  }

  const siteUrl = getSiteBaseUrl();
  const adminOrderUrl = `${siteUrl}/admin/orders/${order.id}`;
  const templateIdStr = process.env.BREVO_ADMIN_NEW_ORDER_TEMPLATE_ID;
  const templateId = templateIdStr ? parseInt(templateIdStr, 10) : undefined;

  const items = order.order_items || [];
  const formattedAddress = formatAddress(order.shipping_address);
  const customerEmailDisplay = order.customer_email?.trim() || 'Not provided';
  const customerPhoneDisplay = order.customer_phone?.trim() || 'Not provided';
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  // Option A: Brevo Managed Template
  if (templateId && !isNaN(templateId)) {
    return sendEmail({
      to: [{ email: adminEmail, name: 'TOOLSMAN Admin' }],
      subject: `New Paid Order Received — #${order.order_number}`,
      templateId,
      params: {
        order_number: order.order_number,
        order_date: orderDate,
        order_total: formatInr(order.total_amount),
        customer_name: order.customer_name,
        customer_phone: customerPhoneDisplay,
        customer_email: customerEmailDisplay,
        payment_method: order.payment_method || 'Razorpay',
        razorpay_payment_id: order.razorpay_payment_id || 'Online Payment',
        shipping_address: formattedAddress,
        admin_order_url: adminOrderUrl,
        items: items.map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: formatInr(i.unit_price),
          total: formatInr(i.total_price ?? i.unit_price * i.quantity),
        })),
      },
    });
  }

  // Option B: TOOLSMAN Admin Alert Responsive HTML Template
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #111827; font-weight: bold;">
          ${item.product_name}
          ${item.product_code ? `<br/><span style="font-size: 11px; color: #6b7280; font-weight: normal;">Code: ${item.product_code}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #374151; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #111827; font-weight: bold; text-align: right;">
          ${formatInr(item.unit_price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Paid Order Received — #${order.order_number}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
              
              <!-- Admin Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 22px 24px; border-bottom: 3px solid #f97316;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 1px;">
                          TOOLS<span style="color: #f97316;">MAN</span> <span style="font-size: 12px; background-color: #f97316; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Admin Alert</span>
                        </h1>
                      </td>
                      <td align="right">
                        <span style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                          PAID
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Overview Banner -->
              <tr>
                <td style="padding: 24px 28px 16px 28px;">
                  <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #111827;">
                    New Paid Order Received (#${order.order_number})
                  </h2>
                  <p style="margin: 0; font-size: 13px; color: #4b5563;">
                    A customer has completed payment via Razorpay. Please review and process the order for dispatch.
                  </p>
                </td>
              </tr>

              <!-- Customer Info -->
              <tr>
                <td style="padding: 0 28px 20px 28px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px;">
                    <tr>
                      <td colspan="2" style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">
                        Customer Details
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0; width: 120px;">Name:</td>
                      <td style="font-size: 13px; color: #0f172a; font-weight: 700; padding: 3px 0;">${order.customer_name}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Phone:</td>
                      <td style="font-size: 13px; color: #0f172a; font-weight: 600; padding: 3px 0;">${customerPhoneDisplay}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Email:</td>
                      <td style="font-size: 13px; color: #0f172a; padding: 3px 0;">${customerEmailDisplay}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Order Date:</td>
                      <td style="font-size: 12px; color: #0f172a; padding: 3px 0;">${orderDate}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Payment ID:</td>
                      <td style="font-size: 11px; color: #0f172a; font-family: monospace; padding: 3px 0;">${order.razorpay_payment_id || 'Razorpay Paid'}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 12px; color: #64748b; padding: 3px 0; vertical-align: top;">Shipping To:</td>
                      <td style="font-size: 12px; color: #0f172a; padding: 3px 0;">${formattedAddress}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 0 28px 20px 28px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
                    Ordered Items (${items.length})
                  </h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                        <th style="padding: 8px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: left;">Product</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; text-align: right; width: 90px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Total Paid -->
              <tr>
                <td style="padding: 0 28px 25px 28px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    <tr>
                      <td style="font-size: 15px; font-weight: 800; color: #0f172a;">Total Order Amount:</td>
                      <td style="font-size: 18px; font-weight: 900; color: #f97316; text-align: right;">${formatInr(order.total_amount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Admin Action Button -->
              <tr>
                <td align="center" style="padding: 0 28px 30px 28px;">
                  <a href="${adminOrderUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 13px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #334155;">
                    View Order in Admin Panel →
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                  TOOLSMAN Automated Admin Notification Service
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: adminEmail, name: 'TOOLSMAN Admin' }],
    subject: `New Paid Order Received — #${order.order_number}`,
    htmlContent,
  });
}

/* ==========================================================================
   3. CUSTOMER ORDER DELIVERED EMAIL
   ========================================================================== */

/**
 * Send Customer Order Delivered Email.
 * Triggered when Admin marks fulfillment status as 'delivered'.
 * Safely skips if customer email is missing/invalid.
 */
export async function sendOrderDeliveredEmail(order: OrderEmailData): Promise<boolean> {
  const rawEmail =
    order.customer_email ||
    (typeof order.shipping_address === 'object' && order.shipping_address
      ? ((order.shipping_address as Record<string, unknown>).email as string)
      : null);

  const customerEmail = typeof rawEmail === 'string' ? rawEmail.trim() : null;

  if (!isValidEmail(customerEmail)) {
    console.log(`[Brevo] Order #${order.order_number} has no valid customer email ("${order.customer_email}") — skipping delivery email.`);
    return false;
  }

  console.log(`[Brevo] Triggering delivery email for Order #${order.order_number} to: ${customerEmail}`);

  const siteUrl = getSiteBaseUrl();
  const trackOrderUrl = `${siteUrl}/track-order?order=${encodeURIComponent(order.order_number)}`;
  const templateIdStr = process.env.BREVO_ORDER_DELIVERED_TEMPLATE_ID;
  const templateId = templateIdStr ? parseInt(templateIdStr, 10) : undefined;

  const items = order.order_items || [];

  // Option A: Brevo Managed Template
  if (templateId && !isNaN(templateId)) {
    return sendEmail({
      to: [{ email: customerEmail!, name: order.customer_name }],
      subject: `Your Order Has Been Delivered — TOOLSMAN #${order.order_number}`,
      templateId,
      params: {
        customer_name: order.customer_name,
        order_number: order.order_number,
        order_total: formatInr(order.total_amount),
        track_order_url: trackOrderUrl,
        items: items.map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: formatInr(i.unit_price),
        })),
      },
    });
  }

  // Option B: TOOLSMAN Delivered Responsive HTML Template
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #1f2937; font-weight: 600;">
          ${item.product_name}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #4b5563; text-align: center;">
          ${item.quantity}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Been Delivered — TOOLSMAN #${order.order_number}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
              
              <!-- Header Bar -->
              <tr>
                <td style="background-color: #111111; padding: 24px; text-align: center; border-bottom: 3px solid #f97316;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                    TOOLS<span style="color: #f97316;">MAN</span>
                  </h1>
                </td>
              </tr>

              <!-- Delivery Celebration -->
              <tr>
                <td style="padding: 30px 30px 20px 30px; text-align: center;">
                  <div style="display: inline-block; width: 54px; height: 54px; line-height: 54px; background-color: #ecfdf5; border-radius: 50%; color: #059669; font-size: 28px; margin-bottom: 12px;">
                    📦
                  </div>
                  <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 22px; font-weight: 800;">
                    Your Order Has Been Delivered!
                  </h2>
                  <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                    Hi <strong>${order.customer_name}</strong>, order <strong>#${order.order_number}</strong> has been successfully delivered to your shipping address.
                  </p>
                </td>
              </tr>

              <!-- Order Items Summary -->
              ${items.length > 0 ? `
              <tr>
                <td style="padding: 0 30px 20px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; padding: 14px;">
                    <tr>
                      <td colspan="2" style="font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase; padding-bottom: 6px;">
                        Package Contents
                      </td>
                    </tr>
                    ${itemsHtml}
                  </table>
                </td>
              </tr>
              ` : ''}

              <!-- Thank You & CTA -->
              <tr>
                <td align="center" style="padding: 10px 30px 35px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 13px; color: #4b5563;">
                    We hope your new tools power your work! Thank you for choosing TOOLSMAN.
                  </p>
                  <a href="${trackOrderUrl}" style="display: inline-block; background-color: #111111; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 13px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    View Order Details
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                  <p style="margin: 0 0 4px 0; font-weight: 600;">TOOLSMAN Customer Support</p>
                  <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                    If you experienced any issues with your delivery, please reach out to us.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: customerEmail!, name: order.customer_name }],
    subject: `Your Order Has Been Delivered — TOOLSMAN #${order.order_number}`,
    htmlContent,
  });
}

/* ==========================================================================
   4. UNIFIED PAID ORDER NOTIFICATIONS (CUSTOMER + ADMIN)
   ========================================================================== */

/**
 * Helper to dispatch both Customer Confirmation and Admin New Order emails
 * upon confirmed payment. Catches all errors internally so it never throws.
 */
export async function sendPaidOrderEmails(order: OrderEmailData): Promise<void> {
  try {
    const rawEmail =
      order.customer_email ||
      (typeof order.shipping_address === 'object' && order.shipping_address
        ? ((order.shipping_address as Record<string, unknown>).email as string)
        : null);

    const customerEmail = typeof rawEmail === 'string' ? rawEmail.trim() : null;

    const promises: Promise<boolean>[] = [];

    // 1. Customer Confirmation (if email exists)
    if (isValidEmail(customerEmail)) {
      console.log(`[Brevo] Triggering customer confirmation email for Order #${order.order_number} to: ${customerEmail}`);
      promises.push(
        sendOrderConfirmationEmail({
          ...order,
          customer_email: customerEmail,
        })
      );
    } else {
      console.log(`[Brevo] Order #${order.order_number} has no customer email — skipping customer confirmation.`);
    }

    // 2. Admin New Order Alert (always sent)
    console.log(`[Brevo] Triggering admin new order alert for Order #${order.order_number}`);
    promises.push(sendAdminNewOrderEmail(order));

    const results = await Promise.allSettled(promises);
    results.forEach((res, index) => {
      if (res.status === 'rejected') {
        console.error(`[Brevo] Email promise ${index} failed:`, res.reason);
      }
    });
  } catch (err) {
    console.error('[Brevo] Error dispatching paid order emails:', err);
  }
}

// Backward compatibility alias
export const sendOrderConfirmation = sendOrderConfirmationEmail;

