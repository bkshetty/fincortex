import nodemailer from 'nodemailer';

async function getTransporter() {
  // 1. Check for Brevo (Preferred for real testing)
  const brevoUser = process.env.BREVO_USER;
  const brevoPass = process.env.BREVO_PASS;
  
  if (brevoUser && brevoPass && !brevoUser.includes('your-brevo')) {
    return nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: brevoUser,
        pass: brevoPass,
      },
    });
  }

  // 2. Fallback to Ethereal (Zero-Config / "Do it by yourself" mode)
  console.log('[Email] No SMTP credentials found. Creating a temporary Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

interface ReminderEmailParams {
  to: string;
  frequency: string;
  nextDeadline: string;
}

export async function sendTaxReminderEmail({ to, frequency, nextDeadline }: ReminderEmailParams) {
  const transporter = await getTransporter();
  const subject = `🔔 Tax Return Reminder — ${frequency === 'quarterly' ? 'Quarterly' : 'Monthly'} Filing Due`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px;background:#f4f5f7;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <h1 style="color:#0A0F2C;margin:0 0:10px;">compliance.ai</h1>
    <p style="color:#666;font-size:14px;margin-bottom:30px;">Automated Tax Compliance System</p>
    <div style="background:#f0fdf4;padding:20px;border-radius:12px;margin-bottom:24px;border-left:4px solid #10b981;">
      <p style="margin:0;color:#065f46;font-weight:bold;">Next Filing Deadline</p>
      <h2 style="margin:5px 0 0;color:#065f46;font-size:28px;">${nextDeadline}</h2>
    </div>
    <p style="line-height:1.6;color:#333;">
      This is a automated reminder for your <strong>${frequency}</strong> tax filing period. 
      Please ensure all invoices are uploaded and reviewed for tax savings.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
       style="display:inline-block;margin-top:20px;padding:14px 28px;background:#0A0F2C;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
      Open Dashboard →
    </a>
  </div>
</body>
</html>
  `;

  console.log(`[Email] Attempting send to: ${to}`);
  
  const info = await transporter.sendMail({
    from: '"compliance.ai" <notifications@compliance.ai>',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] Preview URL: ${previewUrl}`);
  }

  console.log(`[Email] Success! Message ID: ${info.messageId}`);
  return info;
}
