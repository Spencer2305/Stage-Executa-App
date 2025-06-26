"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    width?: number;
    height?: number;
    transform?: string;
    opacity: number;
  }>({ opacity: 0 });
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateIndicator = () => {
      if (!listRef.current) return;
      
      const activeTab = listRef.current.querySelector('[data-state="active"]') as HTMLElement;
      if (!activeTab) return;

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        const container = listRef.current;
        if (!container) return;

        // Get exact positions using offsetLeft for pixel-perfect alignment
        // Padding is handled by CSS positioning (top-[3px] left-[3px])
        setIndicatorStyle({
          width: activeTab.offsetWidth,
          height: activeTab.offsetHeight,
          transform: `translateX(${activeTab.offsetLeft - 3}px)`,
          opacity: 1,
        });
      });
    };

    // Initial setup - show indicator immediately on first render
    if (!hasInitialized) {
      updateIndicator();
      setHasInitialized(true);
      return;
    }

    updateIndicator();
    
    const observer = new MutationObserver((mutations) => {
      const hasStateChange = mutations.some(mutation => 
        mutation.type === 'attributes' && 
        mutation.attributeName === 'data-state'
      );
      
      if (hasStateChange) {
        updateIndicator();
      }
    });
    
    if (listRef.current) {
      observer.observe(listRef.current, { 
        attributes: true, 
        subtree: true,
        attributeFilter: ['data-state']
      });
    }

    return () => observer.disconnect();
  }, [hasInitialized]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] gap-1",
        className
      )}
      {...props}
    >
      {/* Sliding indicator - only visible after initialization */}
      <div
        className="absolute top-[1px] left-[3px] bg-primary rounded-md transition-transform duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] pointer-events-none"
        style={indicatorStyle}
      />
      {props.children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "hover:bg-gray-200/60 hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative z-10",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
