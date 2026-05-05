import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme/colors';
import type { AppAlert } from '../types';

interface Props {
  alerts: AppAlert[];
  onDismiss: (id: number) => void;
}

const AlertBanner: React.FC<Props> = ({ alerts, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alerts.length > 0) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [alerts.length, slideAnim, opacityAnim]);

  if (alerts.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      {alerts.slice(0, 2).map((alert) => (
        <View
          key={alert.id}
          style={[
            styles.banner,
            { borderLeftColor: alert.type === 'danger' ? colors.danger : colors.warning },
          ]}
        >
          <LinearGradient
            colors={
              alert.type === 'danger'
                ? ['rgba(127,29,29,0.15)', 'rgba(239,68,68,0.07)']
                : ['rgba(120,53,15,0.15)', 'rgba(245,158,11,0.07)']
            }
            style={styles.bannerInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor:
                    alert.type === 'danger'
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(249,115,22,0.15)',
                },
              ]}
            >
              <Ionicons
                name={alert.type === 'danger' ? 'alert-circle' : 'warning'}
                size={16}
                color={alert.type === 'danger' ? colors.danger : colors.warning}
              />
            </View>
            <Text style={styles.message} numberOfLines={1}>
              {alert.message}
            </Text>
            <TouchableOpacity
              onPress={() => onDismiss(alert.id)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ))}
      {alerts.length > 2 && (
        <View style={styles.moreRow}>
          <Ionicons name="ellipsis-horizontal" size={12} color={colors.textMuted} />
          <Text style={styles.moreText}>{alerts.length - 2} more alerts</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  banner: {
    borderRadius: radius.md,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInner,
    borderRadius: radius.sm,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  moreText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
});

export default AlertBanner;
