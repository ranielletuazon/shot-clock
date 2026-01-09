import { Text, Platform, StatusBar, View, Pressable } from "react-native";
import "../global.css";
import { useRouter } from "expo-router";

export default function HomeScreen() {
    const paddingTop =
        Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0;

    const router = useRouter();

    return (
        <View
            style={{ paddingTop }}
            className="flex-1 bg-slate-900 items-center justify-center"
        >
            {/* Title */}
            <Text className="text-4xl font-extrabold text-slate-100 mb-10">
                Shot Clock
            </Text>

            {/* Start Button */}
            <Pressable
                className="bg-red-500 px-14 py-4 rounded-full shadow-lg"
                android_ripple={{ color: "#fecaca" }}
                onPress={() => {
                    router.push("/list");
                }}
            >
                <Text className="text-white text-xl font-bold tracking-wide">
                    Start
                </Text>
            </Pressable>
        </View>
    );
}
