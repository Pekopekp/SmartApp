import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';
import type { Thresholds } from '../types';

// ─── Threshold Row ────────────────────────────────────────────────────────────
interface FieldDef {
  key: keyof Thresholds;
  label: string;
  unit: string;
}

interface ThresholdRowProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradColors: [string, string];
  fields: FieldDef[];
  values: Thresholds;
  onChange: (key: keyof Thresholds, val: string) => void;
}

const ThresholdRow: React.FC<ThresholdRowProps> = ({
  label, icon, gradColors, fields, values, onChange,
}) => (
  <View style={styles.thresholdCard}>
    <View style={styles.thresholdHeader}>
      <LinearGradient
        colors={gradColors}
        style={styles.thresholdIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={14} color="#FFF" />
      </LinearGradient>
      <Text style={styles.thresholdLabel}>{label}</Text>
    </View>
    <View style={styles.fieldRow}>
      {fields.map((field) => (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={String(values[field.key] ?? '')}
              onChangeText={(val) => onChange(field.key, val)}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
            />
            {field.unit ? <Text style={styles.inputUnit}>{field.unit}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  </View>
);

// ─── Screen ──────────────────────────────────────────────────────────────────
const DEFAULT_THRESHOLDS: Thresholds = {
  phMin: 6.0, phMax: 8.0, ecMax: 2.0,
  gasMax: 400, tempMax: 35, humidityMax: 80, waterTempMax: 30,
};

const SettingsScreen: React.FC = () => {
  const { thresholds, updateThresholds, mode, setMode } = useApp();
  const [local, setLocal] = useState<Thresholds>({ ...thresholds });
  const [saved, setSaved] = useState(false);
  const [autoMode, setAutoMode] = useState(mode === 'AUTO');

  const handleChange = (key: keyof Thresholds, val: string) => {
    const parsed = parseFloat(val);
    setLocal((prev) => ({ ...prev, [key]: isNaN(parsed) ? val as unknown as number : parsed }));
    setSaved(false);
  };

  const handleSave = () => {
    if (local.phMin >= local.phMax) {
      Alert.alert('Validation Error', 'pH Min must be less than pH Max.');
      return;
    }
    updateThresholds(local);
    setSaved(true);
    Alert.alert('✅ Saved', 'Threshold settings updated and synced to Firebase.');
  };

  const handleReset = () => {
    Alert.alert('Reset Defaults', 'Reset all thresholds to factory defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setLocal(DEFAULT_THRESHOLDS);
          updateThresholds(DEFAULT_THRESHOLDS);
          setSaved(true);
        },
      },
    ]);
  };

  const handleModeToggle = (val: boolean) => {
    setAutoMode(val);
    setMode(val ? 'AUTO' : 'MANUAL');
  };

  const thresholdSections: ThresholdRowProps[] = [
    {
      label: 'pH Sensor', icon: 'flask-outline', gradColors: colors.gradPh,
      fields: [
        { key: 'phMin', label: 'Min pH', unit: '' },
        { key: 'phMax', label: 'Max pH', unit: '' },
      ],
      values: local,
      onChange: handleChange,
    },
    {
      label: 'EC Sensor', icon: 'pulse-outline', gradColors: colors.gradEc,
      fields: [{ key: 'ecMax', label: 'Max EC', unit: 'mS/cm' }],
      values: local,
      onChange: handleChange,
    },
    {
      label: 'MQ2 Gas Sensor', icon: 'cloud-outline', gradColors: colors.gradGas,
      fields: [{ key: 'gasMax', label: 'Max Gas', unit: 'ppm' }],
      values: local,
      onChange: handleChange,
    },
    {
      label: 'DHT11 Temperature', icon: 'thermometer-outline', gradColors: colors.gradTemp,
      fields: [
        { key: 'tempMax', label: 'Max Temp', unit: '°C' },
        { key: 'humidityMax', label: 'Max Humidity', unit: '%' },
      ],
      values: local,
      onChange: handleChange,
    },
    {
      label: 'Water Temperature', icon: 'thermometer-outline', gradColors: colors.gradWater,
      fields: [{ key: 'waterTempMax', label: 'Max Water Temp', unit: '°C' }],
      values: local,
      onChange: handleChange,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <LinearGradient
        colors={[colors.bg, colors.bgCard]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Configure thresholds & Firebase</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              Motor auto-activates when pH, EC, Gas, or Water Temp exceed these thresholds.
              Thresholds sync to Firebase and apply to all connected devices.
            </Text>
          </View>

          {/* Motor Mode Toggle */}
          <Text style={styles.sectionTitle}>Motor Mode</Text>
          <View style={styles.modeCard}>
            <View style={styles.modeLeft}>
              <LinearGradient
                colors={autoMode ? [colors.secondary, colors.primary] : [colors.accentWarm, colors.danger]}
                style={styles.modeIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={autoMode ? 'settings-outline' : 'hand-left-outline'}
                  size={14}
                  color="#FFF"
                />
              </LinearGradient>
              <View>
                <Text style={styles.modeTitle}>{autoMode ? 'Automatic' : 'Manual'}</Text>
                <Text style={styles.modeSub}>
                  {autoMode
                    ? 'Motor controlled by sensor thresholds'
                    : 'Motor controlled manually from dashboard'}
                </Text>
              </View>
            </View>
            <Switch
              value={autoMode}
              onValueChange={handleModeToggle}
              trackColor={{ false: colors.bgInner, true: `${colors.primary}55` }}
              thumbColor={autoMode ? colors.primary : colors.textMuted}
            />
          </View>

          {/* Firebase Configuration */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Firebase Config</Text>
          <View style={styles.thresholdCard}>
            <View style={styles.thresholdHeader}>
              <LinearGradient
                colors={['#FFA000', '#FF6F00']}
                style={styles.thresholdIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flame-outline" size={14} color="#FFF" />
              </LinearGradient>
              <Text style={styles.thresholdLabel}>Realtime Database</Text>
            </View>

            {[
              { label: 'Sensor Path', value: 'sensors/latest', icon: 'hardware-chip-outline' as const },
              { label: 'Motor Path', value: 'motor/status', icon: 'flash-outline' as const },
              { label: 'Thresholds Path', value: 'config/thresholds', icon: 'options-outline' as const },
            ].map((item) => (
              <View key={item.label} style={styles.pathRow}>
                <Ionicons name={item.icon} size={12} color={colors.textMuted} />
                <Text style={styles.pathLabel}>{item.label}</Text>
                <Text style={styles.pathValue}>{item.value}</Text>
              </View>
            ))}

            <View style={styles.configNote}>
              <Ionicons name="code-slash-outline" size={12} color={colors.textMuted} />
              <Text style={styles.configNoteText}>
                Edit <Text style={styles.codeText}>src/firebase/config.ts</Text> to add your Firebase project credentials.
              </Text>
            </View>
          </View>

          {/* Thresholds */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Alert Thresholds</Text>
          {thresholdSections.map((section) => (
            <ThresholdRow key={section.label} {...section} />
          ))}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.saveBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name={saved ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={16}
                  color="#FFF"
                />
                <Text style={styles.saveText}>{saved ? 'Synced to Firebase' : 'Save & Sync'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoIconWrap: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  // Mode card
  modeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  modeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  modeSub: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 200,
  },
  // Threshold card
  thresholdCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  thresholdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thresholdIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldGroup: { flex: 1 },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInner,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  inputUnit: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  // Firebase paths
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pathLabel: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  pathValue: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontFamily: 'monospace',
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  configNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  configNoteText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    color: colors.primary,
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  resetText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  saveBtn: {
    flex: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  saveText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});

export default SettingsScreen;
