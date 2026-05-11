import React from "react";
import { FlexWidget, ImageWidget, TextWidget } from "react-native-android-widget";

interface Props {
  todayMins: number;
  streak: number;
  weekDays: boolean[];
  accentColor: string;
}

export function FocusWidget({ todayMins, streak, weekDays, accentColor }: Props) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: (accentColor === "#18181b" ? "#FFFFFF" : accentColor) as any,
        borderRadius: 24,
        padding: 16,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "flow:///live" }}
    >
      <FlexWidget style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TextWidget
          text="Start Flow State"
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#121212",
            textAlign: "center",
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
