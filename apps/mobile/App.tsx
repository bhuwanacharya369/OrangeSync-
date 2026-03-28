import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@orangesync/core';

// WebRTC Native Modules requires EAS prebuild / Custom Dev Client
import { LiveKitRoom, useRoomContext, VideoTrack, AudioTrack } from '@livekit/react-native';
import { RoomEvent, Track, Room } from 'livekit-client';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  // Call Room State
  const [roomName, setRoomName] = useState('');
  const [apiUrl, setApiUrl] = useState('http://192.168.1.99:3000'); // Default local IP format for testing
  const [callToken, setCallToken] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  const handleBiometricAuth = async () => {
    const savedEmail = await SecureStore.getItemAsync('user_email');
    const savedPassword = await SecureStore.getItemAsync('user_password');
    if (!savedEmail || !savedPassword) {
      Alert.alert('Setup Required', 'Please log in with email and password first to map your Biometrics.');
      return;
    }
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock OrangeSync Securely', fallbackLabel: 'Use Passcode' });
    if (auth.success) {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email: savedEmail, password: savedPassword });
      if (error) Alert.alert('Auth Error', error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      await SecureStore.setItemAsync('user_email', email);
      await SecureStore.setItemAsync('user_password', password);
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomName.trim()) return Alert.alert('Error', 'Enter a valid Sync ID');
    if (!session?.access_token) return Alert.alert('Error', 'Unauthorized');
    
    setLoading(true);
    try {
      // Pass the Mobile Supabase Auth Token so Next.js server validates us securely
      const response = await fetch(`${apiUrl}/api/livekit?room=${roomName.toUpperCase()}`, {
         headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch token');
      setCallToken(data.token);
    } catch (e: any) {
      Alert.alert('Network Error', e.message + "\nMake sure the NextJS IP address is correct and your PC firewall allows local network traffic on port 3000.");
    }
    setLoading(false);
  };

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#EA580C" /></View>;
  }

  // --- 1. BIOMETRIC AUTH LOGIN SCREEN ---
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContainer}>
          <Text style={styles.title}>OrangeSync</Text>
          <Text style={styles.subtitle}>Mobile Secured Access</Text>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#FDBA74" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#FDBA74" secureTextEntry value={password} onChangeText={setPassword} />
          
          <TouchableOpacity style={styles.button} onPress={handleEmailLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          {isBiometricSupported && (
            <TouchableOpacity style={styles.bioButton} onPress={handleBiometricAuth}>
              <Text style={styles.bioButtonText}>Use FaceID / TouchID</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- 2. WEBRTC LIVE VIDEO ROOM SCREEN ---
  if (callToken) {
    return (
       <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
         <LiveKitRoom
           token={callToken}
           serverUrl={process.env.EXPO_PUBLIC_LIVEKIT_URL || 'wss://mock.livekit.cloud'}
           connect={true}
           audio={true}
           video={true}
           onDisconnected={() => setCallToken('')}
         >
           <RoomView onLeave={() => setCallToken('')} />
         </LiveKitRoom>
       </SafeAreaView>
    );
  }

  // --- 3. DASHBOARD LOBBY SCREEN ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.dashboardContainer}>
        <Text style={styles.welcomeText}>Welcome {session.user.user_metadata?.full_name || session.user.email}!</Text>
        <Text style={styles.idText}>My Sync ID: {session.user.user_metadata?.app_unique_id || 'SYNC-XXXXXX'}</Text>
        
        <View style={styles.card}>
           <Text style={styles.cardTitle}>Host / Web Server IP</Text>
           <Text style={styles.cardDesc}>Enter your Windows laptop's local IPv4 to connect.</Text>
           <TextInput style={styles.input} value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" keyboardType="url"/>
           
           <Text style={[styles.cardTitle, {marginTop: 16}]}>Join a Video Call</Text>
           <TextInput style={styles.input} placeholder="Room or Sync ID" placeholderTextColor="#FDBA74" value={roomName} onChangeText={setRoomName} autoCapitalize="characters" />
           <TouchableOpacity style={styles.button} onPress={joinRoom}>
             <Text style={styles.buttonText}>Join Live Room</Text>
           </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, { marginTop: 40, backgroundColor: '#1F2937' }]} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.buttonText}>Sign Out Securely</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Mobile specific LiveKit sub-component since `useRoomContext` must be inside `<LiveKitRoom>`
const RoomView = ({ onLeave }: { onLeave: () => void }) => {
  const room = useRoomContext();
  const [participants, setParticipants] = useState(room.participants);

  useEffect(() => {
    room.on(RoomEvent.ParticipantConnected, () => setParticipants(new Map(room.participants)));
    room.on(RoomEvent.ParticipantDisconnected, () => setParticipants(new Map(room.participants)));
    return () => { room.removeAllListeners(); };
  }, [room]);

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
         <Text style={{ color: '#fff' }}>Mobile Video Tracking (Total: {participants.size})</Text>
         <Text style={{ color: '#EA580C', fontSize: 12 }}>Note: Full native rendering requires EAS Build</Text>
      </View>
      <View style={{ padding: 24, paddingBottom: 40, backgroundColor: '#222' }}>
         <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={() => { room.disconnect(); onLeave(); }}>
           <Text style={styles.buttonText}>Leave Call</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  dashboardContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 42, fontWeight: '900', color: '#EA580C', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9A3412', textAlign: 'center', marginBottom: 32, fontWeight: '600' },
  idText: { fontSize: 20, color: '#C05621', textAlign: 'center', marginBottom: 32, fontWeight: '800' },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#EA580C', marginBottom: 4, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#FED7AA' },
  cardTitle: { fontSize: 18, color: '#9A3412', fontWeight: '800', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#FDBA74', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 16, padding: 16, marginBottom: 16, fontSize: 16, color: '#EA580C', fontWeight: '700' },
  button: { backgroundColor: '#EA580C', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#EA580C', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  bioButton: { backgroundColor: '#FFEDD5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#FDBA74' },
  bioButtonText: { color: '#C05621', fontSize: 16, fontWeight: 'bold' },
});

export default function AppWrapper() {
  return <App />;
}
