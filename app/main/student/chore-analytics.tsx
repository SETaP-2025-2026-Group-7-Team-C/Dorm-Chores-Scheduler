import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineNotification from '../../../components/InlineNotification';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getUserCompletionHistory, getWeeklyChoreSummary } from '../../../lib/analytics';
import { getActiveDormId } from '../../../lib/dorms';

export default function ChoreAnalyticsScreen() {
  const [summary, setSummary] = useState<{
    weekStartDate: string;
    weekEndDate: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  } | null>(null);
  const [history, setHistory] = useState<
    {
      userId: string;
      displayName?: string;
      completedCount: number;
      inProgressCount: number;
      pendingCount: number;
    }[]
  >([]);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      const dormId = await getActiveDormId();
      if (!dormId) throw new Error('No active dorm found');

      const [weekly, userHistory] = await Promise.all([
        getWeeklyChoreSummary(dormId),
        getUserCompletionHistory(dormId),
      ]);
      setSummary(weekly);
      setHistory(userHistory);
      setNotice(null);
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to load analytics' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics]),
  );

  const statusBars =
    summary && summary.total > 0
      ? [
          {
            label: 'Completed',
            value: summary.completed,
            ratio: summary.completed / summary.total,
            color: '#2E7D32',
          },
          {
            label: 'In progress',
            value: summary.inProgress,
            ratio: summary.inProgress / summary.total,
            color: '#F9A825',
          },
          {
            label: 'Pending',
            value: summary.pending,
            ratio: summary.pending / summary.total,
            color: '#5C6BC0',
          },
        ]
      : [];

  const maxCompleted =
    history.length > 0 ? Math.max(...history.map((h) => h.completedCount), 1) : 1;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <View style={styles.topBar}>
        <HeaderBackButton iconName="times" />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.heading}>Chore Analytics</Text>
          <Spacer size="small" />
          <Text style={styles.subheading}>Weekly summary and completion history by assignee.</Text>
          {notice ? (
            <>
              <Spacer size="small" />
              <InlineNotification type={notice.type} text={notice.text} />
            </>
          ) : null}

          {summary ? (
            <>
              <Spacer size="medium" />
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Weekly Summary</Text>
                <Text style={styles.cardText}>
                  {summary.weekStartDate} to {summary.weekEndDate}
                </Text>
                <Text style={styles.cardText}>Total chores: {summary.total}</Text>
                <Text style={styles.cardText}>Completed: {summary.completed}</Text>
                <Text style={styles.cardText}>In progress: {summary.inProgress}</Text>
                <Text style={styles.cardText}>Pending: {summary.pending}</Text>
                <Text style={styles.cardText}>Completion rate: {summary.completionRate}%</Text>
              </View>

              <Spacer size="small" />
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Status Distribution</Text>
                <Spacer size="small" />
                {statusBars.map((bar) => (
                  <View key={bar.label} style={styles.barRow}>
                    <Text style={styles.barLabel}>
                      {bar.label} ({bar.value})
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(6, Math.round(bar.ratio * 100))}%`,
                            backgroundColor: bar.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Spacer size="medium" />
          <Text style={styles.cardTitle}>Per-user completion history</Text>
          <Spacer size="small" />
          {history.length === 0 ? (
            <Text style={styles.empty}>No completion history yet.</Text>
          ) : (
            history.map((row) => (
              <View key={row.userId} style={styles.card}>
                <Text style={styles.cardTitle}>{row.displayName || row.userId}</Text>
                <Text style={styles.cardText}>Completed: {row.completedCount}</Text>
                <Text style={styles.cardText}>In progress: {row.inProgressCount}</Text>
                <Text style={styles.cardText}>Pending: {row.pendingCount}</Text>
                <Spacer size="small" />
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(6, Math.round((row.completedCount / maxCompleted) * 100))}%`,
                        backgroundColor: '#2E7D32',
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}

          <Spacer size="medium" />
          <Button title="Refresh" onPress={loadAnalytics} variant="standard" />
          <Spacer size="large" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOURS.white },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOURS.white,
  },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  content: { marginHorizontal: 20 },
  heading: { fontFamily: 'Inter-Bold', fontSize: 28, color: COLOURS.black },
  subheading: { fontFamily: 'Inter', fontSize: 15, color: COLOURS.gray[500], lineHeight: 22 },
  card: {
    backgroundColor: COLOURS.gray[100],
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { fontFamily: 'Inter-Bold', fontSize: 14, color: COLOURS.black },
  cardText: { fontFamily: 'Inter', fontSize: 13, color: COLOURS.black, marginTop: 2 },
  barRow: { marginBottom: 8 },
  barLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: COLOURS.black, marginBottom: 4 },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: COLOURS.gray[300],
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  empty: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.gray[700] },
});
