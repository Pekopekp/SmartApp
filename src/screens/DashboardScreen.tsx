import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';
import SensorCard from '../components/SensorCard';
import MotorControl from '../components/MotorControl';
import AlertBanner from '../components/AlertBanner';
import type { SensorStatus, Thresholds, SensorReading } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getSensorStatus = (
  key: keyof Omit<SensorReading, 'timestamp'>,
  value: number,
  thresholds: Thresholds
): SensorStatus => {
  switch (key) {
    case 'ph':
      if (value < thresholds.phMin || value > thresholds.phMax) return 'danger';
      if (value < thresholds.phMin + 0.3 || value > thresholds.phMax - 0.3) return 'warning';
      return 'normal';
    case 'ec':
      if (value > thresholds.ecMax) return 'danger';
      if (value > thresholds.ecMax * 0.85) return 'warning';
      return 'normal';
    case 'gas':
      if (value > thresholds.gasMax) return 'danger';
      if (value > thresholds.gasMax * 0.8) return 'warning';
      return 'normal';
    case 'temperature':
      if (value > thresholds.tempMax) return 'danger';
      if (value > thresholds.tempMax * 0.9) return 'warning';
      return 'normal';
    case 'humidity':
      if (value > thresholds.humidityMax) return 'warning';
      return 'normal';
    case 'waterTemp':
      if (value > thresholds.waterTempMax) return 'danger';
      if (value > thresholds.waterTempMax * 0.9) return 'warning';
      return 'normal';
    default:
      return 'normal';
  }
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const DashboardScreen: React.FC = () => {
  const { sensorData, thresholds, alerts, dismissAlert, isConnected, lastUpdated } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const timeStr = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const sensorCards: Array<{
    key: keyof Omit<SensorReading, 'timestamp'>;
    title: string;
    value: number;
    unit: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    gradientColors: [string, string];
    subtitle: string;
  }> = [
    {
      key: 'ph',
      title: 'pH Level',
      value: sensorData.ph,
      unit: 'pH',
      icon: 'flask-outline',
      gradientColors: colors.gradPh,
      subtitle: `Range: ${thresholds.phMin}–${thresholds.phMax}`,
    },
    {
      key: 'ec',
      title: 'Conductivity',
      value: sensorData.ec,
      unit: 'mS/cm',
      icon: 'pulse-outline',
      gradientColors: colors.gradEc,
      subtitle: `Max: ${thresholds.ecMax}`,
    },
    {
      key: 'gas',
      title: 'Gas (MQ2)',
      value: sensorData.gas,
      unit: 'ppm',
      icon: 'cloud-outline',
      gradientColors: colors.gradGas,
      subtitle: `Max: ${thresholds.gasMax}`,
    },
    {
      key: 'temperature',
      title: 'Temperature',
      value: sensorData.temperature,
      unit: '°C',
      icon: 'thermometer-outline',
      gradientColors: colors.gradTemp,
      subtitle: `Humidity: ${sensorData.humidity?.toFixed(1)}%`,
    },
    {
      key: 'humidity',
      title: 'Humidity',
      value: sensorData.humidity,
      unit: '%RH',
      icon: 'water-outline',
      gradientColors: colors.gradHumidity,
      subtitle: `Max: ${thresholds.humidityMax}%`,
    },
    {
      key: 'waterTemp',
      title: 'Water Temp',
      value: sensorData.waterTemp,
      unit: '°C',
      icon: 'thermometer-outline',
      gradientColors: colors.gradWater,
      subtitle: `Max: ${thresholds.waterTempMax}°C`,
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
          <Text style={styles.headerTitle}>SmartIoT</Text>
          <Text style={styles.headerSub}>Monitoring & Control System</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Firebase pill */}
          <View style={styles.firebasePill}>
            <Ionicons name="flame-outline" size={11} color="#FFA000" />
            <Text style={styles.firebaseText}>Firebase</Text>
          </View>
          {/* Status pill */}
          <TouchableOpacity style={styles.statusPill} activeOpacity={0.8}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? colors.online : colors.offline },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? colors.online : colors.offline },
              ]}
            >
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Last updated bar */}
        <View style={styles.updatedRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.updatedText}>Updated: {timeStr}</Text>
        </View>

        {/* Alerts */}
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

        {/* Motor Control */}
        <MotorControl />

        {/* Sensor Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sensor Readings</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{sensorCards.length} sensors</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {sensorCards.map((card) => (
            <SensorCard
              key={card.key}
              title={card.title}
              value={card.value}
              unit={card.unit}
              icon={card.icon}
              gradientColors={card.gradientColors}
              status={getSensorStatus(card.key, card.value, thresholds)}
              subtitle={card.subtitle}
            />
          ))}
        </View>

        {/* Raw Payload */}
        <View style={styles.rawCard}>
          <View style={styles.rawHeader}>
            <View style={styles.rawIconWrap}>
              <Ionicons name="code-slash-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.rawTitle}>Firebase Realtime Payload</Text>
            <Text style={styles.rawPath}>sensors/latest</Text>
          </View>
          <Text style={styles.rawJson}>
            {JSON.stringify(
              {
                ph: sensorData.ph,
                ec: sensorData.ec,
                gas: sensorData.gas,
                temperature: sensorData.temperature,
                humidity: sensorData.humidity,
                waterTemp: sensorData.waterTemp,
                timestamp: sensorData.timestamp,
              },
              null,
              2
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  firebasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,160,0,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,160,0,0.2)',
  },
  firebaseText: {
    fontSize: 9,
    color: '#FFA000',
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgInner,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 110,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  updatedText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  sectionBadge: {
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  sectionBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rawCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  rawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rawIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rawTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  rawPath: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
    backgroundColor: colors.bgInner,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  rawJson: {
    fontFamily: 'monospace',
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default DashboardScreen;
