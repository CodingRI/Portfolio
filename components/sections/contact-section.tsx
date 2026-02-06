"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Mail, Phone, MapPin, Send, Mic, MicOff, Github,
  Linkedin,
  Twitter,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendContactEmail } from "@/app/actions/contact"

export default function ContactSection() {
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await sendContactEmail(formData)
      if (res.success) {
        toast({
          title: "Message sent!",
          description: "Thanks for reaching out. I'll get back to you soon!",
        })
        setFormData({ name: "", email: "", message: "" })
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to send message.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <section id="contact" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 liquid-gradient font-sora">Let's Connect</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Ready to bring your ideas to life? Let's discuss how we can create something amazing together.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="glass-morphism border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                  </div>

                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-morphism border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Textarea
                      placeholder="Your Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="glass-morphism border-white/20 text-white placeholder:text-white/50 min-h-32"
                      required
                    />

                  </div>

                  <Button
                    type="submit"
                    className="w-full glass-morphism border border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 hover:animate-glow"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin border-2 border-cyan-400/20 border-t-cyan-400 rounded-full h-5 w-5"></span>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-5 w-5" /> Send Message
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info & AI Assistant */}
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Card
              className="
      relative overflow-hidden
      border-white/10

      bg-[linear-gradient(180deg,rgba(15,23,42,0.78)_0%,rgba(2,6,23,0.92)_100%)]

      shadow-[0_0_60px_rgba(34,211,238,0.08)]

      hover:border-cyan-400/20
    "
            >
              {/* Ambient glow */}
              <div
                className="
        absolute inset-0 opacity-40
        bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_55%)]
        pointer-events-none
      "
              />

              <CardContent className="p-8 relative z-10">
                {/* Header */}
                <div className="mb-8">

                  <p
                    className="
          text-white/65
          leading-relaxed
          text-base
          "
                  >
                    Whether you have a project idea, a collaboration opportunity,
                    or just want to connect and talk about tech, design, or the future
                    of the web — my inbox is always open.
                    <br />
                    <br />
                    I enjoy building meaningful digital experiences and connecting with
                    people who are passionate about creating things that matter.
                  </p>
                </div>
                <h3
                  className="
              text-3xl md:text-4xl
              font-bold
              mb-4
  
              bg-gradient-to-r
              from-white
              via-cyan-100
              to-cyan-300
  
              bg-clip-text
              text-transparent
            "
                >
                  Get In Touch
                </h3>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                  {[
                    {
                      name: "GitHub",
                      href: "https://github.com/CodingRI/",
                      icon: Github,
                      glow: "hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]",
                    },
                    {
                      name: "LinkedIn",
                      href: "https://www.linkedin.com/in/riya-karmakar-7204a4256/",
                      icon: Linkedin,
                      glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]",
                    },
                    {
                      name: "X / Twitter",
                      href: "https://x.com/RI_2507",
                      icon: Twitter,
                      glow: "hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]",
                    },
                    {
                      name: "Email",
                      href: "mailto:karmakarriya462@gmail.com.com",
                      icon: Mail,
                      glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.16)]",
                    },
                  ].map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{
                        scale: 1.03,
                        y: -2,
                      }}
                      whileTap={{ scale: 0.97 }}
                      className={`
              group relative overflow-hidden

              flex items-center gap-3

              rounded-2xl
              border border-white/10

              bg-white/[0.03]
              backdrop-blur-xl

              px-5 py-4

              text-white/80

              transition-all duration-500

              hover:border-cyan-400/20
              hover:bg-cyan-400/[0.04]

              ${social.glow}
            `}
                    >
                      {/* Glow layer */}
                      <div
                        className="
                absolute inset-0 opacity-0
                transition-opacity duration-500
                group-hover:opacity-100

                bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_70%)]
              "
                      />

                      <social.icon
                        className="
                h-5 w-5
                text-cyan-300
                transition-transform duration-500
                group-hover:scale-110
              "
                      />

                      <span className="relative z-10 font-medium tracking-wide">
                        {social.name}
                      </span>
                    </motion.a>
                  ))}
                </div>

                {/* Contact Details */}

              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-20 pt-8 border-t border-white/10 text-center"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/60">© 2026 CodingRI.</div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse" />
              <span className="text-white/40 text-sm">Powered by Next.js & Three.js</span>
            </div>
          </div>
        </motion.footer>
      </div>
    </section>
  )
}


{/* <div
        className="
          rounded-2xl
          border border-white/10

          bg-white/[0.02]

          p-5

          space-y-5
        "
      >
        <div className="flex items-center gap-4">
          <div
            className="
              flex items-center justify-center

              w-11 h-11
              rounded-xl

              bg-cyan-400/10
              border border-cyan-400/10
            "
          >
            <Mail className="h-5 w-5 text-cyan-300" />
          </div>

          <div>
            <p className="text-sm text-white/40 mb-1">
              Email
            </p>

            <p className="text-white/80">
              karmakarriya462@gmail.com
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="
              flex items-center justify-center

              w-11 h-11
              rounded-xl

              bg-purple-400/10
              border border-purple-400/10
            "
          >
            <MapPin className="h-5 w-5 text-purple-300" />
          </div>

          <div>
            <p className="text-sm text-white/40 mb-1">
              Location
            </p>

            <p className="text-white/80">
              Chandigarh, India
            </p>
          </div>
        </div>
      </div> */}
