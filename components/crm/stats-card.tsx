"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"


interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "primary" | "success" | "warning" | "destructive"
  onClick?: () => void
}

export function StatsCard({ title, value, icon: Icon, trend, variant = "default", onClick }: StatsCardProps) {
  const variants = {
    default: "bg-card hover:bg-accent/50",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    success: "bg-success text-success-foreground hover:bg-success/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  }

  const iconVariants = {
    default: "bg-secondary text-foreground",
    primary: "bg-primary-foreground/20 text-primary-foreground",
    success: "bg-success-foreground/20 text-success-foreground",
    warning: "bg-warning-foreground/20 text-warning-foreground",
    destructive: "bg-destructive-foreground/20 text-destructive-foreground"
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 border-0 shadow-sm",
        variants[variant],
        onClick && "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "opacity-90"
            )}>
              {title}
            </p>
            <p className="text-2xl md:text-3xl font-bold">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last week
              </p>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconVariants[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
