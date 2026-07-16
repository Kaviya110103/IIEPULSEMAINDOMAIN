import { ThemedText } from "@/components/themed-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import api from "@/services/api";

const appLogo = require("../../assets/images/logo-light.png");

export default function DashboardLanding() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("Student");
  const [sessionPaused, setSessionPaused] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hasGuestSession, setHasGuestSession] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadSession = async () => {
        const [name, paused, token, guestRaw] = await Promise.all([
          AsyncStorage.getItem("student_name"),
          AsyncStorage.getItem("session_paused"),
          AsyncStorage.getItem("access_token"),
          AsyncStorage.getItem("guest_session"),
        ]);
        const guest = guestRaw ? JSON.parse(guestRaw) : null;
        setStudentName(name || guest?.name || guest?.username || "Student");
        setSessionPaused(paused === "true");
        setHasToken(!!token);
        setHasGuestSession(!!guestRaw);
      };

      loadSession();
    }, [])
  );

  const handleGoToDashboard = async () => {
    await AsyncStorage.removeItem("session_paused");
    router.replace((hasToken || hasGuestSession ? "/welcome" : "/loginform") as any);
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const refresh = await AsyncStorage.getItem("refresh_token");
      if (token) {
        await api.post("auth/logout/", { refresh });
      } else {
        const guestRaw = await AsyncStorage.getItem("guest_session");
        const guest = guestRaw ? JSON.parse(guestRaw) : null;
        if (guest?.username) {
          await api.post("public-users/logout/", { username: guest.username });
        }
      }
    } catch {
      // Local logout should still complete if network/backend is unavailable.
    }

    await AsyncStorage.multiRemove([
      "guest_session",
      "access_token",
      "refresh_token",
      "student_id",
      "student_pk",
      "student_name",
      "session_paused",
    ]);
    router.replace("/loginform" as any);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Image source={appLogo} style={styles.logo} resizeMode="contain" />

        <View style={styles.iconRow}>
          <View style={styles.iconTile}>
            <Ionicons name="grid-outline" size={22} color="#5523D2" />
          </View>
          <View style={styles.iconTile}>
            <Ionicons name="reader-outline" size={22} color="#5523D2" />
          </View>
          <View style={styles.iconTile}>
            <Ionicons name="school-outline" size={22} color="#5523D2" />
          </View>
        </View>

        <ThemedText style={styles.title}>Welcome, {studentName}</ThemedText>
        <ThemedText style={styles.subtitle}>
          {sessionPaused
            ? "Your session was paused after 5 minutes of inactivity."
            : "Your student dashboard is ready."}
        </ThemedText>

        <Pressable style={styles.primaryButton} onPress={handleGoToDashboard}>
          <ThemedText style={styles.primaryText}>Go to Dashboard</ThemedText>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={17} color="#5523D2" />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F3FF",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    shadowColor: "#5523D2",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logo: {
    width: "92%",
    height: 170,
    marginBottom: 18,
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  title: {
    color: "#1F1335",
    fontSize: 27,
    lineHeight: 35,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: "#5523D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  logoutButton: {
    marginTop: 14,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: "#5523D2",
    fontSize: 14,
    fontWeight: "800",
  },
});
