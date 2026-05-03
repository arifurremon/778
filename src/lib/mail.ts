import nodemailer from "nodemailer";

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

export const sendWelcomeEmail = async ({ to, name }: SendWelcomeEmailParams) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"The Chattala" <${process.env.SMTP_FROM}>`,
      to,
      subject: "Welcome to The Chattala - Your Hyperlocal Digital Hub",
      html: `
        <div style="background-color: #f9fafb; padding: 40px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); text-align: left;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://res.cloudinary.com/dp5ap39r6/image/upload/v1777768055/LOGOICON_swfpo9.png" alt="The Chattala Logo" style="width: 80px; height: auto;" />
            </div>

            <!-- Body -->
            <div style="font-family: 'Georgia', serif; color: #111827; font-size: 16px; line-height: 1.8;">
              <p>Dear ${name},</p>
              
              <p>Welcome to <strong>The Chattala</strong>.</p>
              
              <p>We are honored to have you join our digital ecosystem. Chittagong has always been a city of profound history, vibrant commerce, and deep-rooted communities. Our platform is designed to mirror that very spirit—serving as a unified, hyperlocal hub for our beloved city.</p>
              
              <p>Whether you are here to connect with your neighbours, discover verified local shops, or offer your professional expertise, The Chattala is built to empower you. We envision a digital landscape where every street and every voice finds its space.</p>
              
              <p>Thank you for embarking on this journey with us. We look forward to building a stronger, more connected community together.</p>
              
              <p style="margin-top: 40px;">
                Sincerely,<br />
                <strong>Team The Chattala</strong>
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;" />

            <!-- Footer -->
            <div style="text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #6b7280; font-size: 12px;">
              <p style="margin-bottom: 10px;">An initiative by Inievo Technologies</p>
              <img src="https://res.cloudinary.com/dp5ap39r6/image/upload/v1777712331/Inievo_v3ow3t.png" alt="Inievo Technologies Logo" style="width: 100px; height: auto; opacity: 0.8;" />
            </div>

          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};
