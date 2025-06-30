'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { StoreMapVisualizer } from '../components/store-map-visualizer';
import {
  ShoppingCart,
  Clock,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  MapPinned,
  Check
} from 'lucide-react';

type OptimalPathModalProps = {
  isOpen: boolean;
  onClose: () => void;
  optimalPath: string[] | null;
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  layout: string[][];
  cartItemLocations: Set<string>;
};

// Estimate time: 10s per step (adjust as needed)
function calculateETA(remainingSteps: number, secondsPerStep = 10): string {
  const totalSeconds = remainingSteps * secondsPerStep;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function OptimalPathModal({
  isOpen,
  onClose,
  optimalPath,
  currentStepIndex,
  onNextStep,
  onPrevStep,
  layout,
  cartItemLocations
}: OptimalPathModalProps) {
  if (!optimalPath || optimalPath.length === 0) return null;

  const currentLocation = optimalPath[currentStepIndex];
  const nextLocation = optimalPath[currentStepIndex + 1] || null;
  const isLastStep = currentStepIndex === optimalPath.length - 1;
  const isItemHere = cartItemLocations.has(currentLocation);

  const remainingSteps = optimalPath.length - currentStepIndex - 1;
  const eta = calculateETA(remainingSteps);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[90vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="flex justify-between px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <MapPinned className="w-6 h-6" /> Optimal Shopping Path
          </DialogTitle>
        </DialogHeader>

        {/* Map on top, info below */}
        <div className="flex-1 overflow-hidden bg-white">
          <StoreMapVisualizer
            layout={layout}
            cartItemLocations={cartItemLocations}
            optimalPath={optimalPath}
            currentStepIndex={currentStepIndex}
          />
        </div>

        {/* Step Info & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t px-6 py-4 bg-muted/30 gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
            <div className="text-lg font-semibold text-primary">
              {currentLocation}
            </div>

            {isItemHere && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <ShoppingCart className="w-4 h-4" />
                Pick up item(s) here
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              ETA: {eta}
            </div>

            {isLastStep && currentLocation === 'Checkout' && (
              <div className="text-green-600 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                Destination Reached
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>

            <Button variant="ghost" onClick={onClose} className="text-red-500">
              <RefreshCw className="w-4 h-4 mr-1" />
              Restart
            </Button>

            <Button
              variant="default"
              onClick={onNextStep}
              disabled={isLastStep}
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
