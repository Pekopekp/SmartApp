import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/colors';
import type { SensorStatus } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

interface Props {
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradientColors: [string, string];
  status?: SensorStatus;
  subtitle?: string;
}

const STATUS_COLORS: Record<SensorStatus, string> = {
  normal: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

const SensorCard: React.FC<Props> = ({
  title,
  value,
  unit,
  icon,
  gradientColors,
  status = 'normal',
  subtitle,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const statusColor = STATUS_COLORS[status];

  // Pulse dot when in danger/warning
  useEffect(() => {
    if (status !== 'normal') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      dotOpacity.setValue(1);
    }
  }, [status, dotOpacity]);

  // Subtle scale bounce on value change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [value, pulseAnim]);

  const formattedValue =
    typeof value === 'number'
      ? Number.isInteger(value)
        ? String(value)
        : value.toFixed(2)
      : String(value);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#101C30', '#080E1C']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Status dot */}
        <Animated.View
          style={[styles.statusDot, { backgroundColor: statusColor, opacity: dotOpacity }]}
        />

        {/* Icon */}
        <LinearGradient
          colors={gradientColors}
          style={styles.iconCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon} size={20} color="#FFF" />
        </LinearGradient>

        {/* Value */}
        <Animated.Text style={[styles.value, { transform: [{ scale: pulseAnim }] }]}>
          {formattedValue}
        </Animated.Text>
        <Text style={styles.unit}>{unit}</Text>

        {/* Labels */}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {/* Bottom accent bar */}
        <LinearGradient
          colors={gradientColors}
          style={styles.accentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 160,
  },
  statusDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
});

export default SensorCard;
