import React from "react";
import { View } from "react-native";

interface ProgressIndicatorProps {
  currentStep: number; // 1, 2, or 3
  totalSteps?: number;
}

export default function ProgressIndicator({
  currentStep,
  totalSteps = 3,
}: ProgressIndicatorProps) {
  const dotsArray = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View className="flex-row items-center justify-center gap-3 px-6 pt-6 pb-4">
      {dotsArray.map((step, idx) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <React.Fragment key={step}>
            {/* Dot */}
            <View
              className={`w-3 h-3 rounded-full transition-colors ${
                isActive || isCompleted
                  ? "bg-amber-400"
                  : "bg-gray-200 dark:bg-zinc-700"
              }`}
            />

            {/* Connecting Line */}
            {idx < dotsArray.length - 1 && (
              <View
                className={`flex-1 h-1 rounded-full transition-colors ${
                  isCompleted ? "bg-amber-400" : "bg-gray-200 dark:bg-zinc-700"
                }`}
                style={{ maxWidth: 40 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
