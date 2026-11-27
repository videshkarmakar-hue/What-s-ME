import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const PHOTO_URL =
  'https://cdn.phototourl.com/member/2026-11-17-5a49e987-e682-44a4-be07-82fb958b4929.png';

const BG = '#0F1A16';
const CARD = '#162420';
const TEXT = '#F1F5F3';
const SECONDARY = '#B7CDC4';
const SEPARATOR = 'rgba(255, 255, 255, 0.08)';
const ACCENT = '#00A884';

interface DeveloperCreditScreenProps {
  onClose: () => void;
}

const links = [
  {
    label: 'Official Website',
    value: 'videshkarmakar.carrd.co',
    url: 'https://videshkarmakar.carrd.co',
    icon: 'web',
  },
  {
    label: 'Spotify',
    value: 'Videsh Karmakar — Artist Profile',
    url: 'https://open.spotify.com/search/Videsh%20Karmakar',
    icon: 'spotify',
  },
  {
    label: 'Instagram',
    value: '@code.red_videsh',
    url: 'https://instagram.com/code.red_videsh',
    icon: 'instagram',
  },
  {
    label: 'YouTube',
    value: '@videshkarmakar2000',
    url: 'https://youtube.com/@videshkarmakar2000',
    icon: 'youtube',
  },
  {
    label: 'Facebook',
    value: 'gfx.videsh',
    url: 'https://facebook.com/gfx.videsh',
    icon: 'facebook',
  },
];

const development = [
  {
    label: 'Product',
    value: "What's ME — Your Friends WhatsApp Status Can Save on Your Phone.",
  },
  { label: 'Developed & Designed By', value: 'Videsh Karmakar' },
  { label: 'Design & Prototyping', value: 'Figma · Stitch' },
  { label: 'Platform', value: 'Android · iOS Coming Soon' },
];

const DeveloperCreditScreen: React.FC<DeveloperCreditScreenProps> = ({
  onClose,
}) => {
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
        <Text style={styles.headerTitle}>Developer Credits</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>Crafted With Vision. Built With Purpose.</Text>
          <Image source={{ uri: PHOTO_URL }} style={styles.avatar} resizeMode="cover" />
          <Text style={styles.name}>Videsh Karmakar</Text>
          <Text style={styles.role}>Founder · Developer · UI/UX Designer</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.paragraph}>
            What&apos;s ME is proudly conceptualized, designed, and developed by
            Videsh Karmakar — bringing together software engineering, product
            design, and a passion for simple, useful tools to create a refined
            and effortless status-saving experience.
          </Text>
          <Text style={styles.paragraph}>
            From the interface and visual identity to the underlying product
            experience, every detail of What&apos;s ME is thoughtfully crafted
            with a focus on simplicity, performance, accessibility, and
            usability.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>CONNECT WITH THE DEVELOPER</Text>
        <Text style={styles.sectionHint}>
          Stay connected and explore more of the developer&apos;s work, music,
          and creative projects.
        </Text>
        <View style={styles.card}>
          {links.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.row,
                index === links.length - 1 && styles.rowLast,
              ]}
              onPress={() => void Linking.openURL(item.url)}
              activeOpacity={0.7}
              accessibilityRole="link"
            >
              <View style={styles.rowIcon}>
                <MaterialIcon name={item.icon} size={18} color={TEXT} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
              <MaterialIcon name="open-in-new" size={16} color={SECONDARY} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>DEVELOPMENT &amp; DESIGN</Text>
        <View style={styles.card}>
          {development.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.detailRow,
                index === development.length - 1 && styles.detailRowLast,
              ]}
            >
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ACKNOWLEDGEMENT</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Built independently with a commitment to thoughtful design, modern
            technology, and a better way to save and experience WhatsApp Status
            updates.
          </Text>
          <Text style={styles.paragraph}>Thank you for being part of What&apos;s ME.</Text>
        </View>

        <Text style={styles.copyright}>
          © 2026 Videsh Karmakar. All Rights Reserved.
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
    marginBottom: 24,
  },
  heroKicker: {
    fontSize: 13,
    color: SECONDARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A332A',
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: TEXT,
    marginTop: 14,
  },
  role: {
    fontSize: 13,
    color: SECONDARY,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SEPARATOR,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: SECONDARY,
    marginLeft: 4,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 19,
    color: SECONDARY,
    marginLeft: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
  },
  rowValue: {
    fontSize: 12,
    color: SECONDARY,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
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
  copyright: {
    fontSize: 12,
    color: SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default DeveloperCreditScreen;
