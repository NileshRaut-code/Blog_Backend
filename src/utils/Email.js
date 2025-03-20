import nodemailer from "nodemailer"
const Email = async (otp,email) => {
    const toEmail =email ? email : "ganya9970@gmail.com";
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: toEmail,
      subject: "This Is Your OTP TO VALIDATE",
      text: `This is a OTP email sent from the backend. ${otp}`,
    };
    try {
      const info = await transporter.sendMail(mailOptions);
     // console.log("Email sent: " + info.response);
      
    } catch (error) {
      console.error("Error sending email:", error);
     
    }
  };
  

  export default Email