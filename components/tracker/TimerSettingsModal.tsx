import { X } from "lucide-react-native";
import { View as MotiView } from "moti";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";

interface Props {
  visible: boolean;
  isDark: boolean;
  autoNextRound: boolean;
  ringColor: string;
  onClose: () => void;
  onAutoNextRoundChange: (val: boolean) => void;
}

export default function TimerSettingsModal({
  visible,
  isDark,
  autoNextRound,
  ringColor,
  onClose,
  onAutoNextRoundChange,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <MotiView
          from={{ translateY: 300 }}
          animate={{ translateY: 0 }}
          transition={{ type: "timing", duration: 280 }}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
            onPress={() => {}}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: isDark ? "#fff" : "#121212" }]}>
                Timer Settings
              </Text>
              <Pressable onPress={onClose}>
                <X size={20} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
              </Pressable>
            </View>
            <View style={styles.row}>
              <View>
                <Text style={[styles.label, { color: isDark ? "#fff" : "#121212" }]}>
                  Auto-next Round
                </Text>
                <Text style={[styles.desc, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>
                  Skip confirmation between rounds
                </Text>
              </View>
              <Switch
                value={autoNextRound}
                onValueChange={onAutoNextRoundChange}
                trackColor={{ false: isDark ? "#3f3f46" : "#e5e7eb", true: ringColor }}
                thumbColor="#fff"
              />
            </View>
          </Pressable>
        </MotiView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
  },
});
