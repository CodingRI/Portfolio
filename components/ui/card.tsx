import * as React from "react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `
      group relative overflow-hidden rounded-3xl
      border border-white/10
      bg-[linear-gradient(180deg,rgba(15,23,42,0.85)_0%,rgba(2,6,23,0.95)_100%)]
      backdrop-blur-2xl

      shadow-[0_0_40px_rgba(59,130,246,0.08)]
      transition-all duration-500 ease-out

      hover:border-cyan-400/20
      hover:shadow-[0_0_60px_rgba(34,211,238,0.18)]
      hover:-translate-y-[4px]
      `,
      className
    )}
    {...props}
  >
    {/* Ambient glow on hover */}
    <div
      className="
      pointer-events-none absolute inset-0 opacity-0
      transition-opacity duration-500
      group-hover:opacity-100
      bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_55%)]
      z-0
      "
    />

    {/* Top edge shimmer */}
    <div
      className="
      absolute inset-x-0 top-0 h-px
      bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent
      z-0
      "
    />

    {/* Actual card children — must be z-10 so they sit above decorative layers */}
    <div className="relative z-10 h-full">
      {children}
    </div>
  </div>
))
Card.displayName = "Card"

// ─────────────────────────────────────────────────────────────
// CARD HEADER
// ─────────────────────────────────────────────────────────────

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `
      relative flex flex-col space-y-2
      p-6
      `,
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// ─────────────────────────────────────────────────────────────
// CARD TITLE
// ─────────────────────────────────────────────────────────────

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      `
      text-xl md:text-2xl
      font-semibold tracking-tight

      text-white/95

      bg-gradient-to-r
      from-white
      via-cyan-100
      to-cyan-300

      bg-clip-text text-transparent

      drop-shadow-[0_0_18px_rgba(34,211,238,0.15)]
      `,
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// ─────────────────────────────────────────────────────────────
// CARD DESCRIPTION
// ─────────────────────────────────────────────────────────────

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      `
      text-sm leading-relaxed
      text-white/55
      tracking-wide
      `,
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// ─────────────────────────────────────────────────────────────
// CARD CONTENT
// ─────────────────────────────────────────────────────────────

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `
      relative p-6 pt-0
      text-white/80
      `,
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

// ─────────────────────────────────────────────────────────────
// CARD FOOTER
// ─────────────────────────────────────────────────────────────

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `
      relative flex items-center gap-3
      p-6 pt-0
      `,
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}