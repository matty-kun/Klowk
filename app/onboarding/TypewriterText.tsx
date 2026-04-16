import React, { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  onDone?: () => void;
}

export default function TypewriterText({
  text,
  speed = 28,
  className,
  onDone,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");

    const tick = () => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
        timerRef.current = setTimeout(tick, speed);
      } else {
        onDone?.();
      }
    };

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed]);

  return (
    <Text className={className}>
      {displayed}
      {displayed.length < text.length && (
        <Text className="text-amber-400">▍</Text>
      )}
    </Text>
  );
}
