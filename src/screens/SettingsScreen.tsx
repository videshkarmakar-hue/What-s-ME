import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as RNLocalize from 'react-native-localize';
import { useTheme } from '../context/ThemeContext';
import { getDefaultDialCode } from '../utils/countryDialCodes';
import { LanguageCode, useLanguage } from '../context/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';

interface SettingsScreenProps {
  onClose: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToHelp?: () => void;
}

const DARK_UI = {
  surface: '#15221E',
  input: '#0D1713',
  border: 'rgba(255, 255, 255, 0.08)',
  subtle: '#7E938B',
  text: '#F1F5F3',
  accent: '#2DD4BF',
  accentDark: '#0D3831',
  accentMuted: '#1B3D34',
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClose,
  onNavigateToAbout,
  onNavigateToHelp,
}) => {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { language, setLanguage, t, options } = useLanguage();
  const { showMessage } = useFeedback();
  const [countryCode, setCountryCode] = useState(() =>
    getDefaultDialCode(RNLocalize.getCountry()),
  );
  const [dmPhone, setDmPhone] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

  const ui = useMemo(
    () =>
      isDark
        ? DARK_UI
        : {
            surface: theme.surface,
            input: theme.surfaceVariant,
            border: theme.border,
            subtle: theme.textSecondary,
            text: theme.text,
            accent: theme.primary,
            accentDark: theme.primaryDark,
            accentMuted: 'rgba(45, 212, 191, 0.16)',
          },
    [isDark, theme],
  );

  const sanitizedCountryCode = useMemo(
    () => countryCode.replace(/[^\d]/g, ''),
    [countryCode],
  );
  const cleanedNumber = useMemo(() => dmPhone.replace(/[^\d]/g, ''), [dmPhone]);
  const fullPhoneNumber = useMemo(
    () => sanitizedCountryCode + cleanedNumber,
    [sanitizedCountryCode, cleanedNumber],
  );
  const canSendDirectMessage =
    sanitizedCountryCode.length >= 1 && cleanedNumber.length >= 6;

  const themeLabel = useMemo(() => {
    if (themeMode === 'system') return t('settings.themeFollowSystem');
    if (themeMode === 'dark') return t('settings.themeDark');
    return t('settings.themeLight');
  }, [t, themeMode]);

  const isLightActive = themeMode === 'light';
  const isDarkActive = themeMode === 'dark' || themeMode === 'system';

  const selectedLanguageOption = useMemo(() => {
    return options.find(option => option.code === language) || options[0];
  }, [language, options]);

  const handleShareApp = useCallback(async () => {
    try {
      const downloadUrl =
        'https://f-droid.org/packages/com.videshkarmakar.whatsapp/';
      const shareMessage = `${t(
        'settings.shareAppAlertMessage',
      )}\n\n${downloadUrl}`;

      await Share.share({
        message: shareMessage,
        title: t('settings.shareAppAlertTitle'),
      });
    } catch {
      showMessage({
        title: t('settings.shareAppAlertTitle'),
        message: t('settings.shareAppAlertMessage'),
        type: 'info',
      });
    }
  }, [showMessage, t]);

  const handleCountryCodeChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    setCountryCode(digitsOnly ? `+${digitsOnly}` : '+');
  }, []);

  const handlePhoneNumberChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    setDmPhone(digitsOnly);
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

    const message = dmMessage.trim();
    const encodedMessage = encodeURIComponent(message);
    const nativeUrl = `whatsapp://send?phone=${fullPhoneNumber}&text=${encodedMessage}`;
    const webUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;

    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      if (supported) {
        await Linking.openURL(nativeUrl);
        return;
      }
      await Linking.openURL(webUrl);
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

  const menuItems = useMemo(
    () => [
      {
        label: t('settings.aboutShare'),
        icon: 'sharealt',
        onPress: handleShareApp,
      },
      {
        label: t('settings.aboutHelp'),
        icon: 'questioncircleo',
        onPress: onNavigateToHelp,
      },
      {
        label: 'Feedback',
        icon: 'message1',
        onPress: () =>
          Linking.openURL('https://github.com/whatsme/whatsme/issues'),
      },
      {
        label: t('settings.aboutTitle'),
        icon: 'infocirlceo',
        onPress: onNavigateToAbout,
      },
    ],
    [handleShareApp, onNavigateToAbout, onNavigateToHelp, t],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: ui.text }]}>
          {t('settings.title')}
        </Text>
        <TouchableOpacity
          style={[
            styles.headerIcon,
            { backgroundColor: ui.surface, borderColor: ui.border },
          ]}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('settings.accessibility.close')}
        >
          <Icon name="close" size={16} color={ui.subtle} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.grow}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          style={styles.grow}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Theme card */}
          <View
            style={[
              styles.card,
              { backgroundColor: ui.surface, borderColor: ui.border },
            ]}
          >
            <View style={styles.themeRow}>
              <View
                style={[
                  styles.iconCircleLarge,
                  { backgroundColor: ui.accentDark, borderColor: ui.accent },
                ]}
              >
                <Icon name="skin" size={20} color={ui.accent} />
              </View>
              <View style={styles.flexOne}>
                <Text style={[styles.cardTitle, { color: ui.text }]}>
                  {t('settings.themeTitle')}
                </Text>
                <Text style={[styles.cardSubtitle, { color: ui.subtle }]}>
                  {themeLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.themePill,
                  { backgroundColor: ui.input, borderColor: ui.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.themePillButton,
                    isLightActive && {
                      backgroundColor: ui.accentDark,
                      borderColor: ui.accent,
                    },
                  ]}
                  onPress={() => setThemeMode('light')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.themeLight')}
                >
                  <MaterialIcon
                    name="weather-sunny"
                    size={14}
                    color={isLightActive ? ui.accent : ui.subtle}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: isLightActive ? ui.accent : ui.subtle },
                    ]}
                  >
                    {t('settings.themeLightShort')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themePillButton,
                    isDarkActive && {
                      backgroundColor: ui.accentDark,
                      borderColor: ui.accent,
                    },
                  ]}
                  onPress={() => setThemeMode('dark')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.themeDark')}
                >
                  <MaterialIcon
                    name="weather-night"
                    size={14}
                    color={isDarkActive ? ui.accent : ui.subtle}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: isDarkActive ? ui.accent : ui.subtle },
                    ]}
                  >
                    {t('settings.themeDarkShort')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Language card */}
          <View
            style={[
              styles.card,
              styles.cardSpaced,
              { backgroundColor: ui.surface, borderColor: ui.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: ui.accentDark, borderColor: ui.accent },
                ]}
              >
                <Icon name="earth" size={16} color={ui.accent} />
              </View>
              <Text style={[styles.cardSubtitle, { color: ui.subtle }]}>
                {t('settings.languageDescription')}
              </Text>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: ui.subtle }]}>
                {t('settings.languageSelectLabel')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.field,
                  { backgroundColor: ui.input, borderColor: ui.border },
                ]}
                onPress={() => setLanguageModalVisible(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('settings.languageModalTitle')}
              >
                <Text style={[styles.fieldValue, { color: ui.text }]}>
                  {selectedLanguageOption.label}
                </Text>
                <Icon name="down" size={16} color={ui.subtle} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Instant message card */}
          <View
            style={[
              styles.card,
              styles.cardSpaced,
              { backgroundColor: ui.surface, borderColor: ui.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: ui.accentDark, borderColor: ui.accent },
                ]}
              >
                <Icon name="message1" size={16} color={ui.accent} />
              </View>
              <Text style={[styles.cardSubtitle, { color: ui.subtle }]}>
                {t('settings.directMessageCardSubtitle')}
              </Text>
            </View>

            <View style={styles.phoneRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.countryInput,
                  {
                    backgroundColor: ui.input,
                    color: ui.text,
                    borderColor: ui.border,
                  },
                ]}
                value={countryCode}
                onChangeText={handleCountryCodeChange}
                placeholder={t('settings.directMessageCountryPlaceholder')}
                placeholderTextColor="#737373"
                keyboardType="phone-pad"
                returnKeyType="next"
                maxLength={6}
                accessibilityLabel="Country dial code"
              />
              <TextInput
                style={[
                  styles.input,
                  styles.subscriberInput,
                  {
                    backgroundColor: ui.input,
                    color: ui.text,
                    borderColor: ui.border,
                  },
                ]}
                value={dmPhone}
                onChangeText={handlePhoneNumberChange}
                placeholder={t('settings.directMessageNumberPlaceholder')}
                placeholderTextColor="#737373"
                keyboardType="phone-pad"
                returnKeyType="next"
                maxLength={15}
                accessibilityLabel="Phone number"
              />
            </View>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: ui.input,
                  color: ui.text,
                  borderColor: ui.border,
                },
              ]}
              value={dmMessage}
              onChangeText={setDmMessage}
              placeholder={t('settings.directMessageMessagePlaceholder')}
              placeholderTextColor="#737373"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: ui.accentMuted,
                  borderColor: ui.accent,
                  opacity: canSendDirectMessage ? 1 : 0.5,
                },
              ]}
              onPress={handleDirectMessage}
              disabled={!canSendDirectMessage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSendDirectMessage }}
            >
              <Text style={styles.primaryButtonText}>
                {t('settings.directMessageButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Support menu */}
          <View
            style={[
              styles.menuCard,
              styles.cardSpaced,
              { backgroundColor: ui.surface, borderColor: ui.border },
            ]}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuRow,
                  index > 0 && styles.menuRowDivider,
                  index > 0 && { borderTopColor: ui.border },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.rowLeft}>
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: ui.accentDark, borderColor: ui.accent },
                    ]}
                  >
                    <Icon name={item.icon} size={16} color={ui.accent} />
                  </View>
                  <Text style={[styles.menuLabel, { color: ui.text }]}>
                    {item.label}
                  </Text>
                </View>
                <Icon name="right" size={14} color={ui.subtle} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: ui.subtle }]}>
              {t('settings.versionLabel')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: ui.surface, borderColor: ui.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: ui.text }]}>
                  {t('settings.languageModalTitle')}
                </Text>
                {options.map(option => {
                  const isSelected = option.code === language;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      style={[
                        styles.modalOption,
                        isSelected && { backgroundColor: ui.accentDark },
                      ]}
                      onPress={() => handleLanguageSelect(option.code)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.modalOptionText, { color: ui.text }]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Icon name="check" size={16} color={ui.accent} />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardSpaced: {
    marginTop: 12,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: {
    flex: 1,
  },
  themePill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  themePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  field: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  countryInput: {
    width: 96,
    textAlign: 'center',
    fontWeight: '500',
  },
  subscriberInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 84,
    marginTop: 12,
    padding: 12,
  },
  primaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowDivider: {
    borderTopWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 30, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default SettingsScreen;
