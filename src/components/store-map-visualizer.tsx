'use client';

import * as React from 'react';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, MapPin, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "../components/ui/tooltip";

type StoreMapVisualizerProps = {
  layout: string[][];
  cartItemLocations: Set<string>;
  optimalPath: string[] | null;
  currentStepIndex: number;
};

const getLocationId = (cellContent: string): string => {
  if (!cellContent) return 'Unknown';
  const match = cellContent.match(/^[A-Z]+\d+/);
  if (match) return match[0];
  if (cellContent === "Entrance" || cellContent === "Checkout") return cellContent;
  return cellContent.split(':')[0]?.trim() || 'Unknown';
};

export function StoreMapVisualizer({
  layout,
  cartItemLocations,
  optimalPath,
  currentStepIndex,
}: StoreMapVisualizerProps) {
  if (!Array.isArray(layout) || layout.length === 0 || !Array.isArray(layout[0])) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg p-4">
        <p className="text-center text-destructive">
          <MapPin className="inline-block mr-2 h-5 w-5" /> Error: Store layout data is missing or invalid.
        </p>
      </div>
    );
  }

  const currentStepLocation = optimalPath ? optimalPath[currentStepIndex] : null;

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col overflow-auto bg-background">
        <div
          className="grid mx-auto"
          style={{
            gridTemplateColumns: `repeat(${layout[0].length}, minmax(60px, 1fr))`,
            gridTemplateRows: `repeat(${layout.length}, minmax(60px, 1fr))`,
            gap: '4px',
            width: '100%',
            maxWidth: '1000px',
          }}
        >
          {layout.flatMap((row, rowIndex) =>
            row.map((cell, cellIndex) => {
              const cellId = getLocationId(cell);
              const cellContent = cell ? cell.split(':')[0] : '';
              const isCartLocation = cartItemLocations.has(cellId);
              const isCurrentStep = cellId === currentStepLocation;
              const isSpecial = cellContent === 'Entrance' || cellContent === 'Checkout';
              const isEmpty = cellContent === 'Empty';
              const tooltipText = cell === cellId ? cellId : `${cellId}: ${cell && cell.includes(':') ? cell.split(':')[1].trim() : 'Area'}`;

              return (
                <Tooltip key={`${rowIndex}-${cellIndex}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center text-center text-xs border border-border/20 bg-card w-full h-full min-w-[60px] min-h-[60px]',
                        isCartLocation && 'border-accent border-dashed',
                        isCurrentStep && 'ring-2 ring-primary ring-offset-1 ring-offset-background bg-primary/10 z-10 shadow-md',
                        isEmpty && 'bg-muted/20 text-muted-foreground/40 cursor-not-allowed',
                        isSpecial && 'font-semibold'
                      )}
                    >
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 mb-1">
                        {cellId}
                      </Badge>
                      {isCurrentStep && !isEmpty && <Navigation className="w-4 h-4 text-primary mb-0.5" />}
                      {isCartLocation && !isCurrentStep && !isEmpty && <ShoppingCart className="w-4 h-4 text-accent/80 mb-0.5" />}
                      <span
                        className={cn(
                          'text-[10px]',
                          isCurrentStep && 'text-primary font-bold',
                          cellContent === 'Entrance' && 'text-green-600',
                          cellContent === 'Checkout' && 'text-blue-600',
                          isEmpty && 'text-muted-foreground/50 italic'
                        )}
                      >
                        {isEmpty ? '(Empty)' : cellContent}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{tooltipText}</p>
                    {isEmpty && <p>(Empty Cell)</p>}
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-2 pb-2 border-t pt-2">
          <div className="flex items-center gap-1.5"><Navigation className="w-3 h-3 text-primary" /> Current Location</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border-2 border-accent border-dashed"></div> Item Location</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border border-green-500/50"></div> Entrance</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border border-blue-500/50"></div> Checkout</div>
        </div>
      </div>
    </TooltipProvider>
  );
}
