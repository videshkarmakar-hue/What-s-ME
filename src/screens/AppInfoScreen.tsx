import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from '../context/LanguageContext';

const LOGO_URL =
  'https://cdn.phototourl.com/member/2026-11-26-e888425d-1411-4249-a61b-d946b3b93452.png';

const BG = '#0F1A16';
const CARD = '#162420';
const TEXT = '#F1F5F3';
const SECONDARY = '#B7CDC4';
const SEPARATOR = 'rgba(255, 255, 255, 0.08)';

interface AppInfoScreenProps {
  onClose: () => void;
}

const AppInfoScreen: React.FC<AppInfoScreenProps> = ({ onClose }) => {
  const { t } = useLanguage();

  const details = [
    { label: 'Application', value: "What's ME" },
    {
      label: 'Tagline',
      value: 'Your Friends WhatsApp Status Can Save on Your Phone',
    },
    { label: 'Platform', value: 'Android' },
    { label: 'Developed & Designed By', value: 'Videsh Karmakar' },
    { label: 'UI/UX & Product Design', value: 'Figma & Stitch' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
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
        <Text style={styles.headerTitle}>App Info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.heroName}>WHAT&apos;S ME</Text>
          <Text style={styles.heroTagline}>
            Your Friends WhatsApp Status Can Save on Your Phone.
          </Text>
        </View>

        {/* App information */}
        <Text style={styles.sectionTitle}>APP INFORMATION</Text>
        <View style={styles.card}>
          {details.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.detailRow,
                index === details.length - 1 && styles.detailRowLast,
              ]}
            >
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT WHAT&apos;S ME</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            What&apos;s ME is built to make saving WhatsApp Status updates
            simple, quick, and convenient.
          </Text>
          <Text style={styles.paragraph}>
            The application provides an easy-to-use interface where users can
            discover available status updates, save photos and videos directly
            to their device, and access their saved content whenever they want.
          </Text>
          <Text style={styles.paragraph}>
            Designed with simplicity and usability in mind, What&apos;s ME keeps
            the entire experience straightforward without unnecessary
            complexity.
          </Text>
          <Text style={[styles.paragraph, styles.emphasis]}>
            Simple. Fast. Convenient.
          </Text>
          <Text style={styles.paragraph}>
            That philosophy guides the design and development of What&apos;s ME
            across every interaction.
          </Text>
        </View>

        {/* Version & build */}
        <Text style={styles.sectionTitle}>VERSION &amp; BUILD</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Application</Text>
            <Text style={styles.detailValue}>What&apos;s ME</Text>
          </View>
          <View style={styles.detailRowLast}>
            <Text style={styles.detailLabel}>Version</Text>
            <Text style={styles.detailValue}>{t('settings.versionLabel')}</Text>
          </View>
        </View>

        <Text style={styles.copyright}>
          © 2026 Videsh Karmakar. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 18,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
    marginTop: 16,
  },
  heroTagline: {
    fontSize: 14,
    color: SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 300,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: SECONDARY,
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEPARATOR,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    color: SECONDARY,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT,
    textAlign: 'right',
    flex: 1,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT,
    marginBottom: 14,
  },
  emphasis: {
    fontWeight: '600',
    color: SECONDARY,
  },
  copyright: {
    fontSize: 12,
    color: SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AppInfoScreen;
