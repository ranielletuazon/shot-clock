import {
    Modal,
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Switch,
} from "react-native";
import { useState } from "react";
import { Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AddGroupModalProps {
    visible: boolean;
    onClose: () => void;
    onGroupSaved: () => void;
}

interface Group {
    id: string;
    name: string;
    members: string[];
    timerEnabled: boolean;
    timerSeconds: number | null;
    alarmSound: string;
    createdAt: string;
}

export default function AddGroupModal({
    visible,
    onClose,
    onGroupSaved,
}: AddGroupModalProps) {
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true, // 🔑 THIS IS THE FIX
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    }, []);

    const [members, setMembers] = useState<string[]>([""]);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [timerSeconds, setTimerSeconds] = useState<string>("");

    const addMemberField = () => {
        setMembers([...members, ""]);
    };
    const removeMemberField = (index: number) => {
        if (members.length === 1) return; // keep at least one
        setMembers(members.filter((_, i) => i !== index));
    };
    const [selectedAlarm, setSelectedAlarm] = useState<string>("sound1");
    const RadioOption = ({
        label,
        value,
        selected,
        onPress,
    }: {
        label: string;
        value: string;
        selected: string;
        onPress: (value: string) => void;
    }) => {
        const isSelected = selected === value;

        return (
            <Pressable
                onPress={() => onPress(value)}
                className="flex-row items-center mb-3 border border-slate-600 p-4 rounded-xl"
            >
                {/* Circle */}
                <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                        isSelected ? "border-red-500" : "border-slate-500"
                    }`}
                >
                    {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    )}
                </View>

                {/* Label */}
                <Text className="text-white text-base">{label}</Text>
            </Pressable>
        );
    };

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const soundRef = useRef<Audio.Sound | null>(null);

    const alarmSounds: Record<string, any> = {
        sound1: require("../sounds/sound1.mp3"),
        sound2: require("../sounds/sound2.mp3"),
        sound3: require("../sounds/sound3.mp3"),
    };

    const playPreview = async (soundKey: string) => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            const { sound } = await Audio.Sound.createAsync(
                alarmSounds[soundKey]
            );

            soundRef.current = sound;
            await sound.playAsync(); // 👈 explicit play
        } catch (e) {
            console.warn("Preview sound error:", e);
        }
    };

    useEffect(() => {
        if (!visible && soundRef.current) {
            soundRef.current.stopAsync();
            soundRef.current.unloadAsync();
            soundRef.current = null;
        }
    }, [visible]);

    const saveGroup = async () => {
        if (!groupName.trim()) return;

        const cleanMembers = members.filter((m) => m.trim() !== "");

        const newGroup: Group = {
            id: Date.now().toString(),
            name: groupName.trim(),
            members: cleanMembers,
            timerEnabled,
            timerSeconds: timerEnabled ? Number(timerSeconds) || null : null,
            alarmSound: selectedAlarm,
            createdAt: new Date().toISOString(),
        };

        try {
            const storedGroups = await AsyncStorage.getItem("groups");
            const groups: Group[] = storedGroups
                ? JSON.parse(storedGroups)
                : [];

            groups.push(newGroup);

            await AsyncStorage.setItem("groups", JSON.stringify(groups));

            // Reset modal state
            setGroupName("");
            setMembers([""]);
            setTimerEnabled(false);
            setTimerSeconds("");
            setSelectedAlarm("sound1");

            onGroupSaved();
            onClose();
        } catch (error) {
            console.warn("Error saving group:", error);
        }
    };

    return (
        <Modal visible={visible} animationType="none" transparent>
            {/* Backdrop */}
            <Animated.View
                style={{ opacity: fadeAnim }}
                className="flex-1 bg-black/60 justify-end"
            >
                {/* Modal Card - Fixed height container */}
                <View className="bg-slate-900 rounded-t-3xl pt-6">
                    {/* Header */}
                    <Text className="text-white text-2xl font-bold mb-4 px-6">
                        Add Group
                    </Text>

                    {/* Scrollable Content - with max height */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: 500 }}
                        contentContainerStyle={{
                            paddingHorizontal: 24,
                            paddingBottom: 24,
                        }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Group Name */}
                        <View className="mb-6">
                            <Text className="text-slate-300 mb-2">
                                Group Name
                            </Text>
                            <TextInput
                                value={groupName}
                                onChangeText={setGroupName}
                                placeholder="e.g. Friday Night Shots"
                                placeholderTextColor="#94a3b8"
                                className="bg-slate-800 text-white p-4 rounded-xl"
                            />
                        </View>

                        {/* Members */}
                        <View className="mb-6">
                            <Text className="text-slate-300 mb-2">Members</Text>

                            {members.map((member, index) => (
                                <View
                                    key={index}
                                    className="flex-row items-center mb-3"
                                >
                                    <TextInput
                                        value={member}
                                        onChangeText={(text) => {
                                            const updatedMembers = [...members];
                                            updatedMembers[index] = text;
                                            setMembers(updatedMembers);
                                        }}
                                        placeholder={`Member ${index + 1}`}
                                        placeholderTextColor="#94a3b8"
                                        className="flex-1 bg-slate-800 text-white p-4 rounded-xl"
                                    />

                                    {members.length > 1 && (
                                        <Pressable
                                            onPress={() =>
                                                removeMemberField(index)
                                            }
                                            className="ml-3 bg-slate-700 w-10 h-10 rounded-full items-center justify-center"
                                        >
                                            <Text className="text-white text-lg font-bold">
                                                ×
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            ))}

                            <Pressable
                                onPress={addMemberField}
                                className="mt-2 self-start"
                            >
                                <Text className="text-blue-400 font-semibold">
                                    + Add another member
                                </Text>
                            </Pressable>
                        </View>

                        {/* Settings */}
                        <View className="mb-6 flex flex-col">
                            <Text className="text-slate-300 mb-3">
                                Settings
                            </Text>

                            {/* Timer Toggle */}
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-white text-base">
                                    Enable Timer
                                </Text>
                                <Switch
                                    value={timerEnabled}
                                    onValueChange={setTimerEnabled}
                                />
                            </View>

                            {/* Timer Input */}
                            {timerEnabled && (
                                <TextInput
                                    value={timerSeconds}
                                    onChangeText={setTimerSeconds}
                                    placeholder="Time in seconds (e.g. 10)"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="number-pad"
                                    className="bg-slate-800 text-white p-4 rounded-xl"
                                />
                            )}
                            {/* Alarm Sound */}
                            {timerEnabled && (
                                <View className="mt-6">
                                    <Text className="text-slate-300 mb-3">
                                        Alarm Sound
                                    </Text>

                                    <RadioOption
                                        label="Alarm Sound 1"
                                        value="sound1"
                                        selected={selectedAlarm}
                                        onPress={(value) => {
                                            setSelectedAlarm(value);
                                            playPreview(value);
                                        }}
                                    />

                                    <RadioOption
                                        label="Alarm Sound 2"
                                        value="sound2"
                                        selected={selectedAlarm}
                                        onPress={(value) => {
                                            setSelectedAlarm(value);
                                            playPreview(value);
                                        }}
                                    />

                                    <RadioOption
                                        label="Alarm Sound 3"
                                        value="sound3"
                                        selected={selectedAlarm}
                                        onPress={(value) => {
                                            setSelectedAlarm(value);
                                            playPreview(value);
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer Actions - Fixed at bottom */}
                    <View className="flex-row gap-4 px-6 pb-6 pt-4 border-t border-slate-800">
                        <Pressable
                            onPress={onClose}
                            className="flex-1 bg-slate-700 py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-semibold">
                                Cancel
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={saveGroup}
                            className="flex-1 bg-red-500 py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold">
                                Save Group
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
}
