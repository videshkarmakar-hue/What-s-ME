import React, { useEffect } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
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

/**
 * Mandatory, non-dismissible App Update screen.
 * It never opens GitHub: an APK asset is downloaded and installed in-app,
 * and releases without an APK simply show an in-app message.
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
  const { theme } = useTheme();

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

  const statusText = isInstalling
    ? 'Opening installer…'
    : isDownloading
      ? `Downloading update… ${progress}%`
      : isError
        ? 'Download failed'
        : hasNoApk
          ? 'Direct download unavailable'
          : 'Ready to install';

  return (
    <SafeAreaView
      style={[styles.overlay, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroIcon,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialIcon name="update" size={38} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>App Update</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          A new version of What&apos;s ME is available. This update is required
          to continue.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.versionRow}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
              New version
            </Text>
            <Text style={[styles.version, { color: theme.text }]}>
              {release.version}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
            What&apos;s new
          </Text>
          <Text style={[styles.notes, { color: theme.text }]}>
            {release.notes.trim() || 'Bug fixes and performance improvements.'}
          </Text>
        </View>

        {!hasNoApk && (
          <View style={styles.progressBlock}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${isInstalling ? 100 : progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.status, { color: theme.textSecondary }]}>
              {statusText}
            </Text>
          </View>
        )}

        {hasNoApk && (
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <MaterialIcon
              name="information-outline"
              size={24}
              color={theme.warning}
            />
            <Text style={[styles.noticeTitle, { color: theme.text }]}>
              No direct APK in this release
            </Text>
            <Text style={[styles.noticeBody, { color: theme.textSecondary }]}>
              {statusText}. A direct download isn&apos;t available for this
              release, so we won&apos;t open GitHub. Please check again later.
            </Text>
          </View>
        )}

        {isError && (
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error ?? 'Something went wrong while downloading the update.'}
          </Text>
        )}

        {hasNoApk ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onRecheck}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Check again</Text>
          </TouchableOpacity>
        ) : isDownloading || isInstalling ? (
          <View
            style={[
              styles.buttonDisabled,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.textSecondary }]}>
              {statusText}
            </Text>
          </View>
        ) : isError ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onRetry}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Retry download</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
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
            <Text style={styles.buttonText}>Install update</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          This update cannot be skipped. The app will stay on this screen until
          the new version is installed.
        </Text>
      </ScrollView>
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
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 28,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  version: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  progressBlock: {
    marginBottom: 22,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  status: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginBottom: 22,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 20,
  },
});

export default AppUpdateScreen;
