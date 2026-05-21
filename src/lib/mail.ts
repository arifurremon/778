import nodemailer from "nodemailer";

function createTransporter() {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

export const sendWelcomeEmail = async ({ to, name }: SendWelcomeEmailParams) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"The Chattala" <${process.env.SMTP_FROM}>`,
      to,
      subject: "Welcome to The Chattala - Your Hyperlocal Digital Hub",
      html: `
        <div style="background-color: #f9fafb; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://res.cloudinary.com/det1qnlrh/image/upload/v1779171235/NEW_af42tm.png" alt="The Chattala Logo" style="width: 140px; height: auto;" />
            </div>
            <div style="font-family: Georgia, serif; color: #111827; font-size: 16px; line-height: 1.8;">
              <p>Dear ${name},</p>
              <p>Welcome to <strong>The Chattala</strong>.</p>
              <p>We are honored to have you join our digital ecosystem. Chittagong has always been a city of profound history, vibrant commerce, and deep-rooted communities.</p>
              <p>Whether you are here to connect with your neighbours, discover verified local shops, or offer your professional expertise, The Chattala is built to empower you.</p>
              <p style="margin-top: 40px;">Sincerely,<br /><strong>Team The Chattala</strong></p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;" />
            <div style="text-align: center; color: #6b7280; font-size: 12px;">
              <p>An initiative by Inievo Technologies</p>
              <img src="https://res.cloudinary.com/dp5ap39r6/image/upload/v1777712331/Inievo_v3ow3t.png" alt="Inievo" style="width: 100px; opacity: 0.8;" />
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"The Chattala" <${process.env.SMTP_FROM}>`,
      to,
      subject: "Reset Your Password - The Chattala",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">Reset Your Password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p style="color: #6b7280; font-size: 14px;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (to: string, verifyLink: string) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"The Chattala" <${process.env.SMTP_FROM}>`,
      to,
      subject: "Verify your email - The Chattala",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">Email Verification</h2>
          <p>Please verify your email address by clicking the link below.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
          <p style="color: #6b7280; font-size: 14px;">If you did not create an account, ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  title: string,
  message: string,
  actionLink?: string,
  actionText?: string
) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"The Chattala" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #111827;">${title}</h2>
          <p>${message}</p>
          ${actionLink && actionText
            ? `<a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">${actionText}</a>`
            : ""}
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
};