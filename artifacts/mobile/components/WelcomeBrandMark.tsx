import { Image, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function WelcomeBrandMark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Image
          source={require("../assets/images/lingua-brainwave-wordmark.png")}
          style={styles.compactWordmark}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Lingua"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[styles.logoFrame, { backgroundColor: colors.card }]}
      >
        <Image
          source={require("../assets/images/lingua-brain-learning-logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Lingua brain learning logo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  compactContainer: {
    width: "100%",
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  compactWordmark: { width: 238, height: 77 },
  logoFrame: {
    width: 164,
    height: 164,
    borderRadius: 38,
    overflow: "hidden",
    boxShadow: "0px 10px 22px rgba(31,111,235,0.12)",
    elevation: 5,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});
