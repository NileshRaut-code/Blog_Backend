import nodemailer from "nodemailer"
const Email = async (text,email,subject) => {
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
      subject: subject ,
      text: text,
    };
    try {
      const info = await transporter.sendMail(mailOptions);
     // console.log("Email sent: " + info.response);
      
    } catch (error) {
      console.error("Error sending email:", error);
     
    }
  };
  

  export default Email