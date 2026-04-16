import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../../../components/Button';
import HeaderBackButton from '../../../components/HeaderBackButton';
import InlineButton from '../../../components/InlineButton';
import InlineNotification from '../../../components/InlineNotification';
import Input from '../../../components/Input';
import Spacer from '../../../components/Spacer';
import { COLOURS } from '../../../constants/colours';
import { getCurrentUser } from '../../../lib/auth';
import {
  linkDormToManagerByJoinCode,
  linkDormToManagerByManualCode,
  linkDormToManagerByQr,
} from '../../../lib/dorms';

export default function AddDorm() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualJoinCode, setManualJoinCode] = useState('');
  const [isLinkingManual, setIsLinkingManual] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'error' | 'success' | 'info' | 'warning' | 'tip';
    text: string;
  } | null>(null);

  const headerGradientOpacity = useRef(new Animated.Value(1)).current; // Keep solid for this page since it doesn't scroll

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setNotice(null);

    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        throw new Error('You must be signed in to link a dorm');
      }

      await linkDormToManagerByQr(user.id, data);
      setNotice({ type: 'success', text: 'Dorm linked successfully' });
      router.push('/main/manager/dorms');
    } catch (error: any) {
      setNotice({
        type: 'error',
        text: error?.message || 'Failed to link dorm from QR code',
      });
      setScanned(false);
    }
  };

  const handleManualConnect = async () => {
    const code = manualJoinCode.trim().toUpperCase();
    if (!code) {
      setNotice({ type: 'error', text: 'Please enter a manager connect code or dorm join code' });
      return;
    }

    setIsLinkingManual(true);
    setNotice(null);
    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        throw new Error('You must be signed in to link a dorm');
      }

      if (code.startsWith('DCSM-')) {
        await linkDormToManagerByManualCode(user.id, code);
      } else {
        // Backward-compatible fallback for plain join codes.
        await linkDormToManagerByJoinCode(user.id, code);
      }
      setNotice({ type: 'success', text: 'Dorm linked successfully' });
      router.push('/main/manager/dorms');
    } catch (error: any) {
      setNotice({
        type: 'error',
        text: error?.message || 'Failed to link dorm from join code',
      });
    } finally {
      setIsLinkingManual(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom' }}
      />

      {/* Header */}
      <View style={styles.topBar}>
        <HeaderBackButton iconName="times" />
      </View>

      <Animated.View
        style={[styles.headerGradientWrapper, { opacity: headerGradientOpacity }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(134, 134, 133, 0.35)', 'rgba(102, 102, 102, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.heading}>Connect a Dorm</Text>
            <Spacer size="small" />
            <Text style={styles.subheading}>
              Scan the resident QR code, or enter the dorm join code manually if scanning fails.
            </Text>

            <Spacer size="large" />

            <View style={styles.cameraWrapper}>
              {!permission ? (
                <View style={styles.permissionContainer}>
                  <Text style={[styles.subheading, { textAlign: 'center' }]}>
                    Requesting camera permission...
                  </Text>
                </View>
              ) : !permission.granted ? (
                <View style={styles.permissionContainer}>
                  <Text style={styles.fieldLabel}>Camera Access Denied</Text>
                  <Spacer size="small" />
                  <Text style={[styles.subheading, { textAlign: 'center' }]}>
                    We need access to your camera to scan dorm QR codes.
                  </Text>
                  <Spacer size="medium" />
                  <Button title="Grant Permission" onPress={requestPermission} />
                </View>
              ) : (
                <View style={styles.scannerContainer}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                  />
                  <View style={styles.overlay}>
                    <View style={styles.scanTarget} />
                  </View>
                </View>
              )}
            </View>

            <Spacer size="medium" />

            {scanned ? (
              <Text style={styles.successText}>QR Code scanned! Connecting...</Text>
            ) : (
              <Text style={styles.centerText}>Scan the student QR above</Text>
            )}

            <Spacer size="large" />

            <View style={styles.divider} />

            <Spacer size="large" />

            <Text style={styles.fieldLabel}>Manual connect code</Text>
            <Spacer size="small" />
            <Input
              value={manualJoinCode}
              onChangeText={(text) => setManualJoinCode(text.toUpperCase())}
              placeholder="e.g. DCSM-CODE12-..."
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Spacer size="medium" />

            <Button
              title={isLinkingManual ? 'Linking...' : 'Link Dorm Manually'}
              onPress={handleManualConnect}
              variant="secondary"
              disabled={isLinkingManual}
            />

            {notice && (
              <>
                <Spacer size="medium" />
                <InlineNotification type={notice.type} text={notice.text} />
              </>
            )}

            <Spacer size="large" />

            <Text style={styles.centerText}>
              Changed your mind? <InlineButton title="Go back" onPress={() => router.back()} />
            </Text>

            <Spacer size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.white,
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOURS.white,
    zIndex: 10,
  },
  headerGradientWrapper: {
    height: 6,
    width: '100%',
    zIndex: 9,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: COLOURS.black,
  },
  subheading: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: COLOURS.gray[500],
    lineHeight: 22,
  },
  fieldLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
  cameraWrapper: {
    height: 380,
    minHeight: 320,
    flexShrink: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLOURS.gray[100],
    maxHeight: 450,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLOURS.white,
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  successText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
  centerText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLOURS.black,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLOURS.gray[200],
  },
});
