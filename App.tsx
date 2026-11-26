/**
 * WhatsApp Status Downloader
 * Beautiful dark UI with swipeable tabs
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  BackHandler,
  Dimensions,
  Easing,
  Linking,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import StatusListScreen from './src/screens/StatusListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import HelpScreen from './src/screens/HelpScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { FeedbackProvider } from './src/context/FeedbackContext';

type TabType = 'status' | 'saved' | 'settings' | 'about' | 'help';
type MediaType = 'images' | 'videos';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.2;
const TAB_WIDTH = width / 2;
const SLIDE_DURATION = 340;

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <FeedbackProvider>
            <AppContent />
          </FeedbackProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [activeMedia, setActiveMedia] = useState<MediaType>('images');
  const [reloadTick, setReloadTick] = useState<number>(Date.now());
  const [mediaBadgeCount, setMediaBadgeCount] = useState(0);
  const activeMediaRef = useRef<MediaType>(activeMedia);
  const mediaProgress = useRef(
    new Animated.Value(activeMedia === 'images' ? 1 : 0),
  ).current;
  const isAnimating = useRef(false);
  const insets = useSafeAreaInsets();
  const lastPrimaryTabRef = useRef<TabType>('status');
  const { theme, isDark } = useTheme();
  const activeColor = theme.primary;
  const inactiveColor = theme.textSecondary;
  const navIdleCircleColor = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(17, 27, 33, 0.06)';
  const navActiveCircleColor = isDark
    ? 'rgba(0, 168, 132, 0.15)'
    : 'rgba(0, 168, 132, 0.12)';
  const navActiveColor = '#00A884';
  const navIdleIconColor = isDark
    ? 'rgba(255, 255, 255, 0.5)'
    : 'rgba(17, 27, 33, 0.45)';
  const navIdleLabelColor = isDark
    ? 'rgba(255, 255, 255, 0.6)'
    : 'rgba(17, 27, 33, 0.55)';
  const { t } = useLanguage();

  const imagesLabelColor = mediaProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  const videosLabelColor = mediaProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [activeColor, inactiveColor],
  });

  const tabIndicatorTranslate = mediaProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [TAB_WIDTH, 0],
  });

  const contentTranslateX = useMemo(
    () =>
      mediaProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, 0],
      }),
    [mediaProgress],
  );
  const imagePointerEvents = activeMedia === 'images' ? 'auto' : 'none';
  const videoPointerEvents = activeMedia === 'videos' ? 'auto' : 'none';

  useEffect(() => {
    activeMediaRef.current = activeMedia;
  }, [activeMedia]);

  useEffect(() => {
    // Only the two primary tabs are valid "return" targets. about/help/settings
    // are secondary screens reached from settings, so we must not remember them
    // here or backing out of settings would loop back into them.
    if (activeTab === 'status' || activeTab === 'saved') {
      lastPrimaryTabRef.current = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    // The Saved screen presents the saved images archive by default.
    if (activeTab === 'saved') {
      setActiveMedia('images');
    }
  }, [activeTab]);

  const animateProgressTo = (value: number, onComplete?: () => void) => {
    mediaProgress.stopAnimation();
    isAnimating.current = true;
    Animated.timing(mediaProgress, {
      toValue: value,
      duration: SLIDE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      isAnimating.current = false;
      if (onComplete) {
        onComplete();
      }
    });
  };

  const shouldCaptureHorizontalSwipe = (gestureState: {
    dx: number;
    dy: number;
  }) => {
    const { dx, dy } = gestureState;
    const currentMedia = activeMediaRef.current;

    // Must be horizontal and significant
    if (Math.abs(dx) <= 10 || Math.abs(dy) > Math.abs(dx) * 0.5) {
      return false;
    }

    // Swipe left when on images (to videos)
    if (dx < 0 && currentMedia === 'images') {
      return true;
    }

    // Swipe right when on videos (to images)
    if (dx > 0 && currentMedia === 'videos') {
      return true;
    }

    return false;
  };

  const animateMediaChange = (nextMedia: MediaType) => {
    if (nextMedia === activeMediaRef.current || isAnimating.current) {
      return;
    }

    activeMediaRef.current = nextMedia;
    setActiveMedia(nextMedia);
    animateProgressTo(nextMedia === 'images' ? 1 : 0);
  };

  const handleMediaTabPress = (target: MediaType) => {
    animateMediaChange(target);
  };

  const openWhatsApp = async () => {
    try {
      const appScheme = 'whatsapp://app';
      const canOpenApp = await Linking.canOpenURL(appScheme);
      if (canOpenApp) {
        await Linking.openURL(appScheme);
        return;
      }
      const composeScheme = 'whatsapp://send?text=%20';
      const canOpenCompose = await Linking.canOpenURL(composeScheme);
      if (canOpenCompose) {
        await Linking.openURL(composeScheme);
        return;
      }
      const playStoreUrl = 'market://details?id=com.whatsapp';
      const canOpenStore = await Linking.canOpenURL(playStoreUrl);
      if (canOpenStore) {
        await Linking.openURL(playStoreUrl);
        return;
      }
      Alert.alert('WhatsApp not found', 'Please install WhatsApp to continue.');
    } catch {
      Alert.alert('Error', 'Unable to open WhatsApp.');
    }
  };

  // Pan responder for smooth swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        shouldCaptureHorizontalSwipe(gestureState),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        shouldCaptureHorizontalSwipe(gestureState),
      onPanResponderGrant: () => {
        if (isAnimating.current) {
          mediaProgress.stopAnimation(() => {
            isAnimating.current = false;
          });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;

        const { dx } = gestureState;
        const currentMedia = activeMediaRef.current;

        if (currentMedia === 'images' && dx < 0) {
          const progress = Math.min(Math.abs(dx) / width, 1);
          mediaProgress.setValue(Math.max(1 - progress, 0));
        }

        if (currentMedia === 'videos' && dx > 0) {
          const progress = Math.min(Math.abs(dx) / width, 1);
          mediaProgress.setValue(Math.min(progress, 1));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating.current) return;

        const { dx, vx } = gestureState;
        const currentMedia = activeMediaRef.current;
        const shouldSwipe =
          Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5;

        if (shouldSwipe) {
          if (dx < 0 && currentMedia === 'images') {
            animateMediaChange('videos');
            return;
          }

          if (dx > 0 && currentMedia === 'videos') {
            animateMediaChange('images');
            return;
          }
        }

        animateProgressTo(currentMedia === 'images' ? 1 : 0);
      },
      onPanResponderTerminate: () => {
        animateProgressTo(activeMediaRef.current === 'images' ? 1 : 0);
      },
    }),
  ).current;

  // Auto reload when app becomes active (opened or returned to foreground)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setReloadTick(Date.now());
      }
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'about' || activeTab === 'help') {
        setActiveTab('settings');
        return true;
      }
      if (activeTab === 'settings') {
        setActiveTab(lastPrimaryTabRef.current);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => subscription.remove();
  }, [activeTab]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <StatusBar
        backgroundColor={theme.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        {(activeTab === 'status' || activeTab === 'saved') && (
          <View
            style={[
              styles.header,
              activeTab === 'saved' && styles.headerSaved,
            ]}
          >
            {activeTab === 'saved' ? (
              <Text style={styles.headerTitleSaved}>Saved</Text>
            ) : (
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>What's ME</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerActionButton}
                    onPress={openWhatsApp}
                    accessibilityRole="button"
                    accessibilityLabel="Direct Chat"
                  >
                    <MaterialIcon name="chat" size={16} color="#8B9E96" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerActionButton}
                    onPress={() => setReloadTick(Date.now())}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh media"
                  >
                    <Icon name="reload" size={16} color="#8B9E96" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab !== 'settings' &&
          activeTab !== 'about' &&
          activeTab !== 'help' && (
            <>
              {activeTab === 'saved' ? (
                <View style={styles.segmentedSaved}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedSavedTab,
                      activeMedia === 'images' && styles.segmentedSavedActive,
                    ]}
                    onPress={() => handleMediaTabPress('images')}
                    accessibilityRole="button"
                    accessibilityLabel="Images"
                  >
                    <MaterialIcon
                      name="image"
                      size={16}
                      color={
                        activeMedia === 'images'
                          ? '#00A884'
                          : 'rgba(255, 255, 255, 0.5)'
                      }
                    />
                    <Text
                      style={[
                        styles.segmentedSavedText,
                        activeMedia === 'images'
                          ? styles.segmentedSavedActiveText
                          : styles.segmentedSavedIdleText,
                      ]}
                    >
                      IMAGES
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentedSavedTab,
                      activeMedia === 'videos' && styles.segmentedSavedActive,
                    ]}
                    onPress={() => handleMediaTabPress('videos')}
                    accessibilityRole="button"
                    accessibilityLabel="Videos"
                  >
                    <MaterialIcon
                      name="play_circle_outline"
                      size={16}
                      color={
                        activeMedia === 'videos'
                          ? '#00A884'
                          : 'rgba(255, 255, 255, 0.5)'
                      }
                    />
                    <Text
                      style={[
                        styles.segmentedSavedText,
                        activeMedia === 'videos'
                          ? styles.segmentedSavedActiveText
                          : styles.segmentedSavedIdleText,
                      ]}
                    >
                      VIDEOS
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
              <View style={styles.mediaTabs}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.tabIndicator,
                    {
                      width: TAB_WIDTH,
                      backgroundColor: '#1E332D',
                      transform: [{ translateX: tabIndicatorTranslate }],
                    },
                  ]}
                />
                <TouchableOpacity
                  style={styles.mediaTab}
                  onPress={() => handleMediaTabPress('images')}
                  accessibilityRole="button"
                  accessibilityLabel={t('tabs.imagesAccessibility')}
                >
                  <MaterialIcon
                    name="image"
                    size={18}
                    color={activeMedia === 'images' ? activeColor : inactiveColor}
                    style={styles.tabIcon}
                  />
                  <Animated.Text
                    style={[styles.mediaTabText, { color: imagesLabelColor }]}
                  >
                    {t('tabs.images')}
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaTab}
                  onPress={() => handleMediaTabPress('videos')}
                  accessibilityRole="button"
                  accessibilityLabel={t('tabs.videosAccessibility')}
                >
                  <MaterialIcon
                    name="play_circle_outline"
                    size={18}
                    color={activeMedia === 'videos' ? activeColor : inactiveColor}
                    style={styles.tabIcon}
                  />
                  <Animated.Text
                    style={[styles.mediaTabText, { color: videosLabelColor }]}
                  >
                    {t('tabs.videos')}
                  </Animated.Text>
                  {activeMedia === 'videos' && mediaBadgeCount > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{mediaBadgeCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              )}

              <View style={styles.content} {...panResponder.panHandlers}>
                <Animated.View
                  style={[
                    styles.contentSlider,
                    { transform: [{ translateX: contentTranslateX }] },
                  ]}
                >
                  <View
                    pointerEvents={imagePointerEvents}
                    style={styles.contentPage}
                  >
                    <StatusListScreen
                      type="whatsapp"
                      mediaFilter="images"
                      activeTab={activeTab === 'saved' ? 'saved' : 'status'}
                      reloadSignal={reloadTick}
                    />
                  </View>
                  <View
                    pointerEvents={videoPointerEvents}
                    style={styles.contentPage}
                  >
                    <StatusListScreen
                      type="whatsapp"
                      mediaFilter="videos"
                      activeTab={activeTab === 'saved' ? 'saved' : 'status'}
                      reloadSignal={reloadTick}
                      onCountChange={setMediaBadgeCount}
                    />
                  </View>
                </Animated.View>
              </View>
            </>
          )}

        {activeTab === 'settings' && (
          <View style={styles.contentStandalone}>
            <SettingsScreen
              onClose={() => setActiveTab(lastPrimaryTabRef.current)}
              onNavigateToAbout={() => setActiveTab('about')}
              onNavigateToHelp={() => setActiveTab('help')}
            />
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.contentStandalone}>
            <AboutScreen onClose={() => setActiveTab('settings')} />
          </View>
        )}

        {activeTab === 'help' && (
          <View style={styles.contentStandalone}>
            <HelpScreen onClose={() => setActiveTab('settings')} />
          </View>
        )}

        {/* Bottom Navigation */}
        {activeTab !== 'about' && activeTab !== 'help' && (
          <View
            style={[
              styles.bottomNav,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === 'status' && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab('status')}
                accessibilityRole="button"
                accessibilityLabel={t('tabs.statusAccessibility')}
              >
                <View
                  style={[
                    styles.navIconCircle,
                    {
                      backgroundColor:
                        activeTab === 'status'
                          ? navActiveCircleColor
                          : navIdleCircleColor,
                    },
                  ]}
                >
                  <MaterialIcon
                    name="update"
                    size={22}
                    color={
                      activeTab === 'status' ? navActiveColor : navIdleIconColor
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.navText,
                    {
                      color:
                        activeTab === 'status'
                          ? navActiveColor
                          : navIdleLabelColor,
                    },
                  ]}
                >
                  {t('tabs.status')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === 'saved' && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab('saved')}
                accessibilityRole="button"
                accessibilityLabel={t('tabs.savedAccessibility')}
              >
                <View
                  style={[
                    styles.navIconCircle,
                    {
                      backgroundColor:
                        activeTab === 'saved'
                          ? navActiveCircleColor
                          : navIdleCircleColor,
                    },
                  ]}
                >
                  <MaterialIcon
                    name="file_download"
                    size={20}
                    color={
                      activeTab === 'saved' ? navActiveColor : navIdleIconColor
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.navText,
                    {
                      color:
                        activeTab === 'saved'
                          ? navActiveColor
                          : navIdleLabelColor,
                    },
                  ]}
                >
                  {t('tabs.saved')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeTab === 'settings' && styles.navButtonActive,
                ]}
                onPress={() => setActiveTab('settings')}
                accessibilityRole="button"
                accessibilityLabel={t('tabs.settingsAccessibility')}
              >
                <View
                  style={[
                    styles.navIconCircle,
                    {
                      backgroundColor:
                        activeTab === 'settings'
                          ? navActiveCircleColor
                          : navIdleCircleColor,
                    },
                  ]}
                >
                  <MaterialIcon
                    name="settings"
                    size={20}
                    color={
                      activeTab === 'settings'
                        ? navActiveColor
                        : navIdleIconColor
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.navText,
                    {
                      color:
                        activeTab === 'settings'
                          ? navActiveColor
                          : navIdleLabelColor,
                    },
                  ]}
                >
                  {t('tabs.settings')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.homeIndicator}>
              <View style={styles.homeIndicatorBar} />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1A16',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F1A16',
  },
  header: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSaved: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerTitleSaved: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#162420',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedSaved: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentedSavedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  segmentedSavedActive: {
    borderBottomColor: '#00A884',
  },
  segmentedSavedText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  segmentedSavedActiveText: {
    color: '#00A884',
  },
  segmentedSavedIdleText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  mediaTabs: {
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#162420',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  mediaTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 10,
  },
  tabIcon: {
    marginRight: 4,
  },
  mediaTabText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: TAB_WIDTH,
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#1E332D',
    pointerEvents: 'none',
  },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  content: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  contentStandalone: {
    flex: 1,
  },
  contentSlider: {
    flexDirection: 'row',
    flex: 1,
    width: width * 2,
    height: '100%',
  },
  contentPage: {
    width,
    height: '100%',
  },
  bottomNav: {
    flexDirection: 'column',
    backgroundColor: '#0F1A16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navRow: {
    flexDirection: 'row',
    width: '100%',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  navButtonActive: {},
  navIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  navTextActive: {
    color: '#10B981',
  },
  homeIndicator: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  homeIndicatorBar: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default App;
