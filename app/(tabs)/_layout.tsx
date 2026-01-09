import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function TabLayout() {
    return (
        <>
            <StatusBar style="light" translucent />
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{ title: "Home", headerShown: false }}
                />
                <Stack.Screen
                    name="list"
                    options={{ title: "List", headerShown: false }}
                />
                <Stack.Screen
                    name="drinkingscreen"
                    options={{ title: "Drinking Screen", headerShown: false }}
                />
            </Stack>
        </>
    );
}
