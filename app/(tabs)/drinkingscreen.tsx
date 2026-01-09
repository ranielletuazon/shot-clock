import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";
import { Audio } from "expo-av";

interface Group {
    id: string;
    name: string;
    members: string[];
    timerEnabled: boolean;
    timerSeconds: number | null;
    alarmSound: string;
    createdAt: string;
}

export default function DrinkingScreen() {
    const { groupId } = useLocalSearchParams<{ groupId: string }>();

    const [group, setGroup] = useState<Group | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);

    const alarmRef = useRef<Audio.Sound | null>(null);

    const [alarmActive, setAlarmActive] = useState(false);

    /* ---------------- LOAD GROUP ---------------- */
    useEffect(() => {
        const loadGroup = async () => {
            const stored = await AsyncStorage.getItem("groups");
            if (!stored) return;

            const groups: Group[] = JSON.parse(stored);
            const found = groups.find((g) => g.id === groupId);

            if (found) {
                setGroup(found);
                if (found.timerEnabled && found.timerSeconds) {
                    setTimeLeft(found.timerSeconds);
                }
            }
        };

        loadGroup();
    }, [groupId]);

    /* ---------------- TIMER ---------------- */
    useEffect(() => {
        if (!group?.timerEnabled) return;
        if (timeLeft <= 0) return; // 🔑 STOP at 0

        const interval = setInterval(() => {
            setTimeLeft((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, group?.timerEnabled]);

    /* ---------------- ALARM ---------------- */
    const alarmSounds: Record<string, any> = {
        sound1: require("../sounds/sound1.mp3"),
        sound2: require("../sounds/sound2.mp3"),
        sound3: require("../sounds/sound3.mp3"),
    };

    const playAlarm = async () => {
        if (!group || alarmRef.current) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
                alarmSounds[group.alarmSound],
                { isLooping: true }
            );
            alarmRef.current = sound;
            await sound.playAsync();
            setAlarmActive(true);
        } catch (e) {
            console.warn("Alarm error:", e);
        }
    };

    const stopAlarm = async () => {
        if (!alarmRef.current) return;

        try {
            await alarmRef.current.stopAsync();
            await alarmRef.current.unloadAsync();
        } finally {
            alarmRef.current = null;
            setAlarmActive(false);
        }
    };

    // 🔔 Trigger alarm ONLY when timer reaches 0
    useEffect(() => {
        if (timeLeft === 0 && group?.timerEnabled) {
            playAlarm();
        }
    }, [timeLeft]);

    /* ---------------- HELPERS ---------------- */
    const nextTurn = () => {
        if (!group) return;

        if (currentIndex === group.members.length - 1) {
            setCurrentIndex(0);
            setRound((r) => r + 1);
        } else {
            setCurrentIndex((i) => i + 1);
        }
    };

    const resetTimer = () => {
        if (group?.timerEnabled && group.timerSeconds) {
            setTimeLeft(group.timerSeconds);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    /* ---------------- LOADING ---------------- */
    if (!group) {
        return (
            <View className="flex-1 bg-slate-900 items-center justify-center">
                <Text className="text-slate-400">Loading...</Text>
            </View>
        );
    }

    const currentPlayer = group.members[currentIndex];

    return (
        <View className="flex-1 bg-slate-900 items-center justify-between px-6 py-12">
            {/* Header */}
            <Text className="text-slate-400 text-sm tracking-widest">
                SHOT CLOCK
            </Text>

            {/* Timer */}
            <View className="items-center mt-10">
                <Pressable
                    disabled={!(timeLeft === 0 && alarmActive)}
                    onPress={async () => {
                        await stopAlarm();
                    }}
                >
                    <Text
                        className={`text-7xl font-extrabold ${
                            timeLeft === 0 && alarmActive
                                ? "text-green-500"
                                : "text-red-500"
                        }`}
                    >
                        {group.timerEnabled ? formatTime(timeLeft) : "--:--"}
                    </Text>
                </Pressable>

                <Text className="text-slate-400 mt-2">Time remaining</Text>
            </View>

            {/* Active Player */}
            <View className="items-center mt-12">
                <Text className="text-slate-400 text-sm mb-1">
                    CURRENT TURN
                </Text>
                <Text className="text-white text-3xl font-bold">
                    {currentPlayer}
                </Text>
                <Text className="text-slate-500 mt-2">Round {round}</Text>
            </View>

            {/* Turn Indicators */}
            <View className="flex-row gap-2 mt-10">
                {group.members.map((_, i) => (
                    <View
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                            i === currentIndex ? "bg-red-500" : "bg-slate-600"
                        }`}
                    />
                ))}
            </View>

            {/* Actions */}
            <View className="w-full mt-12 gap-4">
                <Pressable
                    className="bg-red-500 py-5 rounded-2xl items-center"
                    onPress={async () => {
                        await stopAlarm();
                        nextTurn();
                        resetTimer();
                    }}
                >
                    <Text className="text-white text-lg font-bold">
                        TAKE SHOT
                    </Text>
                </Pressable>

                <Pressable
                    className="bg-slate-700 py-5 rounded-2xl items-center"
                    onPress={async () => {
                        await stopAlarm();
                        nextTurn();
                        resetTimer();
                    }}
                >
                    <Text className="text-white text-lg font-bold">
                        SKIP TURN
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
