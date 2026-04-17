import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import React from "react";
import { Animated, Text, View } from "react-native";

type Props = {
  message: {
    id: string;
    text: string;
    sender: "user" | "flow";
  };
  fadeAnim: Animated.Value;
};

export const ChatBubble = React.memo(function ChatBubble({ message, fadeAnim }: Props) {
  const isUser = message.sender === "user";

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={`mb-6 flex-row ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <Image
          source={require("../assets/images/flow portrait.png")}
          style={{ width: 32, height: 32, borderRadius: 10, marginRight: 12, marginTop: -4 }}
          contentFit="cover"
        />
      )}
      <View
        className={`max-w-[80%] p-4 rounded-[24px] ${
          isUser
            ? "bg-klowk-black dark:bg-zinc-800 rounded-tr-none"
            : "bg-gray-50 dark:bg-zinc-900 rounded-tl-none"
        }`}
      >
        <Text
          className={`text-sm font-semibold leading-5 ${
            isUser ? "text-white" : "text-klowk-black dark:text-white"
          }`}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
});

export const TypingBubble = React.memo(function TypingBubble() {
  return (
    <View className="mb-6 flex-row justify-start">
      <Image
        source={require("../assets/images/flow portrait.png")}
        style={{ width: 32, height: 32, borderRadius: 10, marginRight: 12 }}
        contentFit="cover"
      />
      <View className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-[24px] rounded-tl-none">
        <Text className="text-gray-400 dark:text-zinc-600 font-black">...</Text>
      </View>
    </View>
  );
});
