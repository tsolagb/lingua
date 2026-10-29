import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "@/components/native";
import type { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useClerk, useSSO, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useAuthGate } from "@/context/AuthGateContext";
import { GUEST_ACCESS_KEY } from "@/context/progressSnapshot";
import { useGame } from "@/context/GameContext";
import { useThemeSettings, type ThemePreference } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { WelcomeBrandMark } from "@/components/WelcomeBrandMark";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { recordLegalAcceptance, setAuthTokenGetter } from "@workspace/api-client-react";
import {
  CURRENT_LEGAL_ACCEPTANCE,
  LEGAL_ACCEPTANCE_PENDING_KEY,
  LEGAL_GUEST_ACCEPTANCE_KEY,
  type LegalAcceptancePayload,
} from "@/lib/legal";

WebBrowser.maybeCompleteAuthSession();

type WelcomePressableStyle = React.ComponentProps<typeof Pressable>["style"];

function WelcomeActionPressable({
  children,
  onPress,
  onPressIn,
  testID,
  accessibilityLabel,
  disabled,
  style,
  reduceMotion,
}: {
  children: React.ReactNode;
  onPress: () => void;
  onPressIn?: () => void;
  testID?: string;
  accessibilityLabel: string;
  disabled?: boolean;
  style: WelcomePressableStyle;
  reduceMotion: boolean;
}) {
  const press = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.03 }],
  }));

  return (
    <Animated.View style={[styles.welcomePressableWrap, animatedStyle]}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={() => {
          if (!disabled && !reduceMotion) {
            press.value = withSpring(1, { damping: 18, stiffness: 420 });
          }
          onPressIn?.();
        }}
        onPressOut={() => {
          if (!reduceMotion) press.value = withSpring(0, { damping: 18, stiffness: 360 });
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function WelcomeEntrance({
  children,
  delay = 0,
  reduced,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  reduced: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(reduced ? 1 : 0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduced ? 0 : (1 - progress.value) * 10 }],
  }));

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress, reduced]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function WelcomeClouds({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <View style={[styles.cloud, styles.cloudTopLeft, { backgroundColor: colors.card, shadowColor: colors.primary }]} />
      <View style={[styles.cloud, styles.cloudTopRight, { backgroundColor: colors.homeGlowBlue, shadowColor: colors.primary }]} />
      <View style={[styles.cloud, styles.cloudMidRight, { backgroundColor: colors.card, shadowColor: colors.primary }]} />
      <View style={[styles.cloud, styles.cloudBottomLeft, { backgroundColor: colors.homeGlowBlue, shadowColor: colors.primary }]} />
    </View>
  );
}

function WelcomeConsentCheckmark({ color, reduced }: { color: string; reduced: boolean }) {
  const scale = useSharedValue(reduced ? 1 : 0);
  const style = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }],
  }));
  useEffect(() => {
    scale.value = reduced ? 1 : withSpring(1, { damping: 14, stiffness: 340 });
  }, [reduced, scale]);
  return (
    <Animated.View style={style}>
      <Ionicons name="checkmark" size={16} color={color} />
    </Animated.View>
  );
}

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: "sunny-outline" | "moon-outline" | "phone-portrait-outline";
}[] = [
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
  { value: "system", label: "Device", icon: "phone-portrait-outline" },
];

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

interface AccountScreenProps {
  initialWelcome?: boolean;
}

export default function AccountScreen({
  initialWelcome = false,
}: AccountScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { isSignedIn, signOut } = useClerk();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const { setGuestAccepted } = useAuthGate();
  const { cloudSyncStatus } = useGame();
  const { preference: themePreference, setPreference: setThemePreference } = useThemeSettings();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [appearanceError, setAppearanceError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [consentNeedsAttention, setConsentNeedsAttention] = useState(false);
  const [legalAcceptancePending, setLegalAcceptancePending] = useState(false);
  const [legalPendingLoaded, setLegalPendingLoaded] = useState(false);
  const showWelcomeDesign = !isSignedIn;
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const mascotFloat = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const consentShake = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const mascotFloatStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: mascotFloat.value + (reduceMotion ? 0 : scrollY.value * 0.035),
    }],
  }));
  const consentShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: consentShake.value }],
  }));
  const welcomeHeroHeight = Math.max(
    142,
    Math.min((Math.min(viewportWidth, 440) - 28) / (341 / 145), viewportHeight * 0.3, 205),
  );
  const providerOrder: Array<"google" | "apple"> = initialWelcome
    ? ["apple", "google"]
    : Platform.OS === "ios" ? ["apple", "google"] : ["google", "apple"];

  useWarmUpBrowser();

  useEffect(() => {
    if (!initialWelcome || reduceMotion) {
      cancelAnimation(mascotFloat);
      mascotFloat.value = 0;
      return;
    }
    mascotFloat.value = withRepeat(
      withTiming(-5, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(mascotFloat);
  }, [initialWelcome, mascotFloat, reduceMotion]);

  const welcomeActionFeedback = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const showConsentError = useCallback((message: string) => {
    setErrorMessage(message);
    if (!initialWelcome) return;
    setConsentNeedsAttention(true);
    if (!reduceMotion) {
      consentShake.value = withSequence(
        withTiming(-7, { duration: 48 }),
        withTiming(7, { duration: 55 }),
        withTiming(-4, { duration: 45 }),
        withSpring(0, { damping: 16, stiffness: 260 }),
      );
    }
  }, [consentShake, initialWelcome, reduceMotion]);

  const toggleWelcomeConsent = useCallback(() => {
    setAdultConfirmed((value) => !value);
    setConsentNeedsAttention(false);
    setErrorMessage("");
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  useEffect(() => {
    if (!isSignedIn) {
      setLegalAcceptancePending(false);
      return;
    }
    setLegalPendingLoaded(false);
    let cancelled = false;
    void AsyncStorage.getItem(LEGAL_ACCEPTANCE_PENDING_KEY).then((value) => {
      if (!cancelled) {
        setLegalAcceptancePending(Boolean(value));
        setLegalPendingLoaded(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setLegalAcceptancePending(false);
        setLegalPendingLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn && initialWelcome && legalPendingLoaded && !legalAcceptancePending) {
      router.replace("/(tabs)");
    }
  }, [initialWelcome, isSignedIn, legalAcceptancePending, legalPendingLoaded, router]);

  const persistLegalAcceptance = useCallback(async () => {
    const stored = await AsyncStorage.getItem(LEGAL_ACCEPTANCE_PENDING_KEY);
    if (!stored) {
      throw new Error("No pending legal agreement was found.");
    }
    const payload = JSON.parse(stored) as LegalAcceptancePayload;
    if (
      payload.termsVersion !== CURRENT_LEGAL_ACCEPTANCE.termsVersion ||
      payload.privacyVersion !== CURRENT_LEGAL_ACCEPTANCE.privacyVersion ||
      payload.adultAttested !== true
    ) {
      throw new Error("Please review and confirm the current legal documents.");
    }
    setAuthTokenGetter(() => getToken());
    const token = await getToken();
    if (!token) {
      throw new Error("The signed-in session is not ready yet.");
    }
    await recordLegalAcceptance(payload);
    await AsyncStorage.removeItem(LEGAL_ACCEPTANCE_PENDING_KEY);
    setLegalAcceptancePending(false);
  }, [getToken]);

  const startSocialSignIn = useCallback(async (provider: "google" | "apple") => {
    setErrorMessage("");
    if (!adultConfirmed) {
      showConsentError("An adult must confirm the Terms and parent/guardian permission before continuing.");
      return;
    }
    setLoadingProvider(provider);
    let sessionCreated = false;
    try {
      await AsyncStorage.setItem(
        LEGAL_ACCEPTANCE_PENDING_KEY,
        JSON.stringify(CURRENT_LEGAL_ACCEPTANCE),
      );
      setLegalAcceptancePending(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: provider === "google" ? "oauth_google" : "oauth_apple",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "mobile" }),
      });

      if (!createdSessionId || !setActive) {
        await AsyncStorage.removeItem(LEGAL_ACCEPTANCE_PENDING_KEY);
        setLegalAcceptancePending(false);
        setErrorMessage(
          "Sign-in needs another step. Return here and try again, or continue as a guest.",
        );
        return;
      }

      sessionCreated = true;
      await setActive({
        session: createdSessionId,
        navigate: async () => {
          try {
            await persistLegalAcceptance();
            await AsyncStorage.setItem(GUEST_ACCESS_KEY, "true");
            setGuestAccepted(true);
            if (!initialWelcome && router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          } catch {
            setLegalAcceptancePending(true);
            setErrorMessage(
              "Your account is signed in, but we couldn't save your agreement. Check your connection and retry.",
            );
          }
        },
      });
    } catch {
      if (!sessionCreated) {
        await AsyncStorage.removeItem(LEGAL_ACCEPTANCE_PENDING_KEY).catch(() => {});
        setLegalAcceptancePending(false);
      }
      setErrorMessage(
        "Sign-in didn't finish. Check your connection and try again. If this keeps happening, ask the app owner to check the Google or Apple sign-in setup.",
      );
    } finally {
      setLoadingProvider(null);
    }
  }, [adultConfirmed, initialWelcome, persistLegalAcceptance, router, setGuestAccepted, showConsentError, startSSOFlow]);

  const continueAsGuest = useCallback(async () => {
    setErrorMessage("");
    if (initialWelcome) {
      if (!adultConfirmed) {
        showConsentError("A parent or guardian must confirm permission before a learner under 18 can practice.");
        return;
      }
      try {
        await AsyncStorage.setItem(
          LEGAL_GUEST_ACCEPTANCE_KEY,
          JSON.stringify({
            ...CURRENT_LEGAL_ACCEPTANCE,
            acceptedAt: new Date().toISOString(),
          }),
        );
        await AsyncStorage.setItem(GUEST_ACCESS_KEY, "true");
        setGuestAccepted(true);
        router.replace("/(tabs)");
      } catch {
        setErrorMessage("Guest mode couldn't be saved. Please try again.");
      }
    } else {
      goBack();
    }
  }, [adultConfirmed, goBack, initialWelcome, router, setGuestAccepted, showConsentError]);

  const retryLegalAcceptance = useCallback(async () => {
    setErrorMessage("");
    try {
      await persistLegalAcceptance();
      await AsyncStorage.setItem(GUEST_ACCESS_KEY, "true");
      setGuestAccepted(true);
      if (initialWelcome) {
        router.replace("/(tabs)");
      } else {
        goBack();
      }
    } catch {
      setLegalAcceptancePending(true);
      setErrorMessage("We still couldn't save your agreement. Check your connection and try again.");
    }
  }, [goBack, initialWelcome, persistLegalAcceptance, router, setGuestAccepted]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
      goBack();
    } catch {
      setErrorMessage("Couldn't sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }, [goBack, signOut]);

  const syncLabel = {
    local: "This device only",
    syncing: "Syncing your progress…",
    synced: "Progress is synced",
    error: "Progress is saved here; sync will retry",
  }[cloudSyncStatus];

  const chooseAppearance = async (preference: ThemePreference) => {
    setAppearanceError("");
    try {
      await setThemePreference(preference);
    } catch {
      setAppearanceError("Couldn't save your appearance choice. Please try again.");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showWelcomeDesign && (
        <LinearGradient
          colors={initialWelcome
            ? colors.colorScheme === "dark"
              ? ["#0B1530", "#142452", colors.background]
              : ["#EAF3FF", "#FFFFFF", "#FFFFFF"]
            : [colors.accent, colors.background, colors.background]}
          locations={initialWelcome ? [0, 0.6, 1] : [0, 0.45, 1]}
          style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
        />
      )}
      {initialWelcome && <WelcomeClouds colors={colors} />}
      <Animated.ScrollView
        onScroll={initialWelcome ? scrollHandler : undefined}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          initialWelcome
            ? styles.initialWelcomeContent
            : showWelcomeDesign ? styles.welcomeContent : null,
          initialWelcome
            ? {
                paddingTop: Math.max(insets.top, 16) + 14,
                paddingBottom: Math.max(insets.bottom, 12) + 24,
                minHeight: viewportHeight,
              }
            : {
                paddingTop: Math.max(insets.top, 16) + 12,
                paddingBottom: insets.bottom + 28,
              },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!initialWelcome && (
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to the previous screen"
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
          </Pressable>
        )}

        {showWelcomeDesign ? (
          initialWelcome ? (
            <WelcomeEntrance reduced={reduceMotion} delay={0}>
              <>
              <WelcomeBrandMark compact />
              <View style={styles.initialWelcomeKicker}>
                <View style={[styles.kickerLine, { backgroundColor: colors.primary }]} />
                <Text style={[styles.initialWelcomeEyebrow, { color: colors.primary }]}>
                  LANGUAGES FOR A BRIGHTER YOU
                </Text>
                <View style={[styles.kickerLine, { backgroundColor: colors.primary }]} />
              </View>
              </>
            </WelcomeEntrance>
          ) : (
            <>
              <WelcomeBrandMark />
              <View style={styles.welcomeKicker}>
                <View style={[styles.kickerLine, { backgroundColor: colors.primary }]} />
                <Text style={[styles.welcomeEyebrow, { color: colors.primary }]}>
                  LANGUAGE THAT LASTS
                </Text>
                <View style={[styles.kickerLine, { backgroundColor: colors.primary }]} />
              </View>
            </>
          )
        ) : (
          <>
            <View style={[styles.heroIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="globe-outline" size={31} color={colors.primary} />
            </View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>LEARNER ACCOUNT</Text>
          </>
        )}
        {(!initialWelcome || isSignedIn) && (
          <>
            <Text style={[styles.title, showWelcomeDesign && styles.welcomeTitle, { color: colors.foreground }]}>
              {isSignedIn
                ? "Your progress goes with you."
                : "Save your learning progress."}
            </Text>
            <Text style={[styles.subtitle, showWelcomeDesign && styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
              {isSignedIn
                ? "Your lessons and achievements are connected to your learner account."
                : "Sign in to carry lessons and achievements across devices, or practice as a guest on this device."}
            </Text>
          </>
        )}

        {initialWelcome && !isSignedIn && (
          <>
            <WelcomeEntrance reduced={reduceMotion} delay={60} style={styles.welcomeHeadlineGroup}>
              <View style={styles.welcomeHeadline}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[styles.welcomeHeadlineLine, { color: colors.foreground }]}
                >
                  Learn new words.
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[styles.welcomeHeadlineLine, { color: colors.foreground }]}
                >
                  Explore <Text style={{ color: colors.primary }}>new worlds.</Text>
                </Text>
              </View>
              <Text style={[styles.initialWelcomeSubtitle, { color: colors.mutedForeground }]}>
                Build your vocabulary through fun games and get closer to new cultures.
              </Text>
            </WelcomeEntrance>
            <WelcomeEntrance reduced={reduceMotion} delay={120}>
              <Animated.View
                style={[
                  styles.welcomeHeroFrame,
                  { height: welcomeHeroHeight },
                  mascotFloatStyle,
                ]}
              >
                <Image
                  source={require("../assets/images/welcome-mascot.png")}
                  style={styles.welcomeHeroImage}
                  resizeMode="contain"
                  accessibilityRole="image"
                  accessibilityLabel="Lingua mascot on a globe with world landmarks"
                />
                <LinearGradient
                  colors={colors.colorScheme === "dark"
                    ? ["rgba(11,21,48,0.92)", "rgba(11,21,48,0)"]
                    : ["rgba(248,250,252,0.92)", "rgba(248,250,252,0)"]}
                  locations={[0, 1]}
                  style={[styles.welcomeImageTopFade, { pointerEvents: "none" }]}
                />
                <LinearGradient
                  colors={colors.colorScheme === "dark"
                    ? ["rgba(11,21,48,0)", colors.background]
                    : ["rgba(255,255,255,0)", colors.background]}
                  locations={[0, 1]}
                  style={[styles.welcomeImageFade, { pointerEvents: "none" }]}
                />
              </Animated.View>
            </WelcomeEntrance>
          </>
        )}

        {isSignedIn ? (
          <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.accountAvatar, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={styles.accountText}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>
                {user?.fullName || "Learner"}
              </Text>
              <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>
                {user?.primaryEmailAddress?.emailAddress || "Signed in"}
              </Text>
              <View style={styles.syncRow}>
                <View
                  style={[
                    styles.syncDot,
                    { backgroundColor: cloudSyncStatus === "error" ? colors.destructive : colors.success },
                  ]}
                />
                <Text style={[styles.syncText, { color: colors.mutedForeground }]}>
                  {syncLabel}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.buttons, initialWelcome && styles.welcomeButtons]}>
            {!initialWelcome && (
              <View style={styles.legalLinks}>
                <Pressable onPress={() => router.push("/terms")} accessibilityRole="link">
                  <Text style={[styles.legalLink, { color: colors.primary }]}>Terms of Service</Text>
                </Pressable>
                <Text style={{ color: colors.mutedForeground }}>·</Text>
                <Pressable onPress={() => router.push("/privacy")} accessibilityRole="link">
                  <Text style={[styles.legalLink, { color: colors.primary }]}>Privacy Policy</Text>
                </Pressable>
              </View>
            )}
            {initialWelcome && !!errorMessage && (
              <WelcomeEntrance key={errorMessage} reduced={reduceMotion} style={styles.welcomeErrorWrap}>
                <View
                  accessibilityRole="alert"
                  style={[styles.welcomeErrorBanner, { backgroundColor: colors.destructive + "14" }]}
                >
                  <Ionicons name="alert-circle" size={17} color={colors.destructive} />
                  <Text style={[styles.error, styles.welcomeErrorText, { color: colors.destructive }]}>
                    {errorMessage}
                  </Text>
                </View>
              </WelcomeEntrance>
            )}
            {providerOrder.map((provider) => {
              const isApple = provider === "apple";
              const providerLabel = isApple ? "Apple" : "Google";
              const providerColor = isApple
                ? initialWelcome
                  ? colors.colorScheme === "dark" ? "#000000" : "#FFFFFF"
                  : colors.background
                : initialWelcome ? "#202124" : colors.foreground;
              const providerBackground = isApple
                ? initialWelcome
                  ? colors.colorScheme === "dark" ? "#FFFFFF" : "#000000"
                  : colors.foreground
                : initialWelcome ? "#FFFFFF" : colors.card;
              if (!initialWelcome) {
                return (
                <Pressable
                  key={provider}
                  testID={`sign-in-${provider}`}
                  onPress={() => void startSocialSignIn(provider)}
                  onPressIn={initialWelcome ? welcomeActionFeedback : undefined}
                  disabled={loadingProvider !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue with ${providerLabel}`}
                  style={({ pressed }) => [
                    isApple ? styles.appleButton : styles.googleButton,
                    {
                      backgroundColor: providerBackground,
                      borderColor: initialWelcome && !isApple ? "#DADCE0" : colors.border,
                    },
                    styles.accountProviderButton,
                    pressed && (initialWelcome ? styles.welcomeButtonPressed : styles.buttonPressed),
                    loadingProvider !== null && styles.disabledButton,
                  ]}
                >
                  {loadingProvider === provider ? (
                    <ActivityIndicator color={providerColor} />
                  ) : (
                    isApple ? (
                      <Ionicons name="logo-apple" size={22} color={providerColor} />
                    ) : initialWelcome ? (
                      <Svg width={20} height={20} viewBox="0 0 48 48">
                        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.81 7.18l7.72 5.99c4.51-4.16 7.16-10.29 7.16-17.64z" />
                        <Path fill="#34A853" d="M24 48c6.48 0 11.94-2.14 15.92-5.81l-7.72-5.99c-2.14 1.43-4.89 2.27-8.2 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <Path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a23.86 23.86 0 0 0 0 21.56l7.98-6.19z" />
                        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      </Svg>
                    ) : (
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                    )
                  )}
                  <Text
                    style={[
                      isApple ? styles.appleText : styles.googleText,
                      { color: providerColor },
                    ]}
                  >
                    Continue with {providerLabel}
                  </Text>
                </Pressable>
                );
              }
              return (
                <WelcomeEntrance key={`entrance-${provider}`} reduced={reduceMotion} delay={190 + providerOrder.indexOf(provider) * 60}>
                  <WelcomeActionPressable
                    testID={`sign-in-${provider}`}
                    onPress={() => void startSocialSignIn(provider)}
                    onPressIn={welcomeActionFeedback}
                    disabled={loadingProvider !== null}
                    accessibilityLabel={`Continue with ${providerLabel}`}
                    reduceMotion={reduceMotion}
                    style={({ pressed }) => [
                      isApple ? styles.appleButton : styles.googleButton,
                      {
                        backgroundColor: providerBackground,
                        borderColor: initialWelcome && !isApple ? "#DADCE0" : colors.border,
                      },
                      styles.welcomeProviderButton,
                      pressed && styles.welcomeButtonPressed,
                      loadingProvider !== null && styles.disabledButton,
                    ]}
                  >
                    {loadingProvider === provider ? (
                      <ActivityIndicator color={providerColor} />
                    ) : isApple ? (
                      <Ionicons name="logo-apple" size={22} color={providerColor} />
                    ) : (
                      <Svg width={20} height={20} viewBox="0 0 48 48">
                        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.81 7.18l7.72 5.99c4.51-4.16 7.16-10.29 7.16-17.64z" />
                        <Path fill="#34A853" d="M24 48c6.48 0 11.94-2.14 15.92-5.81l-7.72-5.99c-2.14 1.43-4.89 2.27-8.2 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <Path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a23.86 23.86 0 0 0 0 21.56l7.98-6.19z" />
                        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      </Svg>
                    )}
                    <Text style={[isApple ? styles.appleText : styles.googleText, { color: providerColor }]}>
                      Continue with {providerLabel}
                    </Text>
                  </WelcomeActionPressable>
                </WelcomeEntrance>
              );
            })}

            {initialWelcome ? (
              <WelcomeEntrance reduced={reduceMotion} delay={310}>
                <WelcomeActionPressable
                  testID="continue-as-guest"
                  onPress={() => void continueAsGuest()}
                  onPressIn={welcomeActionFeedback}
                  disabled={loadingProvider !== null}
                  accessibilityLabel="Continue as a guest"
                  reduceMotion={reduceMotion}
                  style={({ pressed }) => [
                    styles.guestButton,
                    styles.welcomeGuestButton,
                    { borderColor: colors.primary, backgroundColor: colors.accent },
                    pressed && styles.welcomeButtonPressed,
                    loadingProvider !== null && styles.disabledButton,
                  ]}
                >
                  <Text style={[styles.guestText, styles.welcomeGuestText, { color: colors.primary }]}>
                    Continue as a guest
                  </Text>
                  <Ionicons name="arrow-forward" size={19} color={colors.primary} style={styles.guestArrow} />
                </WelcomeActionPressable>
              </WelcomeEntrance>
            ) : (
              <Pressable
              testID="continue-as-guest"
              onPress={() => void continueAsGuest()}
              onPressIn={initialWelcome ? welcomeActionFeedback : undefined}
              disabled={loadingProvider !== null}
              accessibilityRole="button"
              accessibilityLabel={initialWelcome ? "Continue as a guest" : "Keep practicing as a guest"}
              style={({ pressed }) => [
                styles.guestButton,
                initialWelcome && styles.welcomeGuestButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                pressed && (initialWelcome ? styles.welcomeButtonPressed : styles.buttonPressed),
              ]}
            >
              <Text style={[styles.guestText, { color: colors.primary }]}>
                {initialWelcome ? "Continue as a guest" : "Keep practicing as a guest"}
              </Text>
              {initialWelcome && (
                <Ionicons name="arrow-forward" size={19} color={colors.primary} style={styles.guestArrow} />
              )}
              </Pressable>
            )}
            {initialWelcome && (
              <Text style={[styles.guestWarning, styles.welcomeGuestWarning, { color: colors.mutedForeground }]}>
                If you don&apos;t sign in, your progress won&apos;t be saved to an account.
              </Text>
            )}
            {!initialWelcome && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: adultConfirmed }}
                accessibilityLabel="I am an adult, agree to the Terms, acknowledge the Privacy Policy, and confirm parent or guardian permission for learners under 18"
                style={styles.legalConsent}
              >
                <View
                  style={[
                    styles.consentCheckbox,
                    {
                      borderColor: adultConfirmed ? colors.primary : colors.border,
                      backgroundColor: adultConfirmed ? colors.primary : colors.card,
                    },
                  ]}
                >
                  {adultConfirmed && (
                    <Ionicons name="checkmark" size={15} color={colors.primaryForeground} />
                  )}
                </View>
                <Text style={[styles.consentText, { color: colors.foreground }]}>
                  I’m 18 or older, agree to the Terms of Service, and acknowledge the Privacy Policy. If a learner under 18 uses LinguaMatch, I’m their parent or guardian and permit their use.
                </Text>
              </Pressable>
            )}
            {initialWelcome && (
              <>
                <WelcomeEntrance reduced={reduceMotion} delay={370} style={styles.welcomeConsentWrap}>
                  <Animated.View style={consentShakeStyle}>
                    <Pressable
                      onPress={toggleWelcomeConsent}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: adultConfirmed }}
                      accessibilityLabel="I am an adult, agree to the Terms, acknowledge the Privacy Policy, and confirm parent or guardian permission for learners under 18"
                      style={[
                        styles.legalConsent,
                        styles.welcomeLegalConsent,
                        {
                          backgroundColor: colors.card,
                          borderColor: consentNeedsAttention ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.consentCheckbox,
                          styles.welcomeConsentCheckbox,
                          {
                            borderColor: adultConfirmed || consentNeedsAttention ? colors.primary : colors.border,
                            backgroundColor: adultConfirmed ? colors.primary : colors.card,
                          },
                        ]}
                      >
                        {adultConfirmed && (
                          <WelcomeConsentCheckmark
                            color={colors.primaryForeground}
                            reduced={reduceMotion}
                          />
                        )}
                      </View>
                      <Text style={[styles.consentText, styles.welcomeConsentText, { color: colors.mutedForeground }]}>
                        I’m 18 or older, agree to the Terms of Service, and acknowledge the Privacy Policy. If a learner under 18 uses LinguaMatch, I’m their parent or guardian and permit their use.
                      </Text>
                    </Pressable>
                  </Animated.View>
                </WelcomeEntrance>
                <WelcomeEntrance reduced={reduceMotion} delay={430}>
                <Text style={[styles.welcomeFooter, { color: colors.mutedForeground }]}>
                  By continuing, you agree to our{" "}
                  <Text
                    onPress={() => router.push("/terms")}
                    accessibilityRole="link"
                    accessibilityLabel="Terms of Service"
                    style={[styles.welcomeFooterLink, { color: colors.primary }]}
                  >
                    Terms of Service
                  </Text>
                  {" "}and{" "}
                  <Text
                    onPress={() => router.push("/privacy")}
                    accessibilityRole="link"
                    accessibilityLabel="Privacy Policy"
                    style={[styles.welcomeFooterLink, { color: colors.primary }]}
                  >
                    Privacy Policy
                  </Text>.
                </Text>
                </WelcomeEntrance>
              </>
            )}
          </View>
        )}

        {isSignedIn && (
          legalAcceptancePending && (
            <View style={[styles.pendingCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Text style={[styles.pendingText, { color: colors.foreground }]}>
                Your agreement still needs to be saved to your account.
              </Text>
              <Pressable
                onPress={() => void retryLegalAcceptance()}
                accessibilityRole="button"
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          )
        )}

        {isSignedIn && (
          <Pressable
            onPress={() => void handleSignOut()}
            disabled={signingOut}
            accessibilityRole="button"
            style={[styles.signOutButton, { borderColor: colors.border }]}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.mutedForeground} />
            ) : (
              <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>
                Sign out
              </Text>
            )}
          </Pressable>
        )}

        {!initialWelcome && (
          <View style={[styles.appearanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.appearanceHeader}>
              <View style={styles.appearanceHeading}>
                <Text style={[styles.appearanceTitle, { color: colors.foreground }]}>Appearance</Text>
                <Text style={[styles.appearanceSubtitle, { color: colors.mutedForeground }]}>
                  Choose a theme for LinguaMatch.
                </Text>
              </View>
              <Ionicons
                name={themePreference === "dark" ? "moon-outline" : "sunny-outline"}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.appearanceOptions}>
              {APPEARANCE_OPTIONS.map((option) => {
                const selected = themePreference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    testID={`appearance-${option.value}`}
                    onPress={() => void chooseAppearance(option.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`Use ${option.label.toLowerCase()} appearance`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.appearanceOption,
                      {
                        backgroundColor: selected ? colors.primary : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={15}
                      color={selected ? colors.primaryForeground : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.appearanceOptionText,
                        { color: selected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!!appearanceError && (
              <Text accessibilityRole="alert" style={[styles.appearanceError, { color: colors.destructive }]}>
                {appearanceError}
              </Text>
            )}
          </View>
        )}

        {!initialWelcome && !!errorMessage && (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>
            {errorMessage}
          </Text>
        )}

        {!initialWelcome && (
          <View style={[
            styles.privacyNote,
            showWelcomeDesign && styles.welcomePrivacyNote,
            { backgroundColor: colors.accent, borderColor: colors.leftCardBg },
          ]}>
            {showWelcomeDesign ? (
              <View style={[styles.privacyIcon, { backgroundColor: colors.leftCardBg }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
              </View>
            ) : (
              <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
            )}
            <Text style={[styles.privacyText, { color: colors.accentForeground }]}>
              Guest progress stays on this device. Signing in syncs progress to your learner account.
            </Text>
          </View>
        )}

        {!showWelcomeDesign && (
          <View style={styles.accountLegalLinks}>
            <Pressable onPress={() => router.push("/terms")} accessibilityRole="link">
              <Text style={[styles.legalLink, { color: colors.primary }]}>Terms of Service</Text>
            </Pressable>
            <Text style={{ color: colors.mutedForeground }}>·</Text>
            <Pressable onPress={() => router.push("/privacy")} accessibilityRole="link">
              <Text style={[styles.legalLink, { color: colors.primary }]}>Privacy Policy</Text>
            </Pressable>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  welcomeContent: { maxWidth: 450, paddingHorizontal: 22 },
  initialWelcomeContent: { maxWidth: 440, paddingHorizontal: 24 },
  cloud: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.12,
    boxShadow: "0px 0px 44px rgba(76,141,255,0.18)",
  },
  cloudTopLeft: { width: 250, height: 150, top: -68, left: -105 },
  cloudTopRight: { width: 230, height: 145, top: 28, right: -118, opacity: 0.08 },
  cloudMidRight: { width: 190, height: 130, top: "46%", right: -120, opacity: 0.07 },
  cloudBottomLeft: { width: 250, height: 140, bottom: -66, left: -120, opacity: 0.08 },
  welcomePressableWrap: { width: "100%" },
  welcomeHeadlineGroup: { width: "100%", marginTop: 16 },
  welcomeHeroFrame: {
    alignSelf: "stretch",
    overflow: "hidden",
    marginHorizontal: -24,
    marginTop: 8,
    marginBottom: 9,
  },
  welcomeHeroImage: { width: "100%", height: "100%" },
  welcomeImageTopFade: { position: "absolute", left: 0, right: 0, top: 0, height: 24 },
  welcomeImageFade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 32 },
  welcomeHeadline: { alignItems: "center", marginTop: 0 },
  welcomeHeadlineLine: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  welcomeTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 32,
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -1.15,
    marginTop: 1,
  },
  welcomeSubtitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  initialWelcomeSubtitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 8,
  },
  welcomeLegalConsent: {
    alignItems: "flex-start",
    marginTop: 3,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    gap: 11,
  },
  welcomeConsentCheckbox: { width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 0 },
  welcomeConsentText: { textAlign: "left", fontSize: 12, lineHeight: 17 },
  welcomeKicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 0,
  },
  initialWelcomeKicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 0,
  },
  kickerLine: { width: 18, height: 2, borderRadius: 2, opacity: 0.55 },
  welcomeEyebrow: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.7,
  },
  initialWelcomeEyebrow: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  welcomeButtons: { marginTop: 5, gap: 10 },
  welcomeGuestWarning: { marginTop: -3, marginBottom: 2, fontSize: 11, lineHeight: 15 },
  welcomeConsentWrap: { width: "100%", marginTop: 1 },
  welcomeFooter: {
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  welcomeFooterLink: { fontFamily: "Nunito_700Bold", textDecorationLine: "none" },
  welcomeErrorWrap: { width: "100%", marginBottom: 1 },
  welcomeErrorBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  welcomeErrorText: { flex: 1, marginTop: 0, lineHeight: 18 },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginBottom: 26,
  },
  backText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  eyebrow: { fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1.2, marginBottom: 10 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  subtitle: { fontFamily: "Nunito_600SemiBold", fontSize: 16, lineHeight: 23, marginTop: 12, marginBottom: 28 },
  buttons: { gap: 11 },
  googleButton: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  googleText: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  appleButton: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  appleText: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  guestButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1.5,
    marginTop: 2,
  },
  guestText: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  welcomeGuestText: { fontSize: 16 },
  guestWarning: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  disabledButton: { opacity: 0.55 },
  accountProviderButton: { minHeight: 54, borderRadius: 16 },
  welcomeProviderButton: { minHeight: 56, borderRadius: 18 },
  welcomeGuestButton: { minHeight: 56, borderRadius: 18, borderWidth: 1 },
  welcomeButtonPressed: { opacity: 0.94 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  guestArrow: { position: "absolute", right: 20 },
  legalConsent: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 },
  consentCheckbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  consentText: { flex: 1, fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 18 },
  legalLinks: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9, marginBottom: 3 },
  accountLegalLinks: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 18 },
  legalLink: { fontFamily: "Nunito_700Bold", fontSize: 13, lineHeight: 20, textDecorationLine: "underline" },
  pendingCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10, marginTop: 14 },
  pendingText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  retryText: { fontFamily: "Nunito_700Bold", fontSize: 13 },
  accountCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: { flex: 1 },
  accountName: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  accountEmail: { fontFamily: "Nunito_600SemiBold", fontSize: 13, marginTop: 3 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  signOutButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  signOutText: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  error: { fontFamily: "Nunito_600SemiBold", fontSize: 13, lineHeight: 19, marginTop: 16 },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 13,
    borderRadius: 14,
    marginTop: 22,
  },
  privacyText: { flex: 1, fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 18 },
  welcomePrivacyNote: { borderWidth: 1, marginTop: 17, gap: 10 },
  privacyIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  appearanceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
  },
  appearanceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  appearanceHeading: { flex: 1, marginRight: 12 },
  appearanceTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  appearanceSubtitle: { fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 17, marginTop: 3 },
  appearanceOptions: { flexDirection: "row", gap: 8, marginTop: 14 },
  appearanceOption: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  appearanceOptionText: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  appearanceError: { fontFamily: "Nunito_600SemiBold", fontSize: 12, lineHeight: 17, marginTop: 9 },
});
