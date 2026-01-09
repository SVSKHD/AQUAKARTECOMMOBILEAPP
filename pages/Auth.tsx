import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Dimensions,
    Image,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { triggerHaptic, triggerSelectionHaptic, triggerNotificationHaptic } from '../utils/haptics';

type AuthMode = 'email' | 'mobile';

type AuthPageProps = {
    onLoginSuccess: () => void;
};

const { width } = Dimensions.get('window');

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<AuthMode>('mobile');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [resendSeconds, setResendSeconds] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const formSlideAnim = useRef(new Animated.Value(42)).current;

    // Refs for better flow
    const emailRef = useRef<TextInput>(null);
    const mobileRef = useRef<TextInput>(null);
    const otpRef = useRef<TextInput>(null);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 650,
                useNativeDriver: true,
            }),
            Animated.timing(formSlideAnim, {
                toValue: 0,
                duration: 650,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Resend timer
    useEffect(() => {
        if (resendSeconds <= 0) return;
        const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [resendSeconds]);

    const identifierOk = useMemo(() => {
        if (mode === 'email') return email.trim().includes('@') && email.trim().includes('.');
        return mobile.trim().length === 10;
    }, [mode, email, mobile]);

    const handleSendOtp = async () => {
        triggerHaptic();
        setError(null);

        if (!identifierOk) {
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
            setError(mode === 'email' ? 'Enter a valid email address' : 'Enter a valid 10-digit mobile number');
            return;
        }

        try {
            setIsSending(true);

            // TODO: call your backend here
            // await api.sendOtp({ mode, email, mobile })

            // Simulate network
            await new Promise((r) => setTimeout(r, 700));

            setShowOtpInput(true);
            setOtp('');
            setResendSeconds(30);

            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);

            // focus OTP
            requestAnimationFrame(() => otpRef.current?.focus());
        } catch (e) {
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
            setError('Failed to send OTP. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleLogin = async () => {
        triggerHaptic();
        setError(null);

        if (otp.trim().length < 4) {
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
            setError('Enter OTP to continue');
            return;
        }

        try {
            setIsVerifying(true);

            // TODO: verify OTP with backend
            // await api.verifyOtp({ mode, email, mobile, otp })

            await new Promise((r) => setTimeout(r, 650));
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
            onLoginSuccess();
        } catch (e) {
            triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
            setError('Invalid OTP. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBack = () => {
        triggerSelectionHaptic();
        setShowOtpInput(false);
        setOtp('');
        setError(null);
        requestAnimationFrame(() => {
            if (mode === 'email') emailRef.current?.focus();
            else mobileRef.current?.focus();
        });
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar style="light" />

            {/* Dark overlay (App.tsx background shows through) */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]} />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={[styles.contentContainer, { paddingBottom: 24 + insets.bottom }]}>
                            {/* Logo / Title */}
                            <Animated.View style={[styles.logoSection, { opacity: fadeAnim }]}>
                                <View style={styles.logoGlass}>
                                    <Image
                                        source={require('../assets/logo-white.png')}
                                        style={{ width: 56, height: 56, tintColor: '#fff' }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.welcomeText}>Welcome to AquaKart</Text>
                                <Text style={styles.taglineText}>Pure Water. Pure Life.</Text>
                            </Animated.View>

                            {/* Form */}
                            <Animated.View
                                style={[
                                    styles.glassFormContainer,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateY: formSlideAnim }],
                                    },
                                ]}
                            >
                                {!showOtpInput && (
                                    <View style={styles.tabsContainer}>
                                        <TouchableOpacity
                                            style={[styles.tab, mode === 'mobile' && styles.activeTab]}
                                            onPress={() => {
                                                triggerSelectionHaptic();
                                                setMode('mobile');
                                                setError(null);
                                                requestAnimationFrame(() => mobileRef.current?.focus());
                                            }}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={[styles.tabText, mode === 'mobile' && styles.activeTabText]}>Mobile</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.tab, mode === 'email' && styles.activeTab]}
                                            onPress={() => {
                                                triggerSelectionHaptic();
                                                setMode('email');
                                                setError(null);
                                                requestAnimationFrame(() => emailRef.current?.focus());
                                            }}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={[styles.tabText, mode === 'email' && styles.activeTabText]}>Email</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {!!error && (
                                    <View style={styles.errorBox}>
                                        <Ionicons name="alert-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                <View style={styles.formContent}>
                                    {!showOtpInput ? (
                                        <>
                                            <View style={styles.inputWrapper}>
                                                <LinearGradient
                                                    colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)']}
                                                    style={styles.inputGradient}
                                                >
                                                    <Ionicons
                                                        name={mode === 'email' ? 'mail-outline' : 'call-outline'}
                                                        size={22}
                                                        color="rgba(255,255,255,0.85)"
                                                        style={styles.inputIcon}
                                                    />

                                                    {mode === 'email' ? (
                                                        <TextInput
                                                            ref={emailRef}
                                                            style={styles.input}
                                                            placeholder="Email Address"
                                                            placeholderTextColor="rgba(255,255,255,0.45)"
                                                            value={email}
                                                            onChangeText={(t) => {
                                                                setEmail(t);
                                                                setError(null);
                                                            }}
                                                            keyboardType="email-address"
                                                            autoCapitalize="none"
                                                            autoCorrect={false}
                                                            returnKeyType="send"
                                                            onSubmitEditing={handleSendOtp}
                                                            cursorColor="#38bdf8"
                                                        />
                                                    ) : (
                                                        <TextInput
                                                            ref={mobileRef}
                                                            style={styles.input}
                                                            placeholder="Mobile Number"
                                                            placeholderTextColor="rgba(255,255,255,0.45)"
                                                            value={mobile}
                                                            onChangeText={(t) => {
                                                                setMobile(t.replace(/[^0-9]/g, ''));
                                                                setError(null);
                                                            }}
                                                            keyboardType="phone-pad"
                                                            maxLength={10}
                                                            returnKeyType="send"
                                                            onSubmitEditing={handleSendOtp}
                                                            cursorColor="#38bdf8"
                                                        />
                                                    )}
                                                </LinearGradient>
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.primaryButton, (!identifierOk || isSending) && { opacity: 0.55 }]}
                                                onPress={handleSendOtp}
                                                activeOpacity={0.85}
                                                disabled={!identifierOk || isSending}
                                            >
                                                <LinearGradient
                                                    colors={['#0ea5e9', '#3b82f6']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.buttonGradient}
                                                >
                                                    {isSending ? (
                                                        <ActivityIndicator />
                                                    ) : (
                                                        <>
                                                            <Text style={styles.primaryButtonText}>Get OTP</Text>
                                                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                                                        </>
                                                    )}
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <View style={styles.otpHeader}>
                                                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.85}>
                                                    <Ionicons name="arrow-back" size={22} color="#fff" />
                                                </TouchableOpacity>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.otpTitle}>Verification</Text>
                                                    <Text style={styles.otpSubtitle}>
                                                        Sent to {mode === 'email' ? email.trim() : `+91 ${mobile.trim()}`}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.inputWrapper}>
                                                <LinearGradient
                                                    colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)']}
                                                    style={styles.inputGradient}
                                                >
                                                    <Ionicons name="keypad-outline" size={22} color="rgba(255,255,255,0.85)" style={styles.inputIcon} />
                                                    <TextInput
                                                        ref={otpRef}
                                                        style={[styles.input, { letterSpacing: 4, fontSize: 18 }]}
                                                        placeholder="• • • • • •"
                                                        placeholderTextColor="rgba(255,255,255,0.45)"
                                                        value={otp}
                                                        onChangeText={(t) => {
                                                            setOtp(t.replace(/[^0-9]/g, ''));
                                                            setError(null);
                                                        }}
                                                        keyboardType="number-pad"
                                                        maxLength={6}
                                                        autoFocus
                                                        returnKeyType="done"
                                                        onSubmitEditing={handleLogin}
                                                        cursorColor="#38bdf8"
                                                    />
                                                </LinearGradient>
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.primaryButton, (isVerifying || otp.trim().length < 4) && { opacity: 0.6 }]}
                                                onPress={handleLogin}
                                                activeOpacity={0.85}
                                                disabled={isVerifying || otp.trim().length < 4}
                                            >
                                                <LinearGradient
                                                    colors={['#0ea5e9', '#3b82f6']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.buttonGradient}
                                                >
                                                    {isVerifying ? (
                                                        <ActivityIndicator />
                                                    ) : (
                                                        <Text style={styles.primaryButtonText}>Verify & Login</Text>
                                                    )}
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleSendOtp}
                                                activeOpacity={0.75}
                                                style={styles.resendLink}
                                                disabled={resendSeconds > 0 || isSending}
                                            >
                                                <Text style={[styles.resendText, (resendSeconds > 0 || isSending) && { opacity: 0.5 }]}>
                                                    {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend Code'}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </Animated.View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 'auto',
        marginTop: 56,
    },
    logoGlass: {
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
        shadowColor: '#38bdf8',
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f8fafc',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    taglineText: {
        fontSize: 16,
        color: 'rgba(248, 250, 252, 0.62)',
        letterSpacing: 0.2,
    },
    glassFormContainer: {
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.70)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        padding: 22,
        marginTop: 24,
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
        overflow: 'hidden',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.30)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 18,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.45)',
    },
    activeTabText: {
        color: '#ffffff',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        marginBottom: 12,
    },
    errorText: {
        color: 'rgba(255,255,255,0.92)',
        fontWeight: '600',
        flex: 1,
    },
    formContent: {
        gap: 14,
    },
    inputWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    inputGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 58,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#ffffff',
        height: '100%',
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 6,
        shadowColor: '#38bdf8',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    otpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 6,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    otpTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    otpSubtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        marginTop: 2,
    },
    resendLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    resendText: {
        color: '#38bdf8',
        fontSize: 14,
        fontWeight: '700',
    },
});