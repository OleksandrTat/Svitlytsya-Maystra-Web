import { env } from "@/lib/env";
import { sanitizeCommentContent } from "@/lib/security/sanitize";

export type EmailLang = "uk" | "en";

type EmailMessage = {
  subject: string;
  html: string;
};

type InfoRow = {
  label: string;
  value: string;
};

const BRAND = {
  name: "Svitlytsya Maystra",
  url: env.siteUrl ?? "https://svitlytsya.ua",
  primary: "#190000",
  accent: "#b5860d",
  logo: `${env.siteUrl ?? "https://svitlytsya.ua"}/logo.png`,
};

function sanitizeText(value: string) {
  return sanitizeCommentContent(value).trim();
}

function sanitizeInlineText(value: string) {
  return sanitizeText(value).replace(/\s+/g, " ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatRichText(value: string) {
  return escapeHtml(sanitizeText(value)).replace(/\r?\n/g, "<br />");
}

function formatOptionalText(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const sanitized = sanitizeInlineText(value);
  return sanitized || fallback;
}

function truncateText(value: string, maxLength: number) {
  const sanitized = sanitizeInlineText(value);

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxLength)}…`;
}

function stringifyConfiguration(configuration: Record<string, unknown> | null) {
  if (!configuration) {
    return "";
  }

  try {
    return escapeHtml(JSON.stringify(configuration, null, 2));
  } catch {
    return "";
  }
}

function layout(content: string, lang: EmailLang = "uk") {
  const unsubscribeText =
    lang === "en"
      ? "You received this email because you have an account or submitted a request on our website."
      : "Ви отримали цей лист, бо маєте акаунт або надіслали заявку на нашому сайті.";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(BRAND.name)}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8f3f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f3f3;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
          <tr>
            <td style="background-color:${BRAND.primary};border-radius:16px 16px 0 0;padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="${escapeHtml(BRAND.logo)}" alt="${escapeHtml(BRAND.name)}" width="140" style="display:block;max-width:140px;height:auto;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="color:#f0d0d0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(BRAND.name)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(90deg,${BRAND.primary},${BRAND.accent});height:3px;"></td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 32px;border-radius:0;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafaf9;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e8e0e0;">
              <p style="margin:0;font-size:12px;color:#9a8a8a;line-height:1.6;">
                ${escapeHtml(unsubscribeText)}<br/>
                <a href="${escapeHtml(BRAND.url)}" style="color:${BRAND.accent};text-decoration:none;">${escapeHtml(BRAND.url)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#190000;line-height:1.3;">${escapeHtml(text)}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2d2d2d;">${escapeHtml(text)}</p>`;
}

function paragraphHtml(html: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2d2d2d;">${html}</p>`;
}

function infoBlock(rows: InfoRow[]) {
  const items = rows
    .map(
      ({ label, value }) =>
        `<tr>
          <td style="padding:8px 0;font-size:13px;color:#9a8a8a;white-space:nowrap;padding-right:16px;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;font-size:14px;color:#1a1a1a;font-weight:500;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" style="width:100%;background-color:#f8f3f3;border-radius:12px;padding:16px 20px;margin:24px 0;border-left:3px solid #b5860d;">
    <tbody>${items}</tbody>
  </table>`;
}

function button(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:8px;background-color:#190000;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.04em;border-radius:8px;">${escapeHtml(text)}</a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #ede5e5;margin:28px 0;" />`;
}

function quote(text: string) {
  return `<blockquote style="margin:0 0 24px;padding:12px 16px;background:#f8f3f3;border-left:3px solid #b5860d;border-radius:4px;font-size:14px;color:#2d2d2d;line-height:1.7;">${formatRichText(text)}</blockquote>`;
}

export function adminNewInquiryEmail(params: {
  name: string;
  phone: string | null;
  email: string | null;
  serviceType: string;
  message: string | null;
  sourcePage: string | null;
  configuration: Record<string, unknown> | null;
  adminUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const serviceType = sanitizeInlineText(params.serviceType);
  const name = sanitizeInlineText(params.name);
  const message = params.message ? sanitizeText(params.message) : null;
  const configuration = stringifyConfiguration(params.configuration);

  const labels =
    lang === "en"
      ? {
          subject: `New inquiry: ${serviceType}`,
          title: "New inquiry from the website",
          from: "From",
          phone: "Phone",
          email: "Email",
          service: "Service type",
          page: "Source page",
          message: "Message",
          config: "Configuration",
          cta: "Open in Admin Panel",
          notProvided: "not provided",
        }
      : {
          subject: `Нова заявка: ${serviceType}`,
          title: "Нова заявка з сайту",
          from: "Від",
          phone: "Телефон",
          email: "Email",
          service: "Тип послуги",
          page: "Сторінка",
          message: "Повідомлення",
          config: "Конфігурація",
          cta: "Відкрити в адмін-панелі",
          notProvided: "не вказано",
        };

  const rows: InfoRow[] = [
    { label: labels.from, value: name },
    { label: labels.phone, value: formatOptionalText(params.phone, labels.notProvided) },
    { label: labels.email, value: formatOptionalText(params.email, labels.notProvided) },
    { label: labels.service, value: serviceType },
    { label: labels.page, value: formatOptionalText(params.sourcePage, labels.notProvided) },
  ];

  const content = [
    heading(labels.title),
    paragraphHtml(`${escapeHtml(labels.from)}: <strong>${escapeHtml(name)}</strong>`),
    infoBlock(rows),
    message ? paragraphHtml(`<strong>${escapeHtml(labels.message)}:</strong>`) : "",
    message ? quote(message) : "",
    configuration ? paragraphHtml(`<strong>${escapeHtml(labels.config)}:</strong>`) : "",
    configuration
      ? `<pre style="background:#f8f3f3;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;color:#1a1a1a;margin:0 0 20px;">${configuration}</pre>`
      : "",
    button(labels.cta, params.adminUrl),
  ].join("");

  return { subject: labels.subject, html: layout(content, lang) };
}

export function clientInquiryConfirmationEmail(params: {
  name: string;
  serviceType: string;
  message: string | null;
  siteUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const name = sanitizeInlineText(params.name);
  const serviceType = sanitizeInlineText(params.serviceType);
  const message = params.message ? sanitizeText(params.message) : null;

  const t =
    lang === "en"
      ? {
          subject: "We received your request — Svitlytsya Maystra",
          greeting: `Hello, ${name}!`,
          intro: "We have received your request and will get back to you as soon as possible during business hours.",
          service: "Service",
          message: "Message",
          closing: "We look forward to working with you.",
          cta: "View Products",
          workingHours: "Working hours: Mon-Fri 9:00-18:00",
        }
      : {
          subject: "Ми отримали вашу заявку — Svitlytsya Maystra",
          greeting: `Вітаємо, ${name}!`,
          intro: "Ми отримали вашу заявку та зв'яжемось з вами найближчим часом у робочий час.",
          service: "Послуга",
          message: "Повідомлення",
          closing: "Дякуємо, що обрали нашу майстерню.",
          cta: "Переглянути продукти",
          workingHours: "Робочий час: Пн-Пт 9:00-18:00",
        };

  const rows: InfoRow[] = [{ label: t.service, value: serviceType }];

  if (message) {
    rows.push({ label: t.message, value: truncateText(message, 120) });
  }

  const content = [
    heading(t.greeting),
    paragraph(t.intro),
    infoBlock(rows),
    paragraph(t.closing),
    paragraphHtml(`<em style="color:#9a8a8a;font-size:13px;">${escapeHtml(t.workingHours)}</em>`),
    button(t.cta, `${params.siteUrl}/products`),
  ].join("");

  return { subject: t.subject, html: layout(content, lang) };
}

export function clientInvitationEmail(params: {
  displayName: string | null;
  email: string;
  inviteUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const name = params.displayName
    ? sanitizeInlineText(params.displayName)
    : sanitizeInlineText(params.email.split("@")[0] ?? params.email);

  const t =
    lang === "en"
      ? {
          subject: "You're invited to your personal cabinet — Svitlytsya Maystra",
          greeting: `Hello${params.displayName ? `, ${name}` : ""}!`,
          intro: "You have been invited to your personal cabinet at Svitlytsya Maystra workshop.",
          b1: "Track the status of your order in real time",
          b2: "Open your order details in the cabinet",
          b3: "Communicate directly with the workshop",
          expiry: "The invitation link is valid for 7 days.",
          cta: "Create Account",
          ignore: "If you were not expecting this email, please ignore it.",
        }
      : {
          subject: "Запрошення до особистого кабінету — Svitlytsya Maystra",
          greeting: `Вітаємо${params.displayName ? `, ${name}` : ""}!`,
          intro: "Вас запрошено до особистого кабінету майстерні Svitlytsya Maystra.",
          b1: "Відстежувати статус замовлення в реальному часі",
          b2: "Переглядати та оплачувати рахунки",
          b3: "Спілкуватись безпосередньо з майстернею",
          expiry: "Посилання дійсне протягом 7 днів.",
          cta: "Створити акаунт",
          ignore: "Якщо ви не очікували цього листа — просто проігноруйте його.",
        };

  const content = [
    heading(t.greeting),
    paragraph(t.intro),
    `<ul style="margin:16px 0 24px;padding-left:20px;font-size:14px;line-height:2;color:#2d2d2d;">
      <li>${escapeHtml(t.b1)}</li>
      <li>${escapeHtml(t.b2)}</li>
      <li>${escapeHtml(t.b3)}</li>
    </ul>`,
    button(t.cta, params.inviteUrl),
    divider(),
    paragraphHtml(`<em style="font-size:13px;color:#9a8a8a;">${escapeHtml(`${t.expiry} ${t.ignore}`)}</em>`),
  ].join("");

  return {
    subject: t.subject,
    html: layout(content, lang),
  };
}

export function orderStatusChangedEmail(params: {
  displayName: string | null;
  orderNumber: string;
  newStatus: string;
  comment: string | null;
  orderUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const name = params.displayName ? sanitizeInlineText(params.displayName) : "";
  const orderNumber = sanitizeInlineText(params.orderNumber);
  const newStatus = sanitizeInlineText(params.newStatus);
  const comment = params.comment ? sanitizeText(params.comment) : null;

  const t =
    lang === "en"
      ? {
          subject: `Order ${orderNumber} — status updated`,
          greeting: `Hello${name ? `, ${name}` : ""}!`,
          intro: `The status of your order <strong>${escapeHtml(orderNumber)}</strong> has been updated.`,
          newStatus: "New status",
          comment: "Comment",
          cta: "View Order",
        }
      : {
          subject: `Замовлення ${orderNumber} — статус оновлено`,
          greeting: `Вітаємо${name ? `, ${name}` : ""}!`,
          intro: `Статус вашого замовлення <strong>${escapeHtml(orderNumber)}</strong> було оновлено.`,
          newStatus: "Новий статус",
          comment: "Коментар",
          cta: "Переглянути замовлення",
        };

  const rows: InfoRow[] = [{ label: t.newStatus, value: newStatus }];

  if (comment) {
    rows.push({ label: t.comment, value: truncateText(comment, 200) });
  }

  const content = [
    heading(t.greeting),
    paragraphHtml(t.intro),
    infoBlock(rows),
    button(t.cta, params.orderUrl),
  ].join("");

  return { subject: t.subject, html: layout(content, lang) };
}

export function adminNewSupportMessageEmail(params: {
  clientEmail: string;
  subject: string | null;
  content: string;
  chatUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const subjectText = params.subject ? sanitizeInlineText(params.subject) : null;
  const contentText = sanitizeText(params.content);

  const t =
    lang === "en"
      ? {
          subject: `New support request: ${subjectText ?? truncateText(contentText, 40)}`,
          title: "New support request",
          client: "Client",
          topic: "Topic",
          message: "Message",
          cta: "Open Chat",
          noTopic: "no topic",
        }
      : {
          subject: `Нове звернення від клієнта: ${subjectText ?? truncateText(contentText, 40)}`,
          title: "Нове звернення від клієнта",
          client: "Клієнт",
          topic: "Тема",
          message: "Повідомлення",
          cta: "Відкрити чат",
          noTopic: "без теми",
        };

  const rows: InfoRow[] = [
    { label: t.client, value: sanitizeInlineText(params.clientEmail) },
    { label: t.topic, value: subjectText ?? t.noTopic },
  ];

  const content = [
    heading(t.title),
    infoBlock(rows),
    paragraphHtml(`<strong>${escapeHtml(t.message)}:</strong>`),
    quote(truncateText(contentText, 500)),
    button(t.cta, params.chatUrl),
  ].join("");

  return { subject: t.subject, html: layout(content, lang) };
}

export function adminSupportReplyEmail(params: {
  displayName: string | null;
  content: string;
  chatUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const name = params.displayName ? sanitizeInlineText(params.displayName) : null;
  const contentText = sanitizeText(params.content);

  const t =
    lang === "en"
      ? {
          subject: "New reply from Svitlytsya Maystra",
          greeting: `Hello${name ? `, ${name}` : ""}!`,
          intro: "You have received a new reply to your support request.",
          cta: "View Reply",
        }
      : {
          subject: "Нова відповідь від Svitlytsya Maystra",
          greeting: `Вітаємо${name ? `, ${name}` : ""}!`,
          intro: "Ви отримали нову відповідь у вашому зверненні до майстерні.",
          cta: "Переглянути відповідь",
        };

  const content = [
    heading(t.greeting),
    paragraph(t.intro),
    quote(truncateText(contentText, 500)),
    button(t.cta, params.chatUrl),
  ].join("");

  return { subject: t.subject, html: layout(content, lang) };
}

export function adminOrderMessageEmail(params: {
  displayName: string | null;
  orderNumber: string;
  content: string;
  orderUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const name = params.displayName ? sanitizeInlineText(params.displayName) : "";
  const orderNumber = sanitizeInlineText(params.orderNumber);
  const contentText = sanitizeText(params.content);

  const t =
    lang === "en"
      ? {
          subject: `New message on order ${orderNumber}`,
          greeting: `Hello${name ? `, ${name}` : ""}!`,
          intro: `You have a new message regarding order <strong>${escapeHtml(orderNumber)}</strong>.`,
          cta: "View Message",
        }
      : {
          subject: `Нове повідомлення до замовлення ${orderNumber}`,
          greeting: `Вітаємо${name ? `, ${name}` : ""}!`,
          intro: `Ви отримали нове повідомлення стосовно замовлення <strong>${escapeHtml(orderNumber)}</strong>.`,
          cta: "Переглянути повідомлення",
        };

  const content = [
    heading(t.greeting),
    paragraphHtml(t.intro),
    quote(truncateText(contentText, 500)),
    button(t.cta, params.orderUrl),
  ].join("");

  return { subject: t.subject, html: layout(content, lang) };
}

export function adminNewCommentEmail(params: {
  authorEmail: string;
  content: string;
  moderationUrl: string;
  lang?: EmailLang;
}): EmailMessage {
  const lang = params.lang ?? "uk";
  const contentText = sanitizeText(params.content);

  const t =
    lang === "en"
      ? {
          subject: "New comment awaiting moderation",
          title: "New comment requires moderation",
          author: "Author",
          cta: "Go to Moderation",
        }
      : {
          subject: "Новий коментар потребує модерації",
          title: "Новий коментар потребує модерації",
          author: "Автор",
          cta: "Перейти до модерації",
        };

  const content = [
    heading(t.title),
    infoBlock([{ label: t.author, value: sanitizeInlineText(params.authorEmail) }]),
    quote(truncateText(contentText, 400)),
    button(t.cta, params.moderationUrl),
  ].join("");

  return { subject: t.subject, html: layout(content, lang) };
}
