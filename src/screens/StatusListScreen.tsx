import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
  DeviceEventEmitter,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { StatusFile } from '../types';
import StatusViewer from '../components/StatusViewer';
import PermissionGuideModal from '../components/PermissionGuideModal';
import {
  getStatusFiles,
  saveStatusToGallery,
  getSavedStatusFiles,
  syncSavedStatusIds,
} from '../utils/statusManager';
import {
  requestStoragePermission,
  checkStoragePermission,
} from '../utils/permissions';
import { hasFolderAccess, requestFolderAccess } from '../utils/folderPicker';
import { useTheme } from '../context/ThemeContext';
import { useFeedback } from '../context/FeedbackContext';
import { useLanguage } from '../context/LanguageContext';

const statusCache = new Map<string, StatusFile[]>();
const savedCache = new Map<string, StatusFile[]>();

const safPermissionState: { grantedUri: string | null } = {
  grantedUri: null,
};

const SAF_PERMISSION_GRANTED_EVENT = 'saf-permission-granted';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const getOverlayIconColors = (
  isSaved: boolean,
  primaryColor: string,
): { backgroundColor: string; borderColor: string } => {
  if (isSaved) {
    return {
      backgroundColor: primaryColor,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    };
  }

  return {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  };
};

interface StatusListScreenProps {
  type: 'whatsapp' | 'business';
  mediaFilter?: 'images' | 'videos';
  activeTab?: 'status' | 'saved';
  reloadSignal?: number;
  onCountChange?: (count: number) => void;
}

const StatusListScreen: React.FC<StatusListScreenProps> = ({
  type,
  mediaFilter = 'images',
  activeTab = 'status',
  reloadSignal,
  onCountChange,
}) => {
  const { theme } = useTheme();
  const { showMessage } = useFeedback();
  const { t } = useLanguage();
  const cacheKey = `${type}-statuses`;
  const savedCacheKey = `${type}-saved`;

  const [statuses, setStatuses] = useState<StatusFile[]>(
    () => statusCache.get(cacheKey) ?? [],
  );
  const [savedStatuses, setSavedStatuses] = useState<StatusFile[]>(
    () => savedCache.get(savedCacheKey) ?? [],
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const isAwaitingPermission = useRef(false);
  const loadStatusesRef = useRef<((force?: boolean) => Promise<void>) | null>(
    null,
  );
  const savedStatusesRef = useRef<StatusFile[]>(savedStatuses);
  const savedIdsRef = useRef<Set<string>>(new Set());
  const hasCompletedInitialLoad = useRef(false);
  const isRefreshing = useRef(false);
  const statusLoadingRef = useRef(false);
  const savedLoadingRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    // If we have cached data, we're not in initial load state
    const cached =
      activeTab === 'saved'
        ? savedCache.get(savedCacheKey)
        : statusCache.get(cacheKey);
    return !cached || cached.length === 0;
  });

  const markSavedStatuses = useCallback((files: StatusFile[]) => {
    return files.map(file => {
      // Get base names for more flexible matching
      const fileBaseName = file.filename.split('.').slice(0, -1).join('.');
      const fileId = file.id;

      // Check if file is saved by matching against saved IDs
      const isSaved = Array.from(savedIdsRef.current).some(savedId => {
        // Exact match on filename or ID
        if (savedId === file.filename || savedId === fileId) {
          return true;
        }

        // Match on base name (without extension)
        if (savedId === fileBaseName) {
          return true;
        }

        // Check if savedId is a base name that matches our file
        const savedBaseName = savedId.split('.').slice(0, -1).join('.');
        if (
          savedBaseName &&
          (savedBaseName === fileBaseName || savedBaseName === fileId)
        ) {
          return true;
        }

        return false;
      });

      return {
        ...file,
        isSaved,
      };
    });
  }, []);

  useEffect(() => {
    savedStatusesRef.current = savedStatuses;
  }, [savedStatuses]);

  const loadSavedStatuses = useCallback(
    async (force = false) => {
      if (!force && savedLoadingRef.current) {
        return;
      }

      if (!force) {
        const cached = savedCache.get(savedCacheKey);
        if (cached && cached.length > 0) {
          setSavedStatuses(cached);
          setIsInitialLoad(false);
          return;
        }
      }

      try {
        savedLoadingRef.current = true;
        setSavedLoading(true);
        const saved = await getSavedStatusFiles();
        setSavedStatuses(saved);
        savedCache.set(savedCacheKey, saved);
      } catch (error) {
        console.error('❌ Error loading saved statuses:', error);
      } finally {
        savedLoadingRef.current = false;
        setSavedLoading(false);
        setIsInitialLoad(false);
      }
    },
    [savedCacheKey],
  );

  // Load and sync saved status IDs on mount and when activeTab changes
  useEffect(() => {
    const loadSavedIds = async () => {
      const savedIds = await syncSavedStatusIds();
      savedIdsRef.current = new Set(savedIds);
      console.log('🔄 Synced saved IDs:', savedIds.length);

      // Update statuses with synced saved state
      if (statuses.length > 0) {
        const updated = markSavedStatuses(statuses);
        setStatuses(updated);
        statusCache.set(cacheKey, updated);
      }
    };
    loadSavedIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Reload saved statuses when on saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedStatuses(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadSignal]);

  useEffect(() => {
    loadSavedStatuses();
  }, [loadSavedStatuses]);

  useEffect(() => {
    statusCache.set(cacheKey, statuses);
  }, [cacheKey, statuses]);

  useEffect(() => {
    savedCache.set(savedCacheKey, savedStatuses);
  }, [savedCacheKey, savedStatuses]);

  const loadStatuses = useCallback(
    async (force = false) => {
      if (!force && statusLoadingRef.current) {
        return;
      }

      // Don't reload if we're waiting for user to grant permission
      if (isAwaitingPermission.current) {
        return;
      }

      if (!force) {
        const cached = statusCache.get(cacheKey);
        if (cached && cached.length > 0) {
          const filesWithSavedState = markSavedStatuses(cached);
          setStatuses(filesWithSavedState);
          statusCache.set(cacheKey, filesWithSavedState);
          setIsInitialLoad(false);
          return;
        }
      }

      try {
        statusLoadingRef.current = true;
        setStatusLoading(true);

        let files: StatusFile[] = [];
        const isPrimaryInstance = mediaFilter === 'images';

        if (Platform.OS === 'android' && Platform.Version >= 30) {
          let safUri = await hasFolderAccess(type);

          if (safUri) {
            safPermissionState.grantedUri = safUri;
          } else if (safPermissionState.grantedUri) {
            safUri = safPermissionState.grantedUri;
          }

          if (!safUri) {
            statusLoadingRef.current = false;
            setStatusLoading(false);

            if (!isPrimaryInstance) {
              return;
            }

            // Show permission guide modal and mark that we're waiting
            if (!showPermissionGuide) {
              isAwaitingPermission.current = true;
              setShowPermissionGuide(true);
            }
            return;
          }

          files = await getStatusFiles(type);
        } else {
          const hasPermission = await checkStoragePermission();

          if (!hasPermission) {
            const granted = await requestStoragePermission();
            if (!granted) {
              statusLoadingRef.current = false;
              setStatusLoading(false);
              return;
            }
          }

          files = await getStatusFiles(type);
        }

        const filesWithSavedState = markSavedStatuses(files);
        setStatuses(filesWithSavedState);
        statusCache.set(cacheKey, filesWithSavedState);
      } catch (error) {
        console.error('❌ Error loading statuses:', error);
        showMessage({
          title: t('status.errorLoadTitle'),
          message: t('status.errorLoadMessage'),
          type: 'error',
        });
      } finally {
        statusLoadingRef.current = false;
        setStatusLoading(false);
        setIsInitialLoad(false);
      }
    },
    [
      cacheKey,
      markSavedStatuses,
      mediaFilter,
      showMessage,
      showPermissionGuide,
      type,
      t,
    ],
  );

  useEffect(() => {
    loadStatusesRef.current = loadStatuses;
  }, [loadStatuses]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      SAF_PERMISSION_GRANTED_EVENT,
      (payload: { type: 'whatsapp' | 'business'; uri: string }) => {
        if (payload?.type === type && loadStatusesRef.current) {
          loadStatusesRef.current(true);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [type]);

  useEffect(() => {
    const force = hasCompletedInitialLoad.current;
    hasCompletedInitialLoad.current = true;
    loadStatuses(force);
  }, [loadStatuses, reloadSignal]);

  const handleRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refresh operations
    if (isRefreshing.current) {
      return;
    }

    isRefreshing.current = true;
    setRefreshing(true);

    try {
      // Sync saved IDs with gallery to remove deleted files
      const savedIds = await syncSavedStatusIds();
      savedIdsRef.current = new Set(savedIds);

      if (activeTab === 'saved') {
        await loadSavedStatuses(true);
      } else {
        await loadStatuses(true);
      }
    } finally {
      isRefreshing.current = false;
      setRefreshing(false);
    }
  }, [loadStatuses, loadSavedStatuses, activeTab]);

  const handleSave = useCallback(
    async (status: StatusFile): Promise<boolean> => {
      // Don't save if already saved
      if (status.isSaved) {
        return false;
      }

      setSavingId(status.id);
      try {
        const success = await saveStatusToGallery(status);
        if (success) {
          console.log('✅ Saved successfully:', status.filename);

          // Add to saved IDs immediately
          savedIdsRef.current.add(status.id);
          savedIdsRef.current.add(status.filename);
          const baseName = status.filename.split('.').slice(0, -1).join('.');
          if (baseName) {
            savedIdsRef.current.add(baseName);
          }

          // Update UI immediately with optimistic update
          setStatuses(prev => {
            const updated = prev.map(s => {
              if (s.id === status.id) {
                return { ...s, isSaved: true };
              }
              return s;
            });
            statusCache.set(cacheKey, updated);
            return updated;
          });

          showMessage({
            title: t('status.savedTitle'),
            message: t('status.savedMessage'),
            type: 'success',
          });

          // Sync in background after a short delay to ensure file is in gallery
          setTimeout(async () => {
            console.log('🔄 Background sync starting...');
            const savedIds = await syncSavedStatusIds();
            savedIdsRef.current = new Set(savedIds);
            console.log('🔄 Background sync complete:', savedIds.length, 'IDs');

            // Re-mark all statuses with updated saved state
            setStatuses(prev => {
              const updated = markSavedStatuses(prev);
              statusCache.set(cacheKey, updated);
              return updated;
            });

            await loadSavedStatuses(true);
          }, 1000);

          return true;
        } else {
          showMessage({
            title: t('status.errorSaveTitle'),
            message: t('status.errorSaveMessage'),
            type: 'error',
          });
          return false;
        }
      } catch (error) {
        console.error('Error saving status:', error);
        showMessage({
          title: t('status.errorSaveTitle'),
          message: t('status.errorSaveMessage'),
          type: 'error',
        });
        return false;
      } finally {
        setSavingId(null);
      }
    },
    [showMessage, loadSavedStatuses, cacheKey, t, markSavedStatuses],
  );

  const filteredStatuses = useMemo(() => {
    const sourceStatuses = activeTab === 'saved' ? savedStatuses : statuses;
    return sourceStatuses.filter(status => {
      return mediaFilter === 'images'
        ? status.type === 'image'
        : status.type === 'video';
    });
  }, [activeTab, savedStatuses, statuses, mediaFilter]);

  useEffect(() => {
    onCountChange?.(filteredStatuses.length);
  }, [filteredStatuses, onCountChange]);

  useEffect(() => {
    if (!selectedStatus) {
      return;
    }

    const nextIndex = filteredStatuses.findIndex(
      status => status.id === selectedStatus.id,
    );

    if (nextIndex === -1) {
      setSelectedStatus(null);
      return;
    }

    if (nextIndex !== selectedIndex) {
      setSelectedIndex(nextIndex);
    }
  }, [filteredStatuses, selectedIndex, selectedStatus]);

  const listLoading = activeTab === 'saved' ? savedLoading : statusLoading;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatusPress = useCallback((status: StatusFile, index: number) => {
    setSelectedStatus(status);
    setSelectedIndex(index);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: StatusFile; index: number }) => (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleStatusPress(item, index)}
          style={styles.cardPressable}
        >
          <Image source={{ uri: item.uri }} style={styles.cardImage} />
          {item.type === 'video' && (
            <LinearGradient
              colors={['#182622', '#0E1513']}
              style={styles.cardBackdrop}
            >
              <Image source={{ uri: item.uri }} style={styles.cardImage} />
            </LinearGradient>
          )}
          {item.type === 'video' && (
            <View style={styles.playButtonContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handleStatusPress(item, index)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={`Play video from ${formatTime(item.timestamp)}`}
              >
                <MaterialIcon name="play" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          {item.type === 'video' && typeof item.duration === 'number' && (
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.85)']}
            style={styles.overlayGradient}
            pointerEvents="box-none"
          >
            <View style={styles.overlayContent} pointerEvents="box-none">
              <Text style={styles.overlayText}>
                {formatTime(item.timestamp)}
              </Text>
              <TouchableOpacity
                style={styles.overlayButton}
                onPress={() => handleSave(item)}
                disabled={savingId === item.id || item.isSaved}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.overlayIcon,
                    getOverlayIconColors(item.isSaved ?? false, theme.primary),
                  ]}
                >
                  {item.isSaved ? (
                    <Icon name="check" size={16} color="#FFFFFF" />
                  ) : (
                    <Icon name="download" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    ),
    [handleSave, handleStatusPress, savingId, theme],
  );

  const handleViewerClose = useCallback(() => {
    setSelectedStatus(null);
    setSelectedIndex(0);
  }, []);

  const handlePermissionGuideContinue = useCallback(() => {
    setShowPermissionGuide(false);
    statusLoadingRef.current = true;
    setStatusLoading(true);

    (async () => {
      try {
        const uri = await requestFolderAccess(type);
        if (uri) {
          safPermissionState.grantedUri = uri;
          isAwaitingPermission.current = false;
          DeviceEventEmitter.emit(SAF_PERMISSION_GRANTED_EVENT, {
            type,
            uri,
          });
          if (loadStatusesRef.current) {
            await loadStatusesRef.current(true);
          }
        }
      } catch (error: any) {
        console.error('❌ Error requesting folder access:', error);

        // Show appropriate error message
        if (error.code !== 'CANCELLED') {
          const errorMessage = error.message?.includes('Invalid folder')
            ? 'The selected folder does not contain a .Statuses folder. Please select Android/media or a folder containing WhatsApp status files.'
            : t('status.errorPermissionMessage');

          showMessage({
            title: t('status.errorPermissionTitle'),
            message: errorMessage,
            type: 'error',
          });

          // If invalid folder, show the permission guide again after a delay
          if (error.message?.includes('Invalid folder')) {
            setTimeout(() => {
              setShowPermissionGuide(true);
            }, 2500);
          }
        }
      } finally {
        isAwaitingPermission.current = false;
        statusLoadingRef.current = false;
        setStatusLoading(false);
      }
    })();
  }, [type, showMessage, t]);

  const handlePermissionGuideCancel = useCallback(() => {
    isAwaitingPermission.current = false;
    setShowPermissionGuide(false);
  }, []);

  const viewerVisible = selectedStatus !== null && filteredStatuses.length > 0;

  if (isInitialLoad || (listLoading && filteredStatuses.length === 0)) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (filteredStatuses.length === 0 && !listLoading && !refreshing) {
    return (
      <>
        <View
          style={[styles.emptyContainer, { backgroundColor: theme.background }]}
        >
          {activeTab === 'saved' ? (
            <View style={styles.savedEmpty}>
              <MaterialIcon
                name="archive"
                size={64}
                color="rgba(255, 255, 255, 0.25)"
              />
              <Text style={styles.savedEmptyTitle}>
                {mediaFilter === 'images'
                  ? 'No images found'
                  : 'No videos found'}
              </Text>
              <Text style={styles.savedEmptySubtitle}>
                {mediaFilter === 'images'
                  ? 'No saved images yet'
                  : 'No saved videos yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Icon name="plus" size={20} color="#10B981" />
              </View>
              <Text style={styles.emptyCardText}>View in WhatsApp</Text>
              <Text style={styles.emptyCardSubtext}>
                Open WhatsApp to fetch newer status updates
              </Text>
            </View>
          )}
        </View>
        <PermissionGuideModal
          visible={showPermissionGuide}
          type={type}
          onContinue={handlePermissionGuideContinue}
          onCancel={handlePermissionGuideCancel}
        />
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {mediaFilter === 'videos' && activeTab === 'status' && (
        <View style={styles.recentHeader}>
          <Text style={styles.recentHeaderText}>RECENT STATUSES</Text>
        </View>
      )}
      <FlatList
        data={filteredStatuses}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        extraData={statuses}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={100}
        initialNumToRender={4}
        windowSize={3}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH * 1.78 + 14,
          offset: (CARD_WIDTH * 1.78 + 14) * Math.floor(index / 2),
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressBackgroundColor={theme.surface}
          />
        }
      />
      <StatusViewer
        visible={viewerVisible}
        statuses={filteredStatuses}
        initialIndex={selectedIndex}
        savingId={savingId}
        onClose={handleViewerClose}
        onSave={handleSave}
      />
      <PermissionGuideModal
        visible={showPermissionGuide}
        type={type}
        onContinue={handlePermissionGuideContinue}
        onCancel={handlePermissionGuideCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.78,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#162420',
    position: 'relative',
  },
  cardPressable: {
    flex: 1,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.78,
    resizeMode: 'cover',
  },
  cardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  overlayText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '600',
  },
  overlayButton: {
    paddingVertical: 0,
  },
  overlayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  savedEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedEmptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: 24,
  },
  savedEmptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(22, 36, 32, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#162420',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyCardText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#B7CDC4',
    marginTop: 10,
  },
  emptyCardSubtext: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '400',
    color: '#9AADA5',
    marginTop: 4,
  },
  loadingIcon: {
    opacity: 0.6,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  recentHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
  },
  recentHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#B7CDC4',
    textTransform: 'uppercase',
  },
});

export default React.memo(StatusListScreen, (prevProps, nextProps) => {
  return (
    prevProps.mediaFilter === nextProps.mediaFilter &&
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.type === nextProps.type &&
    prevProps.reloadSignal === nextProps.reloadSignal &&
    prevProps.onCountChange === nextProps.onCountChange
  );
});
