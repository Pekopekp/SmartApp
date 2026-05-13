import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.xl * 2 - 2;
const CHART_HEIGHT = 120;

// ─── Pure RN Sparkline Chart (no SVG / no chart-kit) ─────────────────────────
interface SparklineProps {
  data: number[];
  gradColors: [string, string];
}

const Sparkline: React.FC<SparklineProps> = ({ data, gradColors }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const BAR_GAP = 2;
  const barCount = Math.min(data.length, 20);
  const slice = data.slice(-barCount);
  const barWidth = (CHART_WIDTH - spacing.xl * 2 - BAR_GAP * (barCount - 1)) / barCount;

  return (
    <View style={[sparkStyles.container, { height: CHART_HEIGHT }]}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
        <View
          key={frac}
          style={[
            sparkStyles.gridLine,
            { bottom: frac * CHART_HEIGHT },
          ]}
        />
      ))}

      {/* Bars */}
      <View style={sparkStyles.barsRow}>
        {slice.map((val, i) => {
          const heightFrac = (val - min) / range;
          const barHeight = Math.max(4, heightFrac * CHART_HEIGHT);
          return (
            <View
              key={i}
              style={[
                sparkStyles.barWrapper,
                { width: barWidth, marginRight: i < slice.length - 1 ? BAR_GAP : 0 },
              ]}
            >
              <LinearGradient
                colors={[gradColors[0] + 'CC', gradColors[1] + '66']}
                style={[sparkStyles.bar, { height: barHeight }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const sparkStyles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barWrapper: {
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 3,
  },
});

// ─── Chart Card ──────────────────────────────────────────────────────────────
interface ChartCardProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradColors: [string, string];
  data: number[];
  unit: string;
  min: number;
  max: number;
  current: number;
}

const SensorChartCard: React.FC<ChartCardProps> = ({
  title, icon, gradColors, data, unit, min, max, current,
}) => {
  const safeData = data.length > 0 ? data : [0];
  const trend =
    safeData.length >= 2
      ? safeData[safeData.length - 1] - safeData[safeData.length - 2]
      : 0;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <LinearGradient
          colors={gradColors}
          style={styles.chartIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={13} color="#FFF" />
        </LinearGradient>

        <View style={styles.chartTitleBlock}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.chartStats}>
            <Text style={styles.statLabel}>
              MIN <Text style={styles.statValue}>{min.toFixed(1)}</Text>
            </Text>
            <Text style={styles.statDivider}>·</Text>
            <Text style={styles.statLabel}>
              MAX <Text style={styles.statValue}>{max.toFixed(1)}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.currentWrap}>
          <Text style={styles.currentValue}>
            {typeof current === 'number' ? current.toFixed(1) : current}
          </Text>
          <View style={styles.trendRow}>
            <Ionicons
              name={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove'}
              size={11}
              color={
                trend > 0 ? colors.warning : trend < 0 ? colors.primary : colors.textMuted
              }
            />
            <Text style={styles.unitTag}>{unit}</Text>
          </View>
        </View>
      </View>

      {/* Pure RN sparkline — no SVG, no chart-kit */}
      <Sparkline data={safeData} gradColors={gradColors} />
    </View>
  );
};

// ─── Tab type ─────────────────────────────────────────────────────────────────
type TabKey = 'charts' | 'table';

// ─── Screen ──────────────────────────────────────────────────────────────────
const LogsScreen: React.FC = () => {
  const { history, sensorData } = useApp();
  const [tab, setTab] = useState<TabKey>('charts');

  const recentLogs = [...history].reverse().slice(0, 30);

  const charts: ChartCardProps[] = [
    {
      title: 'pH Level', icon: 'flask-outline', gradColors: colors.gradPh,
      data: history.map((h) => h.ph), unit: 'pH',
      min: history.length ? Math.min(...history.map((h) => h.ph)) : 0,
      max: history.length ? Math.max(...history.map((h) => h.ph)) : 0,
      current: sensorData.ph,
    },
    {
      title: 'Conductivity', icon: 'pulse-outline', gradColors: colors.gradEc,
      data: history.map((h) => h.ec), unit: 'mS/cm',
      min: history.length ? Math.min(...history.map((h) => h.ec)) : 0,
      max: history.length ? Math.max(...history.map((h) => h.ec)) : 0,
      current: sensorData.ec,
    },
    {
      title: 'Gas Level (MQ2)', icon: 'cloud-outline', gradColors: colors.gradGas,
      data: history.map((h) => h.gas), unit: 'ppm',
      min: history.length ? Math.min(...history.map((h) => h.gas)) : 0,
      max: history.length ? Math.max(...history.map((h) => h.gas)) : 0,
      current: sensorData.gas,
    },
    {
      title: 'Temperature', icon: 'thermometer-outline', gradColors: colors.gradTemp,
      data: history.map((h) => h.temperature), unit: '°C',
      min: history.length ? Math.min(...history.map((h) => h.temperature)) : 0,
      max: history.length ? Math.max(...history.map((h) => h.temperature)) : 0,
      current: sensorData.temperature,
    },
    {
      title: 'Humidity', icon: 'water-outline', gradColors: colors.gradHumidity,
      data: history.map((h) => h.humidity), unit: '%',
      min: history.length ? Math.min(...history.map((h) => h.humidity)) : 0,
      max: history.length ? Math.max(...history.map((h) => h.humidity)) : 0,
      current: sensorData.humidity,
    },
    {
      title: 'Water Temperature', icon: 'thermometer-outline', gradColors: colors.gradWater,
      data: history.map((h) => h.waterTemp), unit: '°C',
      min: history.length ? Math.min(...history.map((h) => h.waterTemp)) : 0,
      max: history.length ? Math.max(...history.map((h) => h.waterTemp)) : 0,
      current: sensorData.waterTemp,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <LinearGradient
        colors={[colors.bg, colors.bgCard]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View>
          <Text style={styles.headerTitle}>Sensor Logs</Text>
          <Text style={styles.headerSub}>
            {history.length} readings · Firebase synced
          </Text>
        </View>
        <View style={styles.tabRow}>
          {(['charts', 'table'] as TabKey[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={t === 'charts' ? 'bar-chart-outline' : 'list-outline'}
                size={13}
                color={tab === t ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'charts' ? 'Charts' : 'Table'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'charts' ? (
          <>
            <Text style={styles.sectionTitle}>Historical Charts</Text>
            {charts.map((c) => (
              <SensorChartCard key={c.title} {...c} />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Recent Readings</Text>
            <View style={styles.logTable}>
              <View style={[styles.logRow, styles.logHeaderRow]}>
                {['Time', 'pH', 'EC', 'Gas', 'Temp', 'H₂O'].map((h) => (
                  <Text key={h} style={styles.logHeaderCell}>{h}</Text>
                ))}
              </View>
              {recentLogs.length > 0 ? (
                recentLogs.map((log, index) => {
                  const time = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <View
                      key={index}
                      style={[
                        styles.logRow,
                        index % 2 === 0 ? styles.logRowEven : styles.logRowOdd,
                      ]}
                    >
                      <Text style={styles.logCellTime}>{time}</Text>
                      <Text style={styles.logCell}>{log.ph.toFixed(1)}</Text>
                      <Text style={styles.logCell}>{log.ec.toFixed(1)}</Text>
                      <Text style={styles.logCell}>{log.gas}</Text>
                      <Text style={styles.logCell}>{log.temperature.toFixed(1)}</Text>
                      <Text style={styles.logCell}>{log.waterTemp.toFixed(1)}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No data available yet</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.bgInner,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  tabBtnActive: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.semibold,
  },
  tabTextActive: { color: colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: 110 },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitleBlock: { flex: 1 },
  chartTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  chartStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  statValue: {
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  statDivider: { color: colors.textMuted, fontSize: typography.sizes.xs },
  currentWrap: { alignItems: 'flex-end' },
  currentValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  unitTag: { fontSize: typography.sizes.xs, color: colors.textMuted },
  logTable: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  logRow: { flexDirection: 'row' },
  logHeaderRow: {
    backgroundColor: colors.bgInner,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logRowEven: { backgroundColor: colors.bgCard },
  logRowOdd: { backgroundColor: '#080E1C' },
  logHeaderCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  logCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logCellTime: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  emptyRow: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

export default LogsScreen;
