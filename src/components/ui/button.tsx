import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        xs: "h-7 px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Apply consistent styling based on design tokens
    const buttonStyles = cn(
      buttonVariants({ variant, size, className }),
      {
        'cursor-not-allowed': disabled || loading,
        'relative': loading,
      }
    )

    // Use design token heights for consistent sizing
    const sizeStyles = {
      xs: { minHeight: '28px' },
      sm: { minHeight: 'var(--button-height-sm)' },
      default: { minHeight: 'var(--button-height-md)' },
      lg: { minHeight: 'var(--button-height-lg)' },
      icon: { minHeight: 'var(--button-height-md)', minWidth: 'var(--button-height-md)' },
    }

    const appliedSizeStyle = size ? sizeStyles[size] : sizeStyles.default

    return (
      <Comp
        className={buttonStyles}
        style={{
          ...appliedSizeStyle,
          borderRadius: size === 'icon' ? 'var(--radius-sm)' : 'var(--radius-md)',
          transition: 'all var(--transition-fast)',
        }}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <>
            <Loader2 
              className="animate-spin" 
              style={{ width: '16px', height: '16px' }}
            />
            {loadingText && <span className="ml-1">{loadingText}</span>}
          </>
        )}
        {!loading && children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
