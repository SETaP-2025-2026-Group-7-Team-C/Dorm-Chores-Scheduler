import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineNotification from '../../../components/InlineNotification';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getActiveDormId } from '../../../lib/dorms';
import { supabase } from '../../../lib/supabase';

// Helper formatting functions based on your rules
const formatEntityType = (type: string) => {
  if (!type) return 'Unknown Entity';
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatAction = (action: string) => {
  if (!action) return 'Unknown action';
  return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
};

export default function AuditLogScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);
    try {
      const dormId = await getActiveDormId();
      if (!dormId) throw new Error('No active dorm found');

      // Fetch logs and join with profiles to get the actor's display name
      const { data, error } = await supabase
        .from('audit_logs')
        .select(
          `
          *,
          profiles (display_name)
        `,
        )
        .eq('dorm_id', dormId)
        .order('created_at', { ascending: false })
        .limit(50); // Optional: limits history to 50 latest to save bandwidth

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || 'Failed to load audit logs' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAuditLogs();
    }, [loadAuditLogs]),
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <View style={styles.topBar}>
        <HeaderBackButton iconName="times" />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.heading}>Audit Logs</Text>
          <Spacer size="small" />
          <Text style={styles.subheading}>Recent history and actions within your dorm.</Text>

          {notice && (
            <>
              <Spacer size="small" />
              <InlineNotification type={notice.type} text={notice.text} />
            </>
          )}

          <Spacer size="medium" />

          {isLoading ? (
            <ActivityIndicator size="large" color={COLOURS.black} style={styles.loader} />
          ) : logs.length === 0 ? (
            <Text style={styles.empty}>No recent activity found.</Text>
          ) : (
            logs.map((log) => {
              // Extract display name or fallback gracefully if actor is null
              const actorProfile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
              const actorName = actorProfile?.display_name || 'System / Unknown User';

              const dateString = new Date(log.created_at).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={log.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{actorName}</Text>
                    <Text style={styles.dateText}>{dateString}</Text>
                  </View>
                  <Spacer size="small" />
                  <Text style={styles.cardText}>
                    <Text style={styles.boldText}>{formatAction(log.action)} </Text>
                    {formatEntityType(log.entity_type)}
                  </Text>
                  {log.entity_id && <Text style={styles.metaText}>Entity ID: {log.entity_id}</Text>}
                </View>
              );
            })
          )}
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
  loader: { marginTop: 40 },
  card: {
    backgroundColor: COLOURS.gray[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontFamily: 'Inter-Bold', fontSize: 14, color: COLOURS.black },
  dateText: { fontFamily: 'Inter', fontSize: 12, color: COLOURS.gray[500] },
  cardText: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.black, marginTop: 2 },
  boldText: { fontFamily: 'Inter-Bold' },
  metaText: { fontFamily: 'Inter', fontSize: 11, color: COLOURS.gray[500], marginTop: 6 },
  empty: { fontFamily: 'Inter', fontSize: 14, color: COLOURS.gray[700], marginTop: 20 },
});
