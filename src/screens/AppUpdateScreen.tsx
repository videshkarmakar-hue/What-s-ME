import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppRelease } from '../utils/appUpdate';

export type AppUpdatePhase =
  | 'downloading'
  | 'ready'
  | 'installing'
  | 'error'
  | 'no-apk';

interface AppUpdateScreenProps {
  release: AppRelease;
  phase: AppUpdatePhase;
  progress: number;
  error: string | null;
  onInstall: () => void;
  onRetry: () => void;
  onRecheck: () => void;
}

const ACCENT = '#00C676';
const SURFACE = '#14221D';
const SURFACE_ELEVATED = '#1A2A24';
const TEXT_PRIMARY = '#F1F5F4';
const TEXT_SECONDARY = '#94A3B8';
const LABEL_MUTED = '#7E9189';

/**
 * Mandatory, non-dismissible App Update screen. It never opens GitHub:
 * an APK asset is downloaded and installed in-app, and a release without an
 * APK asset shows an in-app message instead.
 */
const AppUpdateScreen: React.FC<AppUpdateScreenProps> = ({
  release,
  phase,
  progress,
  error,
  onInstall,
  onRetry,
  onRecheck,
}) => {
  // No back gesture/button can dismiss a required update.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, []);

  const isDownloading = phase === 'downloading';
  const isInstalling = phase === 'installing';
  const isError = phase === 'error';
  const hasNoApk = phase === 'no-apk' || !release.apk;
  const isBusy = isDownloading || isInstalling;

  const busyText = isInstalling
    ? 'Installing update…'
    : `Downloading update... ${progress}%`;

  return (
    <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero badge */}
        <View style={styles.heroBadge}>
          <MaterialIcon name="sync" size={36} color={ACCENT} />
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.title}>App Update</Text>
          <Text style={styles.subtitle}>
            A new version of What&apos;s ME is available. This update is
            required to continue.
          </Text>
        </View>

        {/* Release details card */}
        <View style={styles.card}>
          <View style={styles.versionRow}>
            <Text style={styles.cardLabel}>NEW VERSION</Text>
            <Text style={styles.version}>{release.version}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.cardLabel}>WHAT&apos;S NEW</Text>
          <Text style={styles.notes}>
            {release.notes.trim() ||
              'Bug fixes and performance improvements.'}
          </Text>
        </View>

        {/* Progress */}
        {!hasNoApk && !isError && (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${isInstalling ? 100 : progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {isBusy ? busyText : 'Ready to install'}
            </Text>
          </View>
        )}

        {/* No direct APK */}
        {hasNoApk && (
          <View style={styles.notice}>
            <MaterialIcon
              name="information-outline"
              size={24}
              color={ACCENT}
            />
            <Text style={styles.noticeTitle}>No direct APK in this release</Text>
            <Text style={styles.noticeBody}>
              A direct download isn&apos;t available for this release, so we
              won&apos;t open GitHub. Please check again later.
            </Text>
          </View>
        )}

        {isError && (
          <Text style={styles.errorText}>
            {error ?? 'Something went wrong while downloading the update.'}
          </Text>
        )}

        {/* Action */}
        {hasNoApk ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRecheck}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Check again</Text>
          </TouchableOpacity>
        ) : isError ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Retry download</Text>
          </TouchableOpacity>
        ) : isBusy ? (
          <View style={styles.busyButton}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.busyButtonText}>{busyText}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onInstall}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <MaterialIcon
              name="download"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>Install update</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Mandatory notice + home indicator */}
      <View style={styles.footer}>
        <Text style={styles.footerNotice}>
          This update cannot be skipped. The app will stay on this screen until
          the new version is installed.
        </Text>
        <View style={styles.homeIndicator}>
          <View style={styles.homeIndicatorBar} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#0F1A16',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  headline: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 310,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: SURFACE,
    padding: 20,
    marginBottom: 28,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: LABEL_MUTED,
    textTransform: 'uppercase',
  },
  version: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  notes: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#CBD5E1',
    marginTop: 8,
  },
  progressBlock: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#172620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: LABEL_MUTED,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: SURFACE,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 12,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  buttonIcon: {
    marginRight: 10,
  },
  busyButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: SURFACE_ELEVATED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  busyButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerNotice: {
    fontSize: 12,
    lineHeight: 18,
    color: LABEL_MUTED,
    textAlign: 'center',
    maxWidth: 340,
    alignSelf: 'center',
    marginBottom: 20,
  },
  homeIndicator: {
    alignItems: 'center',
  },
  homeIndicatorBar: {
    width: 144,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});

export default AppUpdateScreen;
