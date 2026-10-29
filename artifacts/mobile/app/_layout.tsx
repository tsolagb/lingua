import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, View } from '@/components/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GameProvider } from '@/context/GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthGateContext } from '@/context/AuthGateContext';
import { ThemeProvider, useThemeSettings } from '@/context/ThemeContext';
import { GUEST_ACCESS_KEY } from '@/context/progressSnapshot';
import { useColors } from '@/hooks/useColors';
import { setBaseUrl } from '@workspace/api-client-react';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { AppTypographyProvider } from '@/components/AppText';
import { MistakeReportButton } from '@/components/MistakeReportButton';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkProxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL ?? '';
const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;

if (apiDomain) {
  setBaseUrl(`https://${apiDomain.replace(/^https?:\/\//, '')}`);
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const colors = useColors();
  const { isLoaded: themeLoaded } = useThemeSettings();
  const { isLoaded, isSignedIn } = useAuth();
  const [guestAccepted, setGuestAccepted] = React.useState(false);
  const [guestChoiceLoaded, setGuestChoiceLoaded] = React.useState(false);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(GUEST_ACCESS_KEY).then((value) => {
      if (!cancelled) {
        setGuestAccepted(value === 'true');
        setGuestChoiceLoaded(true);
      }
    }).catch(() => {
      if (!cancelled) setGuestChoiceLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !guestChoiceLoaded) return;
    const inAuthGroup = (segments[0] as string | undefined) === '(auth)';
    const isWelcomeRoute = inAuthGroup && segments[1] === 'welcome';
    const isPublicLegalRoute = ['terms', 'privacy'].includes(segments[0] as string);
    if (!isSignedIn && !guestAccepted && !inAuthGroup && !isPublicLegalRoute) {
      router.replace('/(auth)/welcome' as unknown as Href);
    } else if ((isSignedIn || guestAccepted) && inAuthGroup && !(isSignedIn && isWelcomeRoute)) {
      router.replace('/(tabs)');
    }
  }, [guestAccepted, guestChoiceLoaded, isLoaded, isSignedIn, router, segments]);

  const inAuthGroup = (segments[0] as string | undefined) === '(auth)';
  const isWelcomeRoute = inAuthGroup && segments[1] === 'welcome';
  const isPublicLegalRoute = ['terms', 'privacy'].includes(segments[0] as string);
  const waitingForRouteDecision = !isLoaded || !guestChoiceLoaded || !themeLoaded;
  const redirectingToWelcome =
    isLoaded && guestChoiceLoaded && !isSignedIn && !guestAccepted && !inAuthGroup && !isPublicLegalRoute;
  const redirectingToTabs =
    isLoaded && guestChoiceLoaded && (isSignedIn || guestAccepted) && inAuthGroup &&
    !(isSignedIn && isWelcomeRoute);

  if (waitingForRouteDecision || redirectingToWelcome || redirectingToTabs) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthGateContext.Provider value={{ guestAccepted, setGuestAccepted }}>
      <StatusBar style={colors.colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="categories" options={{ headerShown: false }} />
        <Stack.Screen name="grammar-practice" options={{ headerShown: false }} />
        <Stack.Screen name="grammar-translation" options={{ headerShown: false }} />
        <Stack.Screen name="levels" options={{ headerShown: false }} />
        <Stack.Screen name="reading-practice" options={{ headerShown: false }} />
        <Stack.Screen name="phrases" options={{ headerShown: false }} />
        <Stack.Screen name="mistake-review" options={{ headerShown: false }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
        <Stack.Screen name="verb-sentence-builder" options={{ headerShown: false }} />
        <Stack.Screen name="verb-fill-in" options={{ headerShown: false }} />
        <Stack.Screen name="verb-guide" options={{ headerShown: false }} />
        <Stack.Screen name="time-practice" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ headerShown: false }} />
        <Stack.Screen name="spelling" options={{ headerShown: false }} />
        <Stack.Screen name="flashcards" options={{ headerShown: false }} />
        <Stack.Screen name="trueorfalse" options={{ headerShown: false }} />
        <Stack.Screen name="rapidfire" options={{ headerShown: false }} />
        <Stack.Screen name="crossword" options={{ headerShown: false }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
      </Stack>
      <MistakeReportButton />
    </AuthGateContext.Provider>
  );
}

export default function RootLayout() {
  const [iconsLoaded, iconFontError] = useFonts(Ionicons.font);
  const [nunitoLoaded, nunitoError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if ((iconsLoaded || iconFontError) && (nunitoLoaded || nunitoError)) {
      void SplashScreen.hideAsync();
    }
  }, [iconsLoaded, iconFontError, nunitoLoaded, nunitoError]);

  if ((!iconsLoaded && !iconFontError) || (!nunitoLoaded && !nunitoError)) return null;

  if (!clerkPublishableKey) {
    return (
      <AppTypographyProvider loaded={nunitoLoaded}>
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
            <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              Sign-in setup is missing. Restart the app so it can load its authentication settings.
            </Text>
          </View>
        </SafeAreaProvider>
      </AppTypographyProvider>
    );
  }

  return (
    <AppTypographyProvider loaded={nunitoLoaded}>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        tokenCache={tokenCache}
        proxyUrl={clerkProxyUrl}
      >
        <SafeAreaProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <QueryClientProvider client={queryClient}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <GameProvider>
                      <RootLayoutNav />
                    </GameProvider>
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </QueryClientProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </AppTypographyProvider>
  );
}
