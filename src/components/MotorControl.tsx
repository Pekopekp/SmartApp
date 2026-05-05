import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';

const MotorControl: React.FC = () => {
  const { motorStatus, mode, setMode, toggleMotor, isFetchingMotor } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isOn = motorStatus === 'ON';

  useEffect(() => {
    if (isOn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [isOn, pulseAnim, glowAnim, rotateAnim]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] });
  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      {/* Title Row */}
      <View style={styles.titleRow}>
        <View style={styles.titleIcon}>
          <Ionicons name="hardware-chip-outline" size={14} color={colors.primary} />
        </View>
        <Text style={styles.titleText}>Motor Control</Text>
        <View style={[styles.firebaseBadge]}>
          <View style={[styles.fbDot, { backgroundColor: colors.online }]} />
          <Text style={styles.fbText}>Firebase</Text>
        </View>
      </View>

      {/* Motor Orb */}
      <View style={styles.orbSection}>
        {/* Outer glow ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              backgroundColor: isOn ? colors.success : colors.textMuted,
            },
          ]}
        />
        {/* Spinning ring */}
        {isOn && (
          <Animated.View style={[styles.spinRing, { transform: [{ rotate: spin }] }]} />
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={isOn ? colors.gradMotorOn : colors.gradMotorOff}
            style={styles.orb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={isOn ? 'flash' : 'flash-off'} size={38} color="#FFF" />
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.motorLabel, { color: isOn ? colors.success : colors.textSecondary }]}>
          MOTOR {motorStatus}
        </Text>
        <View style={styles.modeTag}>
          <Ionicons
            name={mode === 'AUTO' ? 'settings-outline' : 'hand-left-outline'}
            size={11}
            color={colors.textSecondary}
          />
          <Text style={styles.modeTagText}>
            {mode === 'AUTO' ? 'Auto Control' : 'Manual Control'}
          </Text>
        </View>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeRow}>
        {(['AUTO', 'MANUAL'] as const).map((m) => {
          const active = mode === m;
          const gradColors: [string, string] =
            m === 'AUTO'
              ? [colors.secondary, colors.primary]
              : [colors.accentWarm, colors.danger];
          const iconName = m === 'AUTO' ? 'settings-outline' : 'hand-left-outline';

          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.8}
            >
              {active ? (
                <LinearGradient
                  colors={gradColors}
                  style={styles.modeBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name={iconName} size={13} color="#FFF" />
                  <Text style={styles.modeBtnTextActive}>{m}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.modeBtnInner}>
                  <Ionicons name={iconName} size={13} color={colors.textMuted} />
                  <Text style={styles.modeBtnText}>{m}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Toggle Button */}
      <TouchableOpacity
        onPress={toggleMotor}
        disabled={isFetchingMotor || mode === 'AUTO'}
        activeOpacity={0.85}
        style={[styles.toggleBtn, mode === 'AUTO' && styles.toggleBtnDisabled]}
      >
        <LinearGradient
          colors={
            mode === 'AUTO'
              ? [colors.textMuted, colors.textMuted]
              : isOn
              ? ['#DC2626', '#991B1B']
              : ['#16A34A', '#15803D']
          }
          style={styles.toggleBtnInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isFetchingMotor ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="power" size={18} color="#FFF" />
              <Text style={styles.toggleText}>
                {mode === 'AUTO' ? 'Auto Controlled' : isOn ? 'Turn OFF Motor' : 'Turn ON Motor'}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
  },
  titleIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  firebaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgInner,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fbDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  fbText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orbSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: -13,
    left: -13,
    zIndex: 0,
  },
  spinRing: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 2,
    borderColor: colors.success,
    top: -9,
    left: -9,
    zIndex: 0,
    opacity: 0.35,
  },
  orb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  motorLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 3,
    marginTop: spacing.lg,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  modeTagText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: {
    borderColor: 'transparent',
  },
  modeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  modeBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  modeBtnTextActive: {
    fontSize: typography.sizes.sm,
    color: '#FFF',
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  toggleBtn: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  toggleBtnDisabled: {
    opacity: 0.45,
  },
  toggleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
  },
  toggleText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    letterSpacing: 0.5,
  },
});

export default MotorControl;
