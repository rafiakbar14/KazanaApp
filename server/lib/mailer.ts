let nodemailer: any;
try {
  nodemailer = (await import("nodemailer")).default;
} catch (e) {
  console.warn("[MAILER] Nodemailer tidak ditemukan, menggunakan mode mock penuh.");
}

// Konfigurasi mailer (bisa menggunakan Mailtrap untuk testing atau Gmail SMTP)
// Gunakan variabel lingkungan (.env) untuk kredensial asli
const transporter = nodemailer ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525"),
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
}) : null;


export async function sendOtpEmail(to: string, code: string) {
  const mailOptions = {
    from: '"Kazana ERP" <no-reply@kazana.com>',
    to,
    subject: `Kode Verifikasi Kazana ERP: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0044CC; text-align: center;">Verifikasi Akun Kazana</h2>
        <p>Halo,</p>
        <p>Terima kasih telah mendaftar di <strong>Kazana ERP</strong>. Masukkan kode verifikasi berikut untuk mengaktifkan akun Anda:</p>
        <div style="background: #f4f7ff; padding: 20px; text-align: center; border-radius: 10px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0044CC;">${code}</span>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Kode ini akan kedaluwarsa dalam 10 menit. Jika Anda tidak merasa melakukan pendaftaran, abaikan email ini.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; color: #999; font-size: 10px;">&copy; 2026 Kazana AI Engine. System and Managed by Kazana Team.</p>
      </div>
    `,
  };

  // Jika kredensial tidak ada, log ke console untuk testing
  if (!process.env.SMTP_USER) {
    console.log("------------------------------------------");
    console.log(`[MAILER MOCK] Mengirim OTP ke: ${to}`);
    console.log(`[MAILER MOCK] Kode: ${code}`);
    console.log("------------------------------------------");
    return true;
  }

  try {
    if (transporter) {
      await transporter.sendMail(mailOptions);
    } else {
      console.warn("[MAILER] Transporter tidak tersedia, email tidak terkirim via SMTP.");
    }
    return true;
  } catch (error) {

    console.error("[MAILER ERROR] Gagal mengirim email:", error);
    return false;
  }
}
