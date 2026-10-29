import React from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from '@/components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trackEvent } from '@/lib/analytics';

const BMAC_URL = 'https://www.buymeacoffee.com/ThomasApps';

const WHY_ITEMS = [
  {
    emoji: '🚫',
    title: 'No advertisements',
    desc: "Ads ruin the experience. You'll never see a single one here.",
  },
  {
    emoji: '🔓',
    title: 'No subscriptions',
    desc: 'Everything is free to play. No paywalls, no locked levels, ever.',
  },
  {
    emoji: '❤️',
    title: 'Made with love',
    desc: 'Every feature is built because it genuinely helps people learn and grow.',
  },
  {
    emoji: '🌱',
    title: 'Your support matters',
    desc: "Each coffee keeps the lights on so I can keep building apps that people enjoy.",
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={styles.headerTitle}>☕  Support</Text>
        <Text style={styles.headerSub}>Help keep LinguaMatch free for everyone</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero message ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>👋</Text>
          <Text style={styles.heroTitle}>Hi, I'm Thomas!</Text>
          <Text style={styles.heroBody}>
            Making apps is genuinely one of my favourite things in the world. There's something so rewarding about building something that helps people learn, smile, and grow.
          </Text>
          <Text style={styles.heroBody}>
            I believe great apps should be <Text style={styles.bold}>free for everyone</Text> — no ads interrupting your flow, no subscriptions standing between you and the good stuff. Just a clean, enjoyable experience.
          </Text>
          <Text style={styles.heroBody}>
            If LinguaMatch has brought you or your little ones any joy, any support truly means the world and helps me keep creating. 🙏
          </Text>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaWrap}>
          <Text style={styles.ctaLabel}>Enjoying the app? Buy me a coffee ☕</Text>
          <TouchableOpacity
            onPress={() => {
              trackEvent('support_link_clicked', { location: 'support_tab' });
              Linking.openURL(BMAC_URL);
            }}
            activeOpacity={0.85}
            style={styles.bmacBtn}
          >
            <Text style={styles.bmacEmoji}>☕</Text>
            <Text style={styles.bmacTxt}>Buy me a coffee</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>
            Even one coffee makes a real difference — thank you! 🙏
          </Text>
        </View>

        {/* ── Why items ── */}
        <View style={styles.whyGrid}>
          {WHY_ITEMS.map(item => (
            <View key={item.title} style={styles.whyCard}>
              <Text style={styles.whyEmoji}>{item.emoji}</Text>
              <Text style={styles.whyTitle}>{item.title}</Text>
              <Text style={styles.whyDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer note ── */}
        <View style={styles.footerNote}>
          <Ionicons name="heart" size={14} color="#1F6FEB" />
          <Text style={styles.footerTxt}>
            Built with love · Always free · No strings attached
          </Text>
          <Ionicons name="heart" size={14} color="#1F6FEB" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFBF5' },

  // Header
  header: {
    backgroundColor: '#1F6FEB',
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  // Content
  content: { padding: 16, gap: 16 },

  // Hero
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#1F6FEB33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroEmoji: { fontSize: 36, textAlign: 'center' },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: '#1F6FEB', textAlign: 'center',
  },
  heroBody: {
    fontSize: 15, fontWeight: '500', color: '#374151',
    lineHeight: 23, textAlign: 'center',
  },
  bold: { fontWeight: '800', color: '#1F2937' },

  // Why grid
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  whyCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#1F6FEB22',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  whyEmoji: { fontSize: 28 },
  whyTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  whyDesc:  { fontSize: 12, fontWeight: '500', color: '#6B7280', lineHeight: 18 },

  // CTA
  ctaWrap: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: '#374151' },
  bmacBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1F6FEB',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bmacEmoji: { fontSize: 24 },
  bmacTxt:   { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  ctaSub:    { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textAlign: 'center' },

  // Footer
  footerNote: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingTop: 4,
  },
  footerTxt: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
});
