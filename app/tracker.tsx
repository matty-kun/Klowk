import { CategoryIcon } from "@/components/CategoryIcon";
import { useTracking } from "@/context/TrackingContext";
import { sendLocalNotification } from "@/utils/notifications";
import { DEFAULT_POMODORO_SETTINGS, loadPomodoroSettings, savePomodoroSettings } from "@/utils/pomodoro";
import { Audio } from "expo-av";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Minimize2, Pause, Play, Settings, Square, X } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.8;

export default function TrackerPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pomodoro?: string;
    workSecs?: string;
    shortBreakSecs?: string;
    longBreakSecs?: string;
    rounds?: string;
    baseTitle?: string;
    category?: string;
    targetSecs?: string;
  }>();

  const isPomodoroMode = params.pomodoro === "true";
  const pInitialTargetSecs = parseInt(params.targetSecs || "0");
  const pWorkSecs = parseInt(params.workSecs || "1500");
  const pShortBreakSecs = parseInt(params.shortBreakSecs || "300");
  const pLongBreakSecs = parseInt(params.longBreakSecs || "900");
  const pTotalRounds = parseInt(params.rounds || "4");
  const pBaseTitle = params.baseTitle || "";
  const pCategory = params.category || "work";

  const { currentActivity, startTracker, stopTracker, setIsMinimized, categories } =
    useTracking();
  const lastActivity = useRef(currentActivity);
  if (currentActivity) lastActivity.current = currentActivity;
  const activity = lastActivity.current;
  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedSecs, setAccumulatedSecs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pomodoroWaiting, setPomodoroWaiting] = useState(false);
  const hasAlerted = useRef(false);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const pausedAtMs = useRef<number | null>(null);
  const totalPausedMs = useRef(0);
  const phaseStartMs = useRef<number>(Date.now());
  const pendingTargetSecs = useRef<number>(0);

  // Pomodoro round tracking
  const pomodoroRound = useRef(1);
  const pomodoroPhase = useRef<"work" | "break">("work");
  const isCycling = useRef(false);
  const [roundDisplay, setRoundDisplay] = useState(1);
  const [phaseDisplay, setPhaseDisplay] = useState<"work" | "break">("work");
  const [autoNextRound, setAutoNextRound] = useState(DEFAULT_POMODORO_SETTINGS.autoNextRound);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [midRoundWaiting, setMidRoundWaiting] = useState(false);

  const radius = CIRCLE_SIZE / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progressShared = useSharedValue(1);

  // Load persisted autoNextRound setting
  useEffect(() => {
    loadPomodoroSettings().then((s) => setAutoNextRound(s.autoNextRound));
  }, []);

  // Reset timer state when a new activity begins (used during Pomodoro cycling)
  useEffect(() => {
    if (currentActivity) {
      const initialElapsed = Math.floor(
        (Date.now() - currentActivity.start_time) / 1000,
      );
      setAccumulatedSecs(initialElapsed);
      hasAlerted.current = false;
    }
  }, [currentActivity?.id]);

  // Guard: only redirect when not mid-cycle and not in pomodoro (pomodoro handles its own navigation)
  const justMounted = useRef(true);
  useEffect(() => { const t = setTimeout(() => { justMounted.current = false; }, 2000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (justMounted.current) return;
    if (!currentActivity && !isCycling.current && !isPomodoroMode && !isCompleted) {
      router.replace("/(tabs)");
    }
  }, [currentActivity]);

  const handleMinimize = () => {
    impact(ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
    setIsMinimized(true);
  };

  const handleStop = () => {
    notification(NotificationFeedbackType.Warning);
    if (!isCompleted) {
      stopTracker().catch((error) => {
        console.error("Error stopping tracker:", error);
      });
    }
    router.replace("/(tabs)");
  };

  const togglePause = () => {
    impact(ImpactFeedbackStyle.Medium);
    if (!isPaused) {
      pausedAtMs.current = Date.now();
    } else {
      if (pausedAtMs.current !== null) {
        totalPausedMs.current += Date.now() - pausedAtMs.current;
        pausedAtMs.current = null;
      }
    }
    setIsPaused((prev) => !prev);
  };

  useEffect(() => {
    if (isPaused) return;

    const sync = currentActivity
      ? () => {
          const elapsed = Date.now() - currentActivity.start_time - totalPausedMs.current;
          setAccumulatedSecs(Math.floor(elapsed / 1000));
        }
      : isCycling.current
      ? () => setAccumulatedSecs(Math.floor((Date.now() - phaseStartMs.current) / 1000))
      : null;

    if (!sync) return;

    sync();
    const interval = setInterval(sync, 1000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [currentActivity, isPaused]);

  const handlePomodoroTransition = useCallback(async () => {
    if (isCycling.current) return;
    isCycling.current = true;

    const currentRound = pomodoroRound.current;
    const currentPhase = pomodoroPhase.current;

    const isLastRound = currentPhase === "work" && currentRound >= pTotalRounds;

    setPomodoroWaiting(false);
    phaseStartMs.current = Date.now();
    setAccumulatedSecs(0);
    totalPausedMs.current = 0;
    setIsPaused(false);

    await stopTracker();

    if (currentPhase === "work" && isLastRound) {
      isCycling.current = false;
      router.replace("/(tabs)");
      return;
    }

    if (currentPhase === "work") {
      const breakSecs = pShortBreakSecs;

      pendingTargetSecs.current = breakSecs;
      pomodoroPhase.current = "break";
      setPhaseDisplay("break");

      notification(NotificationFeedbackType.Success);
      sendLocalNotification(
        "Work session complete! ☕",
        `Time for a short break. Round ${currentRound} of ${pTotalRounds} done.`,
      );

      await startTracker(`${pBaseTitle} — Short Break`, pCategory, "Pomodoro break", breakSecs);
    } else {
      if (pomodoroRound.current >= pTotalRounds) {
        notification(NotificationFeedbackType.Success);
        sendLocalNotification(
          "Pomodoro complete! 🎉",
          `You finished all ${pTotalRounds} rounds. Amazing focus!`,
        );
        isCycling.current = false;
        router.replace("/(tabs)");
        return;
      }

      const nextRound = pomodoroRound.current + 1;
      pomodoroRound.current = nextRound;
      setRoundDisplay(nextRound);
      pomodoroPhase.current = "work";
      setPhaseDisplay("work");

      notification(NotificationFeedbackType.Success);
      sendLocalNotification(
        "Break over — back to work! 💪",
        `Starting Round ${nextRound} of ${pTotalRounds}.`,
      );

      await startTracker(`${pBaseTitle} — Round ${nextRound}`, pCategory, "Pomodoro", pWorkSecs);
    }

    isCycling.current = false;
  }, [pBaseTitle, pCategory, pWorkSecs, pShortBreakSecs, pLongBreakSecs, pTotalRounds]);

  // Fire haptic + notification when countdown hits zero
  useEffect(() => {
    const targetSecs = currentActivity?.target_duration;
    if (!targetSecs || hasAlerted.current || isPaused) return;
    if (accumulatedSecs >= targetSecs) {
      hasAlerted.current = true;

      if (isPomodoroMode) {
        const isLastWorkRound =
          pomodoroPhase.current === "work" &&
          pomodoroRound.current >= pTotalRounds;
        if (isLastWorkRound) {
          notification(NotificationFeedbackType.Success);
          sendLocalNotification(
            "Last round complete! 🎉",
            "Tap the check when you're done.",
          );
          (async () => {
            try {
              await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: true, shouldDuckAndroid: false, playThroughEarpieceAndroid: false });
              const { sound } = await Audio.Sound.createAsync(require("../assets/sounds/alarm-sound.mp3"), { isLooping: true });
              alarmSoundRef.current = sound;
              await sound.playAsync();
            } catch (e) { console.log("Could not play sound:", e); }
          })();
          setPomodoroWaiting(true);
        } else if (autoNextRound) {
          handlePomodoroTransition();
        } else {
          notification(NotificationFeedbackType.Success);
          sendLocalNotification(
            pomodoroPhase.current === "work" ? "Work session done! ☕" : "Break over! 💪",
            "Tap Next Round when you're ready.",
          );
          (async () => {
            try {
              await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: true, shouldDuckAndroid: false, playThroughEarpieceAndroid: false });
              const { sound } = await Audio.Sound.createAsync(require("../assets/sounds/alarm-sound.mp3"), { isLooping: true });
              alarmSoundRef.current = sound;
              await sound.playAsync();
            } catch (e) { console.log("Could not play sound:", e); }
          })();
          setMidRoundWaiting(true);
        }
        return;
      }

      notification(NotificationFeedbackType.Success);
      sendLocalNotification(
        "Time's up! ⏱",
        `You completed "${currentActivity?.title}". Great work!`,
      );

      (async () => {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });
          const { sound } = await Audio.Sound.createAsync(
            require("../assets/sounds/alarm-sound.mp3"),
            { isLooping: true }
          );
          alarmSoundRef.current = sound;
          await sound.playAsync();
        } catch (error) {
          console.log("Could not play sound:", error);
        }
        notification(NotificationFeedbackType.Success);
        await stopTracker();
        setIsCompleted(true);
      })();
    }
  }, [accumulatedSecs]);

  // Single withTiming for the full remaining duration — runs entirely on UI thread
  useEffect(() => {
    if (isCompleted) {
      progressShared.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      return;
    }
    if (isPaused || !currentActivity) return;

    const elapsed = (Date.now() - currentActivity.start_time - totalPausedMs.current) / 1000;

    if (currentActivity.target_duration) {
      const remaining = Math.max(0, currentActivity.target_duration - elapsed);
      const currentProgress = Math.max(0, 1 - elapsed / currentActivity.target_duration);
      progressShared.value = currentProgress;
      progressShared.value = withTiming(0, { duration: remaining * 1000, easing: Easing.linear });
    } else {
      const secInMinute = elapsed % 60;
      const currentProgress = 1 - secInMinute / 60;
      const remainingInMinute = (60 - secInMinute) * 1000;
      progressShared.value = currentProgress;
      progressShared.value = withTiming(0, { duration: remainingInMinute, easing: Easing.linear });
    }
  }, [currentActivity?.id, currentActivity?.start_time, isPaused, isCompleted]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressShared.value),
  }));

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";


  const targetSecs = currentActivity
    ? (activity?.target_duration || 0)
    : isCycling.current
    ? pendingTargetSecs.current
    : (activity?.target_duration || pInitialTargetSecs || 0);
  const isCountdown = targetSecs > 0;
  const currentCategory = categories.find(
    (c) => c.id === activity?.category,
  );

  // In Pomodoro mode, show the base title instead of the interval-suffixed title
  const displayTitle = isPomodoroMode ? pBaseTitle : (activity?.title ?? "");
  const ringColor = isPomodoroMode
    ? phaseDisplay === "break" ? "#14b8a6" : "#FBBF24"
    : "#60a5fa";

  let displayTime = "";
  if (isCountdown) {
    const remaining = Math.max(0, targetSecs - accumulatedSecs);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const h = Math.floor(m / 60);
    displayTime =
      h > 0
        ? `${h}:${(m % 60).toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  } else {
    const h = Math.floor(accumulatedSecs / 3600);
    const m = Math.floor((accumulatedSecs % 3600) / 60);
    const s = accumulatedSecs % 60;
    displayTime =
      h > 0
        ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#fff" },
      ]}
    >
      <View style={[styles.header, !isPomodoroMode && { justifyContent: "flex-end" }]}>
        {isPomodoroMode && (
          <Pressable onPress={() => setShowTimerSettings(true)} style={styles.minimizeBtn}>
            <Settings size={22} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
          </Pressable>
        )}
        <Pressable onPressIn={handleMinimize} style={styles.minimizeBtn}>
          <Minimize2
            size={24}
            color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
          />
        </Pressable>
      </View>

      <Modal visible={showTimerSettings} transparent animationType="slide" onRequestClose={() => setShowTimerSettings(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimerSettings(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#121212" }]}>Timer Settings</Text>
              <Pressable onPress={() => setShowTimerSettings(false)}>
                <X size={20} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
              </Pressable>
            </View>
            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { color: isDark ? "#fff" : "#121212" }]}>Auto-next Round</Text>
                <Text style={[styles.settingDesc, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }]}>Skip confirmation between rounds</Text>
              </View>
              <Switch
                value={autoNextRound}
                onValueChange={(val) => {
                  setAutoNextRound(val);
                  loadPomodoroSettings().then((s) => savePomodoroSettings({ ...s, autoNextRound: val }));
                }}
                trackColor={{ false: isDark ? "#3f3f46" : "#e5e7eb", true: ringColor }}
                thumbColor="#fff"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <MotiView
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        style={styles.content}
      >
        <View style={styles.mascotContainer}>
          <Image
            source={require("../assets/images/focus klowk.png")}
            style={styles.mascot}
            contentFit="contain"
          />
        </View>

        <View style={styles.circleContainer}>
          <Svg
            width={CIRCLE_SIZE}
            height={CIRCLE_SIZE}
            viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
          >
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={radius}
              stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              strokeWidth="10"
              fill="transparent"
            />
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="90"
              scaleX={-1}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>

          <View style={styles.timeOverlay}>
            <Text
              style={[styles.timerText, { color: isDark ? "#fff" : "#121212" }]}
            >
              {displayTime}
            </Text>

            {isPomodoroMode && (
              <View style={styles.pomodoroPhaseRow}>
                <Text style={[styles.pomodoroPhaseLabel, { color: ringColor }]}>
                  {phaseDisplay === "work" ? "FOCUS" : "BREAK"}
                </Text>
                <View style={styles.roundDots}>
                  {Array.from({ length: pTotalRounds }).map((_, i) => {
                    const done = i < roundDisplay - 1;
                    const current = i === roundDisplay - 1;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.roundDot,
                          {
                            backgroundColor: done
                              ? ringColor
                              : current
                              ? ringColor
                              : isDark ? "#3f3f46" : "#e5e7eb",
                            width: current ? 18 : 8,
                            opacity: done ? 0.5 : 1,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={[styles.titleText, { color: ringColor }]}>{displayTitle}</Text>
            {currentCategory && (
              <View
                style={[
                  styles.categoryCapsule,
                  { backgroundColor: `${currentCategory.color}20` },
                ]}
              >
                <View
                  style={[
                    styles.categoryIconContainer,
                    { backgroundColor: currentCategory.color },
                  ]}
                >
                  <CategoryIcon
                    name={currentCategory.iconName}
                    size={12}
                    color="#fff"
                  />
                </View>
                <Text
                  style={[
                    styles.categoryText,
                    { color: currentCategory.color },
                  ]}
                >
                  {currentCategory.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          {isPomodoroMode && midRoundWaiting ? (
            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                if (alarmSoundRef.current) {
                  alarmSoundRef.current.stopAsync().then(() => alarmSoundRef.current?.unloadAsync());
                  alarmSoundRef.current = null;
                }
                setMidRoundWaiting(false);
                handlePomodoroTransition();
              }}
              style={[styles.controlBtn, styles.checkBtn, { backgroundColor: ringColor }]}
            >
              <Play size={28} color="#121212" fill="#121212" />
            </Pressable>
          ) : isCompleted && !isPomodoroMode ? (
            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                if (alarmSoundRef.current) {
                  alarmSoundRef.current.stopAsync().then(() => alarmSoundRef.current?.unloadAsync());
                  alarmSoundRef.current = null;
                }
                router.replace("/(tabs)");
              }}
              style={[styles.controlBtn, styles.checkBtn, { backgroundColor: "#FBBF24" }]}
            >
              <Check size={30} color="#121212" strokeWidth={3} />
            </Pressable>
          ) : isPomodoroMode && pomodoroWaiting ? (
            <Pressable
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                if (alarmSoundRef.current) {
                  alarmSoundRef.current.stopAsync().then(() => alarmSoundRef.current?.unloadAsync());
                  alarmSoundRef.current = null;
                }
                stopTracker().catch(() => {});
                router.replace("/(tabs)");
              }}
              style={[styles.controlBtn, styles.checkBtn, { backgroundColor: ringColor }]}
            >
              <Check size={30} color="#121212" strokeWidth={3} />
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={togglePause}
                style={[styles.controlBtn, { backgroundColor: ringColor }]}
              >
                {isPaused ? (
                  <Play size={24} color="#121212" fill="#121212" />
                ) : (
                  <Pause size={24} color="#121212" fill="#121212" />
                )}
              </Pressable>

              <Pressable
                onPress={handleStop}
                style={[
                  styles.controlBtn,
                  { backgroundColor: isDark ? "#fff" : "#121212", marginLeft: 20 },
                ]}
              >
                <Square
                  size={20}
                  color={isDark ? "#121212" : "#fff"}
                  fill={isDark ? "#121212" : "#fff"}
                />
              </Pressable>
            </>
          )}
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  minimizeBtn: {
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  mascotContainer: {
    marginBottom: -40,
    zIndex: 10,
  },
  mascot: {
    width: 140,
    height: 140,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timeOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 54,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  pomodoroPhaseRow: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 2,
  },
  pomodoroPhaseLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  roundDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FBBF24",
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  categoryCapsule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    marginTop: 60,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
  },
  checkBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
});
