import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCENT = '#00A884';
const SURFACE = '#162621';
const INSET = '#0F1A16';

interface PermissionGuideModalProps {
  visible: boolean;
  type: 'whatsapp' | 'business';
  onContinue: () => void;
  onCancel: () => void;
}

/** Storage access guide shown before opening the Android folder picker. */
const PermissionGuideModal: React.FC<PermissionGuideModalProps> = ({
  visible,
  type: _type,
  onContinue,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Icon
                    name="folder-outline"
                    size={20}
                    color={ACCENT}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Storage Access</Text>
                  <Text style={styles.subtitle}>
                    Required to load and store status media
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancel}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close permission guide"
              >
                <Icon name="close" size={14} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* Target directory */}
            <View style={styles.directoryRow}>
              <Text style={styles.directoryLabel}>Directory</Text>
              <View style={styles.path}>
                <Text style={styles.pathPart}>Internal</Text>
                <Text style={styles.pathSeparator}>/</Text>
                <Text style={styles.pathPart}>Android</Text>
                <Text style={styles.pathSeparator}>/</Text>
                <Text style={styles.pathActive}>media</Text>
              </View>
            </View>

            {/* Steps */}
            <View style={styles.steps}>
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Select{' '}
                  <Text style={styles.stepBadge}>Use this folder</Text> at the
                  screen bottom
                </Text>
              </View>
              <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Tap <Text style={styles.stepBadgeAccent}>Allow</Text> on the
                  system prompt
                </Text>
              </View>
            </View>

            {/* System dialog preview */}
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                <View style={styles.previewDot} />
                <View style={styles.previewText}>
                  <Text style={styles.previewTitle}>
                    Allow What&apos;s ME to access files in media?
                  </Text>
                  <Text style={styles.previewDescription}>
                    Grant read and write privileges for status downloads.
                  </Text>
                </View>
              </View>
              <View style={styles.previewButtons}>
                <Text style={styles.previewCancel}>Cancel</Text>
                <View style={styles.previewAllow}>
                  <Text style={styles.previewAllowText}>Allow</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onContinue}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>Grant Permission</Text>
              <Icon name="chevron-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.homeIndicator}>
            <View style={styles.homeIndicatorBar} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 14, 11, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '95%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: SURFACE,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: INSET,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  directoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  path: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathPart: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  pathSeparator: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 6,
  },
  pathActive: {
    fontSize: 11,
    fontWeight: '600',
    color: ACCENT,
  },
  steps: {
    gap: 8,
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: INSET,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  stepBadgeAccent: {
    fontSize: 11,
    fontWeight: '600',
    color: ACCENT,
    backgroundColor: 'rgba(0, 168, 132, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  previewCard: {
    backgroundColor: INSET,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    marginTop: 6,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  previewDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 3,
  },
  previewButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  previewCancel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewAllow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewAllowText: {
    fontSize: 11,
    fontWeight: '600',
    color: ACCENT,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: '#FFFFFF',
    marginRight: 4,
  },
  homeIndicator: {
    alignItems: 'center',
    marginTop: 12,
  },
  homeIndicatorBar: {
    width: 144,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default PermissionGuideModal;
