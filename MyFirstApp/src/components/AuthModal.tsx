import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { getApiBaseUrl, setApiBaseUrl } from '@/services/api';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { login, register, isAuthenticated, user, logout, isOnline } = useApp();
  const [isLoginTab, setIsLoginTab] = useState<boolean>(true);
  const [emailOrUsername, setEmailOrUsername] = useState<string>('demo@codetrack.dev');
  const [password, setPassword] = useState<string>('Password123!');
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>(getApiBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUseDemo = () => {
    setIsLoginTab(true);
    setEmailOrUsername('demo@codetrack.dev');
    setPassword('Password123!');
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isLoginTab) {
        if (!emailOrUsername.trim() || !password.trim()) {
          setErrorMessage('Please enter your username/email and password.');
          setIsLoading(false);
          return;
        }
        await login(emailOrUsername.trim(), password);
        Alert.alert('Welcome back!', 'Successfully signed in to CodeTrack.');
        onClose();
      } else {
        if (!email.trim() || !username.trim() || !password.trim()) {
          setErrorMessage('Please fill in email, username, and password.');
          setIsLoading(false);
          return;
        }
        await register(email.trim(), username.trim(), password, fullName.trim() || undefined);
        Alert.alert('Account Created!', 'Welcome to CodeTrack! Your progress will sync automatically.');
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveServerUrl = () => {
    if (serverUrl.trim()) {
      setApiBaseUrl(serverUrl.trim());
      Alert.alert('Server Updated', `API endpoint set to: ${serverUrl.trim()}`);
      setShowServerConfig(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-circle" size={24} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>
                  {isAuthenticated ? 'Your Account' : isLoginTab ? 'Sign In to CodeTrack' : 'Create Account'}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
                  <Text style={styles.statusText}>{isOnline ? 'Backend Connected' : 'Offline / Local Mode'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {isAuthenticated ? (
              // Authenticated user profile view
              <View style={styles.profileBox}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={36} color="#38BDF8" />
                </View>
                <Text style={styles.profileName}>{user?.fullName || user?.username}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>

                <View style={styles.statsSummaryRow}>
                  <View style={styles.profileStat}>
                    <Text style={styles.statVal}>{user?.streak || 0} 🔥</Text>
                    <Text style={styles.statLbl}>Day Streak</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.profileStat}>
                    <Text style={styles.statVal}>{user?.totalFocusMinutes || 0}m</Text>
                    <Text style={styles.statLbl}>Focus Time</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={async () => {
                    await logout();
                    Alert.alert('Signed Out', 'You are now browsing in local mode.');
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Login / Register Form
              <>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tabBtn, isLoginTab && styles.activeTabBtn]}
                    onPress={() => {
                      setIsLoginTab(true);
                      setErrorMessage(null);
                    }}
                  >
                    <Text style={[styles.tabText, isLoginTab && styles.activeTabText]}>Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, !isLoginTab && styles.activeTabBtn]}
                    onPress={() => {
                      setIsLoginTab(false);
                      setErrorMessage(null);
                    }}
                  >
                    <Text style={[styles.tabText, !isLoginTab && styles.activeTabText]}>Register</Text>
                  </TouchableOpacity>
                </View>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {isLoginTab ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Username or Email</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. demo@codetrack.dev"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        value={emailOrUsername}
                        onChangeText={setEmailOrUsername}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>

                    <TouchableOpacity style={styles.demoBtn} onPress={handleUseDemo}>
                      <Ionicons name="sparkles" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
                      <Text style={styles.demoBtnText}>Fill Demo Account (Instant Test)</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#64748B"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Username</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. python_dev"
                        placeholderTextColor="#64748B"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Full Name (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Alex Turing"
                        placeholderTextColor="#64748B"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>{isLoginTab ? 'Sign In' : 'Create Account'}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Server Settings Toggle */}
            <View style={styles.serverSettingsContainer}>
              <TouchableOpacity
                style={styles.serverToggleRow}
                onPress={() => setShowServerConfig(!showServerConfig)}
              >
                <Ionicons name="server-outline" size={16} color="#64748B" />
                <Text style={styles.serverToggleText}>Backend Endpoint Configuration</Text>
                <Ionicons name={showServerConfig ? 'chevron-up' : 'chevron-down'} size={14} color="#64748B" />
              </TouchableOpacity>

              {showServerConfig && (
                <View style={styles.serverConfigBox}>
                  <Text style={styles.serverConfigNote}>
                    Set local LAN IP if running Expo on a physical phone (e.g. http://192.168.1.100:8000/api/v1):
                  </Text>
                  <TextInput
                    style={styles.serverInput}
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.serverSaveBtn} onPress={handleSaveServerUrl}>
                    <Text style={styles.serverSaveBtnText}>Save Server URL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: '#38BDF8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 16,
  },
  demoBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  profileBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  profileStat: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  serverSettingsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
    marginTop: 8,
  },
  serverToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  serverToggleText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    marginLeft: 8,
  },
  serverConfigBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  serverConfigNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
    lineHeight: 16,
  },
  serverInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#F8FAFC',
    marginBottom: 8,
  },
  serverSaveBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  serverSaveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
});
