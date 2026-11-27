import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { getDefaultDialCode } from '../utils/countryDialCodes';
import { LanguageCode, useLanguage } from '../context/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';

interface SettingsScreenProps {
  onClose: () => void;
}

const BG = '#F2F2F7';
const CARD = '#FFFFFF';
const TEXT = '#111827';
const SECONDARY = '#414B5A';
const SEPARATOR = 'rgba(60, 60, 67, 0.10)';
const ACCENT = '#007AFF';
const GREEN = '#25D366';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t, options } = useLanguage();
  const { showMessage } = useFeedback();

  const [countryCode, setCountryCode] = useState(() =>
    getDefaultDialCode(RNLocalize.getCountry()),
  );
  const [dmPhone, setDmPhone] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isDirectMessageVisible, setDirectMessageVisible] = useState(false);

  const sanitizedCountryCode = useMemo(
    () => countryCode.replace(/[^\d]/g, ''),
    [countryCode],
  );
  const cleanedNumber = useMemo(() => dmPhone.replace(/[^\d]/g, ''), [dmPhone]);
  const fullPhoneNumber = sanitizedCountryCode + cleanedNumber;
  const canSendDirectMessage =
    sanitizedCountryCode.length >= 1 && cleanedNumber.length >= 6;

  const selectedLanguageOption = useMemo(
    () => options.find(option => option.code === language) || options[0],
    [language, options],
  );

  const isDarkMode = themeMode === 'dark' || themeMode === 'system';
  const themeValue = isDarkMode
    ? t('settings.themeDarkShort')
    : t('settings.themeLightShort');

  const cycleThemeMode = useCallback(() => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  }, [setThemeMode, themeMode]);

  const handleCountryCodeChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    setCountryCode(digitsOnly ? `+${digitsOnly}` : '+');
  }, []);

  const handlePhoneNumberChange = useCallback((value: string) => {
    setDmPhone(value.replace(/[^\d]/g, ''));
  }, []);

  const handleDirectMessage = useCallback(async () => {
    if (!canSendDirectMessage) {
      showMessage({
        title: t('settings.directMessageAlertTitle'),
        message: t('settings.directMessageAlertMessage'),
        type: 'warning',
      });
      return;
    }

    const encodedMessage = encodeURIComponent(dmMessage.trim());
    const nativeUrl = `whatsapp://send?phone=${fullPhoneNumber}&text=${encodedMessage}`;
    const webUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;

    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(supported ? nativeUrl : webUrl);
    } catch {
      showMessage({
        title: t('settings.directMessageAlertTitle'),
        message: t('settings.directMessageWhatsappError'),
        type: 'error',
      });
    }
  }, [canSendDirectMessage, dmMessage, fullPhoneNumber, showMessage, t]);

  const handleLanguageSelect = useCallback(
    (code: LanguageCode) => {
      setLanguage(code);
      setLanguageModalVisible(false);
    },
    [setLanguage],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcon name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.grow}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <MaterialIcon name="whatsapp" size={26} color={GREEN} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>What&apos;s ME</Text>
              <Text style={styles.profileSubtitle}>Status saver</Text>
            </View>
          </View>

          {/* General */}
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.group}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setDirectMessageVisible(true)}
              activeOpacity={0.6}
              accessibilityRole="button"
            >
              <View style={styles.rowIcon}>
                <MaterialIcon name="message" size={19} color={TEXT} />
              </View>
              <Text style={styles.rowLabel}>
                {t('settings.directMessageButton')}
              </Text>
              <MaterialIcon name="chevron-right" size={18} color={SECONDARY} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.6}
              accessibilityRole="button"
            >
              <View style={styles.rowIcon}>
                <MaterialIcon name="translate" size={19} color={TEXT} />
              </View>
              <Text style={styles.rowLabel}>Language</Text>
              <Text style={styles.rowValue}>{selectedLanguageOption.label}</Text>
              <MaterialIcon name="chevron-right" size={18} color={SECONDARY} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rowLast}
              onPress={cycleThemeMode}
              activeOpacity={0.6}
              accessibilityRole="button"
            >
              <View style={styles.rowIcon}>
                <MaterialIcon
                  name={isDarkMode ? 'weather-night' : 'weather-sunny'}
                  size={19}
                  color={TEXT}
                />
              </View>
              <Text style={styles.rowLabel}>Light/Dark Mode</Text>
              <Text style={styles.rowValue}>{themeValue}</Text>
              <MaterialIcon name="chevron-right" size={18} color={SECONDARY} />
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>{t('settings.versionLabel')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Language picker */}
      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {t('settings.languageModalTitle')}
                </Text>
                {options.map(option => {
                  const isSelected = option.code === language;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      style={styles.modalOption}
                      onPress={() => handleLanguageSelect(option.code)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.modalOptionText}>{option.label}</Text>
                      {isSelected && (
                        <MaterialIcon name="check" size={18} color={ACCENT} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Direct message */}
      <Modal
        visible={isDirectMessageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDirectMessageVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setDirectMessageVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {t('settings.directMessageCardSubtitle')}
                </Text>
                <View style={styles.phoneRow}>
                  <TextInput
                    style={styles.countryInput}
                    value={countryCode}
                    onChangeText={handleCountryCodeChange}
                    placeholder="+00"
                    placeholderTextColor={SECONDARY}
                    keyboardType="phone-pad"
                    maxLength={6}
                  />
                  <TextInput
                    style={styles.numberInput}
                    value={dmPhone}
                    onChangeText={handlePhoneNumberChange}
                    placeholder={t('settings.directMessageNumberPlaceholder')}
                    placeholderTextColor={SECONDARY}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
                <TextInput
                  style={styles.messageInput}
                  value={dmMessage}
                  onChangeText={setDmMessage}
                  placeholder={t('settings.directMessageMessagePlaceholder')}
                  placeholderTextColor={SECONDARY}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={handleDirectMessage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalActionText}>
                    {t('settings.directMessageButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
    backgroundColor: BG,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 32,
  },
  grow: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
  },
  profileSubtitle: {
    fontSize: 13,
    color: SECONDARY,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: SECONDARY,
    marginLeft: 4,
    marginBottom: 8,
  },
  group: {
    backgroundColor: CARD,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  rowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  rowValue: {
    fontSize: 15,
    color: SECONDARY,
    marginRight: 6,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: SECONDARY,
    marginTop: 32,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    backgroundColor: CARD,
    padding: 20,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  modalOptionText: {
    fontSize: 15,
    color: TEXT,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  countryInput: {
    width: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SEPARATOR,
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT,
  },
  numberInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SEPARATOR,
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT,
  },
  messageInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SEPARATOR,
    backgroundColor: BG,
    padding: 12,
    fontSize: 15,
    color: TEXT,
    minHeight: 80,
  },
  modalAction: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: ACCENT,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SettingsScreen;
