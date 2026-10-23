import HeroSection from "@/components/sections/hero-section"
import AboutSection from "@/components/sections/about-section"
import ProjectsSection from "@/components/sections/projects-section"
import SkillsSection from "@/components/sections/skills-section"
import BlogSection from "@/components/sections/blog-section"
import ContactSection from "@/components/sections/contact-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <SkillsSection />
      <ContactSection />
    </main>
  )
}
