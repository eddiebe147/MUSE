import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<
  HTMLInputElement,
  SliderProps
>(({ className, value = [50], onValueChange, max = 100, min = 0, step = 1, disabled, ...props }, ref) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    onValueChange?.([newValue]);
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer",
          "[&::-moz-range-thumb]:border-0 [&::-moz-range-track]:bg-secondary",
          "[&::-moz-range-track]:rounded-lg [&::-moz-range-track]:h-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        {...props}
      />
    </div>
  )
});

Slider.displayName = "Slider"

export { Slider }