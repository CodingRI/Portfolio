"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  message: string;
}) {
  try {
    const { name, email, message } = formData;

    if (!name || !email || !message) {
      return { success: false, error: "All fields are required" };
    }

    const data = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>", // Replace this with your verified domain in production
      to: process.env.CONTACT_EMAIL || "karmakarriya462@gmail.com", // Emails will be sent here
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Resend Error:", error);
    return { success: false, error: "Failed to send message" };
  }
}
