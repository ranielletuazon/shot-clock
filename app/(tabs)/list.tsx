import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import AddGroupModal from "../modals/addgroupmodal";

interface Group {
    id: string;
    name: string;
    members: string[];
    timerEnabled: boolean;
    timerSeconds: number | null;
    alarmSound: string;
    createdAt: string;
}

export default function ListScreen() {
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);

    const loadGroups = async () => {
        try {
            const storedGroups = await AsyncStorage.getItem("groups");
            const parsed: Group[] = storedGroups
                ? JSON.parse(storedGroups)
                : [];
            setGroups(parsed);
        } catch (error) {
            console.warn("Error loading groups:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [])
    );

    // Delete
    const deleteGroup = async (groupId: string) => {
        try {
            const updatedGroups = groups.filter(
                (group) => group.id !== groupId
            );

            setGroups(updatedGroups);
            await AsyncStorage.setItem("groups", JSON.stringify(updatedGroups));
        } catch (error) {
            console.warn("Error deleting group:", error);
        }
    };

    return (
        <View className="flex-1 bg-slate-900">
            {/* Header */}
            <View className="flex-none border-b border-slate-700 p-6 flex-row justify-between items-center">
                <Text className="text-white text-xl">Group List</Text>
                <Pressable
                    onPress={() => setShowModal(true)}
                    className="bg-gray-600 px-6 py-4 rounded-full"
                >
                    <Text className="text-white text-lg">Add Group</Text>
                </Pressable>
                <AddGroupModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    onGroupSaved={loadGroups}
                />
            </View>

            {/* Scrollable List */}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="">
                <View className="flex-1 p-4 gap-4">
                    {/* Group Card */}
                    {groups.length === 0 ? (
                        <View className="flex-1 items-center justify-start mt-20">
                            <Text className="text-slate-400 text-base">
                                No groups yet. Add one to get started 🍻
                            </Text>
                        </View>
                    ) : (
                        groups.map((group) => (
                            <Pressable
                                key={group.id}
                                className="bg-slate-800 rounded-2xl p-5 border border-slate-700"
                                onPress={() => {
                                    router.push({
                                        pathname: "/drinkingscreen",
                                        params: { groupId: group.id },
                                    });
                                }}
                            >
                                {/* Top Row */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-white text-lg font-bold">
                                        {group.name}
                                    </Text>
                                    <Text className="text-slate-400 text-sm">
                                        {new Date(
                                            group.createdAt
                                        ).toLocaleDateString()}
                                    </Text>
                                </View>

                                {/* Members */}
                                <View className="flex-row items-center">
                                    <Text className="text-slate-300 text-base">
                                        Members:
                                    </Text>
                                    <Text className="text-slate-100 text-base font-semibold ml-2">
                                        {group.members.length}
                                    </Text>
                                </View>

                                {/* Timer Info */}
                                {group.timerEnabled && (
                                    <Text className="text-slate-400 text-sm mt-2">
                                        ⏱ {group.timerSeconds}s •{" "}
                                        {group.alarmSound}
                                    </Text>
                                )}

                                {/* Delete Button */}
                                <View className="flex-row justify-end mt-4">
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation(); // 🔑 prevents navigation
                                            deleteGroup(group.id);
                                        }}
                                        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500"
                                    >
                                        <Text className="text-red-400 font-semibold">
                                            Delete
                                        </Text>
                                    </Pressable>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
