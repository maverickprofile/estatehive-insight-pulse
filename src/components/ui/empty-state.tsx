import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: "sm" | "default" | "lg";
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    className, 
    icon: Icon, 
    title, 
    description, 
    action, 
    secondaryAction,
    size = "default",
    ...props 
  }, ref) => {
    const sizeConfig = {
      sm: {
        container: "py-8 px-4",
        icon: "w-12 h-12",
        title: "text-base",
        description: "text-sm",
        minHeight: "200px",
      },
      default: {
        container: "py-12 px-6", 
        icon: "w-16 h-16",
        title: "text-lg",
        description: "text-sm",
        minHeight: "300px",
      },
      lg: {
        container: "py-16 px-8",
        icon: "w-20 h-20",
        title: "text-xl",
        description: "text-base",
        minHeight: "400px",
      },
    };

    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn(
          "empty-state",
          config.container,
          className
        )}
        style={{ minHeight: config.minHeight }}
        {...props}
      >
        {Icon && (
          <div className="empty-state-icon-wrapper mb-4">
            <Icon 
              className={cn(
                "empty-state-icon text-muted-foreground/60",
                config.icon
              )}
              strokeWidth={1.5}
            />
          </div>
        )}
        
        <h3 className={cn(
          "empty-state-title font-semibold text-foreground",
          config.title
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            "empty-state-description text-muted-foreground mt-2 max-w-md mx-auto",
            config.description
          )}>
            {description}
          </p>
        )}
        
        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || "default"}
                size={size === "sm" ? "sm" : "default"}
                className="min-w-[120px]"
              >
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="ghost"
                size={size === "sm" ? "sm" : "default"}
                className="min-w-[120px]"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };