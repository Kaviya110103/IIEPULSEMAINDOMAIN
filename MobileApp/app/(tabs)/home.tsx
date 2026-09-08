import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "@/services/api";
import CustomBottomNav from "./CustomBottomNav";

type StudentData = {
  first_name?: string;
  last_name?: string;
  student_id?: string;
  course?: string;
  email?: string;
  assigned_batch_number?: string;
  assigned_batch_code?: string;
  assigned_staff_name?: string;
};

type DashboardData = {
  student?: StudentData;
  attendance_percentage?: number;
  total_classes?: number;
  present_classes?: number;
  sessions_completed?: number;
  total_sessions?: number;
};

type WeeklyLoginRating = {
  week_start: string;
  week_end: string;
  stars: number;
  max_stars: number;
  days: {
    date: string;
    day: string;
    login_count: number;
    earned: boolean;
  }[];
};

type SessionItem = {
  id: number;
  session_number: number;
  title: string;
  topics?: string | null;
  staff_completed: boolean;
  student_status: "not_started" | "pending" | "completed" | "doubt";
  completed_date?: string | null;
  student_confirmed_at?: string | null;
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loginRating, setLoginRating] = useState<WeeklyLoginRating | null>(null);
  const [starAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setErrorMsg("");
      const [dashboardResponse, ratingResponse] = await Promise.all([
        api.get("/dashboard/student/"),
        api.get("/student/login-rating/"),
      ]);
      setDashboard(dashboardResponse.data);
      setLoginRating(ratingResponse.data?.current_week || null);

      try {
        const sessionResponse = await api.get("sessions/student/");
        const sessionData = sessionResponse.data;
        const list = Array.isArray(sessionData)
          ? sessionData
          : Array.isArray(sessionData?.results)
          ? sessionData.results
          : [];
        setSessions(list);
      } catch (sessionError) {
        console.log("OVERVIEW SESSION LOAD ERROR:", sessionError);
        setSessions([]);
      }
    } catch (error: any) {
      setErrorMsg(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          "Failed to load overview"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
  };

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => Number(a.session_number || 0) - Number(b.session_number || 0)
      ),
    [sessions]
  );

  const previousClass = useMemo(() => {
    const finished = sortedSessions.filter(
      (session) =>
        session.staff_completed ||
        session.student_status === "completed" ||
        session.student_status === "pending" ||
        session.student_status === "doubt"
    );
    return finished[finished.length - 1] || null;
  }, [sortedSessions]);

  const upcomingClass = useMemo(() => {
    if (!sortedSessions.length) return null;
    const next = sortedSessions.find(
      (session) =>
        !session.staff_completed &&
        session.student_status !== "completed" &&
        session.student_status !== "pending" &&
        session.student_status !== "doubt"
    );
    return next || null;
  }, [sortedSessions]);

  const weeklyStars = loginRating?.stars ?? 0;

  useEffect(() => {
    Animated.spring(starAnim, {
      toValue: weeklyStars,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [starAnim, weeklyStars]);

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.helperText}>Loading overview...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOverviewData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const student = dashboard?.student;
  const studentName =
    `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
    "Student";
  const courseName = student?.course || "Course not assigned";
  const batchNumber = student?.assigned_batch_code || student?.assigned_batch_number || "Not assigned";
  const mentorName = student?.assigned_staff_name || "Not assigned";
  const attendancePercentage = clampPercent(dashboard?.attendance_percentage);
  const presentClasses = dashboard?.present_classes ?? 0;
  const totalClasses = dashboard?.total_classes ?? 0;
  const completedSessions =
    dashboard?.sessions_completed ??
    sortedSessions.filter((session) => session.student_status === "completed")
      .length;
  const totalSessions = dashboard?.total_sessions ?? sortedSessions.length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#5523D2"
          />
        }
      >
        <WeeklyStarRating
          rating={loginRating}
          animatedValue={starAnim}
          onPress={() => router.push("/login-rating-history" as any)}
        />

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="analytics-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>Student Overview</Text>
              <Text style={styles.heroTitle}>Hello, {studentName}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.courseRow}>
            <View style={styles.courseIcon}>
              <Ionicons name="school-outline" size={24} color="#2E1065" />
            </View>
            <View style={styles.courseTextBlock}>
              <Text style={styles.courseLabel}>Course Enrolled</Text>
              <Text style={styles.courseTitle}>{courseName}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <InfoTile label="Batch" value={batchNumber} icon="layers-outline" />
            <InfoTile label="Mentor" value={mentorName} icon="person-outline" />
          </View>
        </View>

        <View style={styles.progressPanel}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.panelKicker}>Attendance Progress</Text>
              <Text style={styles.progressTitle}>{attendancePercentage}%</Text>
            </View>
            <View style={styles.progressBadge}>
              <Ionicons name="trending-up-outline" size={16} color="#6D28D9" />
              <Text style={styles.progressBadgeText}>
                {presentClasses}/{totalClasses}
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${attendancePercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressHint}>
            Classes attended from your assigned batch schedule.
          </Text>
        </View>

        <View style={styles.sessionSummaryRow}>
          <View style={styles.sessionMiniCard}>
            <Text style={styles.sessionMiniNumber}>{completedSessions}</Text>
            <Text style={styles.sessionMiniText}>Completed</Text>
          </View>
          <View style={styles.sessionMiniCard}>
            <Text style={styles.sessionMiniNumber}>{totalSessions}</Text>
            <Text style={styles.sessionMiniText}>Total Sessions</Text>
          </View>
        </View>

        <View style={styles.timelinePanel}>
          <View style={styles.timelineHeader}>
            <View>
              <Text style={styles.panelKicker}>Session Sheet</Text>
              <Text style={styles.sectionTitle}>Class Timeline</Text>
            </View>
            <TouchableOpacity
              style={styles.logsheetButton}
              onPress={() => router.push("/logsheet" as any)}
            >
              <Text style={styles.logsheetButtonText}>View All</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <SessionCard
            variant="upcoming"
            label="Upcoming Class"
            session={upcomingClass}
            fallbackTitle="No upcoming session"
            fallbackText="Your next topic will appear after the session sheet is updated."
          />

          <SessionCard
            variant="previous"
            label="Previous Class"
            session={previousClass}
            fallbackTitle="No previous class yet"
            fallbackText="Completed class topics will show here from the session sheet."
          />
        </View>
      </ScrollView>

      <CustomBottomNav />
    </View>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.infoTile}>
      <Ionicons name={icon} size={17} color="#C4B5FD" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function WeeklyStarRating({
  rating,
  animatedValue,
  onPress,
}: {
  rating: WeeklyLoginRating | null;
  animatedValue: Animated.Value;
  onPress: () => void;
}) {
  const stars = rating?.stars ?? 0;
  const scale = animatedValue.interpolate({
    inputRange: [0, 5],
    outputRange: [0.96, 1.04],
    extrapolate: "clamp",
  });

  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.ratingCard} onPress={onPress}>
      <View style={styles.ratingHeader}>
        <View style={styles.ratingIcon}>
          <Ionicons name="sparkles" size={17} color="#B45309" />
        </View>
        <View>
          <Text style={styles.ratingKicker}>Weekly Login</Text>
          <Text style={styles.ratingTitle}>{stars}/5 Stars</Text>
        </View>
      </View>
      <Animated.View style={[styles.starRow, { transform: [{ scale }] }]}>
        {Array.from({ length: 5 }).map((_, index) => {
          const active = index < stars;
          return (
            <Ionicons
              key={index}
              name={active ? "star" : "star-outline"}
              size={22}
              color={active ? "#F59E0B" : "#D8CFF6"}
            />
          );
        })}
      </Animated.View>
      <View style={styles.ratingFooter}>
        <Text style={styles.ratingHint}>2 logins/day earns 1 star</Text>
        <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
      </View>
    </TouchableOpacity>
  );
}

function SessionCard({
  label,
  session,
  variant,
  fallbackTitle,
  fallbackText,
}: {
  label: string;
  session: SessionItem | null;
  variant: "previous" | "upcoming";
  fallbackTitle: string;
  fallbackText: string;
}) {
  const isUpcoming = variant === "upcoming";
  const title = session ? getSessionTitle(session) : fallbackTitle;
  const topics = session ? cleanTopics(session.topics) : fallbackText;
  const dateText = session
    ? formatSessionDate(session.completed_date || session.student_confirmed_at)
    : "Waiting for update";

  return (
    <View style={styles.sessionCard}>
      <View
        style={[
          styles.timelineDot,
          isUpcoming ? styles.timelineDotUpcoming : styles.timelineDotPrevious,
        ]}
      >
        <Ionicons
          name={isUpcoming ? "radio-button-on" : "checkmark-circle"}
          size={18}
          color={isUpcoming ? "#FDE68A" : "#86EFAC"}
        />
      </View>
      <View style={styles.sessionBody}>
        <View style={styles.sessionTopLine}>
          <Text style={styles.sessionLabel}>{label}</Text>
          <Text style={styles.sessionDate}>{dateText}</Text>
        </View>
        <Text style={styles.sessionTitle}>{title}</Text>
        <View style={styles.topicBox}>
          <Ionicons name="book-outline" size={15} color="#A78BFA" />
          <Text style={styles.topicText}>{topics}</Text>
        </View>
      </View>
    </View>
  );
}

function clampPercent(value?: number) {
  const parsed = Number(value || 0);
  return Math.max(0, Math.min(Math.round(parsed), 100));
}

function getSessionTitle(session: SessionItem) {
  const title = session.title?.trim() || "Session";
  if (title.toLowerCase().startsWith("session")) return title;
  return `Session ${session.session_number}: ${title}`;
}

function cleanTopics(topics?: string | null) {
  const cleaned = (topics || "")
    .replace(/\s+/g, " ")
    .replace(/^[-:,\s]+/, "")
    .trim();
  if (!cleaned) return "Topics will be updated from the session sheet.";
  return cleaned.length > 150 ? `${cleaned.slice(0, 147)}...` : cleaned;
}

function formatSessionDate(date?: string | null) {
  if (!date) return "Session sheet";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Session sheet";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F3FF",
  },
  scrollContent: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 112,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F3FF",
    padding: 24,
  },
  helperText: {
    marginTop: 12,
    color: "#6D28D9",
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#FFFFFF",
  },
  ratingCard: {
    alignSelf: "flex-start",
    minWidth: 210,
    marginBottom: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFFFF",
    shadowColor: "#B45309",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratingIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
  },
  ratingKicker: {
    color: "#9A6A04",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  ratingTitle: {
    marginTop: 1,
    color: "#2E1065",
    fontSize: 18,
    fontWeight: "900",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  ratingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },
  ratingHint: {
    flex: 1,
    color: "#6B5A80",
    fontSize: 11,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: "#5523D2",
    borderRadius: 28,
    padding: 18,
    shadowColor: "#5523D2",
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroCopy: {
    flex: 1,
    marginLeft: 12,
  },
  kicker: {
    color: "#DDD6FE",
    fontSize: 11,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 31,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 16,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  courseTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  courseLabel: {
    color: "#C4B5FD",
    fontSize: 12,
  },
  courseTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 23,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  infoTile: {
    flex: 1,
    minHeight: 94,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  infoLabel: {
    color: "#C4B5FD",
    fontSize: 11,
    marginTop: 8,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  progressPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#EEE7FF",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelKicker: {
    color: "#A78BFA",
    fontSize: 11,
    textTransform: "uppercase",
  },
  progressTitle: {
    color: "#2E1065",
    fontSize: 34,
    lineHeight: 42,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F3FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressBadgeText: {
    color: "#4C1D95",
    fontSize: 12,
  },
  progressTrack: {
    height: 13,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    overflow: "hidden",
    marginTop: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A855F7",
  },
  progressHint: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 11,
  },
  sessionSummaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  sessionMiniCard: {
    flex: 1,
    backgroundColor: "#FBF9FF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE7FF",
  },
  sessionMiniNumber: {
    color: "#2E1065",
    fontSize: 27,
    lineHeight: 34,
  },
  sessionMiniText: {
    color: "#6B7280",
    fontSize: 12,
  },
  timelinePanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#EEE7FF",
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#2E1065",
    fontSize: 22,
    lineHeight: 29,
  },
  logsheetButton: {
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: "#6D28D9",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logsheetButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: "#FBF9FF",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEE7FF",
    marginTop: 11,
  },
  timelineDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  timelineDotUpcoming: {
    backgroundColor: "rgba(253,230,138,0.14)",
  },
  timelineDotPrevious: {
    backgroundColor: "rgba(134,239,172,0.13)",
  },
  sessionBody: {
    flex: 1,
    minWidth: 0,
  },
  sessionTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionLabel: {
    color: "#A78BFA",
    fontSize: 11,
    textTransform: "uppercase",
  },
  sessionDate: {
    color: "#7C3AED",
    fontSize: 11,
  },
  sessionTitle: {
    color: "#1F1335",
    fontSize: 16,
    lineHeight: 22,
    marginTop: 5,
  },
  topicBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F5F3FF",
    borderRadius: 15,
    padding: 11,
    marginTop: 10,
  },
  topicText: {
    flex: 1,
    color: "#4B5563",
    fontSize: 12,
    lineHeight: 18,
  },
});
