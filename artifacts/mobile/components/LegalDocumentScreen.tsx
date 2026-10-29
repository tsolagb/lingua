import { Linking, Pressable, ScrollView, Text, View } from "@/components/native";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { legalDocuments } from "@/lib/legalDocuments";

type DocumentName = keyof typeof legalDocuments;

export default function LegalDocumentScreen({
  document,
}: {
  document: DocumentName;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const content = legalDocuments[document];
  const otherDocument = document === "terms" ? "privacy" : "terms";

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/welcome" as never);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 16) + 12, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.backText, { color: colors.foreground }]}>‹  Back</Text>
        </Pressable>

        <View style={[styles.draftNotice, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Text style={[styles.draftLabel, { color: colors.primary }]}>DRAFT — LEGAL REVIEW REQUIRED</Text>
          <Text style={[styles.draftCopy, { color: colors.accentForeground }]}>
            This page is not a final legal document. A qualified California attorney must review it before publication.
          </Text>
        </View>

        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
          {content.title}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          Version {content.version} · Updated {content.updated}
        </Text>

        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text accessibilityRole="header" style={[styles.heading, { color: colors.foreground }]}>
              {section.heading}
            </Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={`${section.heading}-${index}`} style={[styles.paragraph, { color: colors.mutedForeground }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>
            Related document
          </Text>
          <Pressable
            onPress={() => router.push(otherDocument === "terms" ? "/terms" : "/privacy")}
            accessibilityRole="link"
          >
            <Text style={[styles.link, { color: colors.primary }]}>
              {legalDocuments[otherDocument].title}
            </Text>
          </Pressable>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground }]}>
            Privacy and deletion requests:
          </Text>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                "mailto:thomasclipmail@gmail.com?subject=LinguaMatch%20privacy%20or%20deletion%20request",
              )
            }
            accessibilityRole="link"
            accessibilityLabel="Email LinguaMatch about privacy or data deletion"
          >
            <Text style={[styles.link, { color: colors.primary }]}>thomasclipmail@gmail.com</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 22,
    gap: 18,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 18,
  },
  backText: { fontSize: 14, fontWeight: "700" },
  draftNotice: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    gap: 6,
  },
  draftLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  draftCopy: { fontSize: 13, lineHeight: 19 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6 },
  meta: { fontSize: 12, marginTop: -12 },
  section: { gap: 9 },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: "700" },
  paragraph: { fontSize: 14, lineHeight: 22 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 8 },
  footerLabel: { fontSize: 12, lineHeight: 18 },
  link: { fontSize: 14, fontWeight: "700", textDecorationLine: "underline" },
});
