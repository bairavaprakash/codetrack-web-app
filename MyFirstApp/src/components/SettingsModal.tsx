import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { NotificationService } from '@/services/notifications';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AuthModal } from '@/components/AuthModal';

interface SettingsModalProps {
  visible: boolean;
  isDark?: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  isDark = true,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    resetAllData,
    user,
    isAuthenticated,
    isOnline,
    isSyncing,
    syncWithServer,
  } = useApp();
  const theme = isDark ? Colors.dark : Colors.light;

  const [focusMin, setFocusMin] = useState(String(settings.focusDuration));
  const [shortBreakMin, setShortBreakMin] = useState(String(settings.shortBreakDuration));
  const [longBreakMin, setLongBreakMin] = useState(String(settings.longBreakDuration));
  const [userName, setUserName] = useState(settings.userName || 'Developer');
  const [dailyGoal, setDailyGoal] = useState(String(settings.dailyStudyGoalMinutes || 60));
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSavePomodoro = () => {
    updateSettings({
      focusDuration: parseInt(focusMin, 10) || 25,
      shortBreakDuration: parseInt(shortBreakMin, 10) || 5,
      longBreakDuration: parseInt(longBreakMin, 10) || 15,
      userName: userName.trim() || 'Developer',
      dailyStudyGoalMinutes: parseInt(dailyGoal, 10) || 60,
    });
  };

  const handleTestNotification = async () => {
    const success = await NotificationService.scheduleStudyReminder(
      0.1, // 6 seconds for instant test
      'CodeTrack Test Notification'
    );
    if (success) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 4000);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.container, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.headerTitleRow}>
                <Ionicons name="settings-outline" size={22} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>Settings & Profile</Text>
              </View>
              <Pressable
                onPress={() => {
                  handleSavePomodoro();
                  onClose();
                }}
                style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated }]}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              {/* Cloud Account & Backend Sync Card */}
              <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>CodeTrack Account</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#10B981' : '#F59E0B', marginRight: 6 }} />
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>{isOnline ? 'Backend Online' : 'Offline Mode'}</Text>
                  </View>
                </View>

                {isAuthenticated ? (
                  <View style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Ionicons name="person" size={20} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{user?.fullName || user?.username}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{user?.email}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary + '20', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.primary }}
                        onPress={syncWithServer}
                        disabled={isSyncing}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
                      </Pressable>

                      <Pressable
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                        onPress={() => setShowAuthModal(true)}
                      >
                        <Ionicons name="settings-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>Manage</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12, lineHeight: 18 }}>
                      Sign in or use the demo account to sync your tasks, study logs, and roadmaps with the FastAPI PostgreSQL server.
                    </Text>
                    <Pressable
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: 12, borderRadius: 10 }}
                      onPress={() => setShowAuthModal(true)}
                    >
                      <Ionicons name="log-in-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '700' }}>Sign In / Connect Server</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Theme Preference */}
              <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Theme Appearance</Text>
                <View style={styles.themeRow}>
                  {(['dark', 'light'] as const).map((mode) => {
                    const isSelected = settings.theme === mode;
                    return (
                      <Pressable
                        key={mode}
                        style={[
                          styles.themeOption,
                          {
                            backgroundColor: isSelected ? theme.primary + '20' : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => updateSettings({ theme: mode })}>
                        <Ionicons
                          name={mode === 'dark' ? 'moon' : 'sunny'}
                          size={18}
                          color={isSelected ? theme.primary : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.themeText,
                            {
                              color: isSelected ? theme.primary : theme.textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* User Profile */}
              <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Developer Profile</Text>
                <View style={styles.inputRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Your Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={userName}
                    onChangeText={setUserName}
                    onBlur={handleSavePomodoro}
                    placeholder="Developer"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Daily Study Goal (min)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={dailyGoal}
                    onChangeText={setDailyGoal}
                    onBlur={handleSavePomodoro}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Pomodoro Timer Configuration */}
              <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Pomodoro Timer Settings</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  Customize focus and break durations in minutes
                </Text>

                <View style={styles.pomoGrid}>
                  <View style={styles.pomoCol}>
                    <Text style={[styles.pomoLabel, { color: theme.textSecondary }]}>Focus</Text>
                    <TextInput
                      style={[
                        styles.pomoInput,
                        {
                          backgroundColor: theme.surface,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={focusMin}
                      onChangeText={setFocusMin}
                      onBlur={handleSavePomodoro}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.minText, { color: theme.textMuted }]}>min</Text>
                  </View>

                  <View style={styles.pomoCol}>
                    <Text style={[styles.pomoLabel, { color: theme.textSecondary }]}>Short Break</Text>
                    <TextInput
                      style={[
                        styles.pomoInput,
                        {
                          backgroundColor: theme.surface,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={shortBreakMin}
                      onChangeText={setShortBreakMin}
                      onBlur={handleSavePomodoro}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.minText, { color: theme.textMuted }]}>min</Text>
                  </View>

                  <View style={styles.pomoCol}>
                    <Text style={[styles.pomoLabel, { color: theme.textSecondary }]}>Long Break</Text>
                    <TextInput
                      style={[
                        styles.pomoInput,
                        {
                          backgroundColor: theme.surface,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={longBreakMin}
                      onChangeText={setLongBreakMin}
                      onBlur={handleSavePomodoro}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.minText, { color: theme.textMuted }]}>min</Text>
                  </View>
                </View>
              </View>

              {/* Notifications */}
              <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Push Notifications</Text>
                    <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                      Receive reminders for tasks, deadlines, and study breaks
                    </Text>
                  </View>
                  <Switch
                    value={settings.notificationsEnabled}
                    onValueChange={(val) => {
                      updateSettings({ notificationsEnabled: val });
                      if (val) NotificationService.requestPermissions();
                    }}
                    trackColor={{ false: theme.border, true: theme.primary + '80' }}
                    thumbColor={settings.notificationsEnabled ? theme.primary : '#FFFFFF'}
                  />
                </View>

                {settings.notificationsEnabled && (
                  <Pressable
                    style={[
                      styles.testNotifBtn,
                      {
                        backgroundColor: testNotificationSent ? theme.success + '20' : theme.surface,
                        borderColor: testNotificationSent ? theme.success : theme.border,
                      },
                    ]}
                    onPress={handleTestNotification}>
                    <Ionicons
                      name={testNotificationSent ? 'checkmark-circle' : 'notifications-outline'}
                      size={16}
                      color={testNotificationSent ? theme.success : theme.primary}
                    />
                    <Text
                      style={[
                        styles.testNotifText,
                        { color: testNotificationSent ? theme.success : theme.primary },
                      ]}>
                      {testNotificationSent
                        ? 'Notification Scheduled (fires in 6s)!'
                        : 'Send Test Notification'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* About & Data Management */}
              <View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Data & Storage</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  All tasks, roadmaps, and sessions are safely stored on device with AsyncStorage.
                </Text>

                <Pressable
                  style={[styles.dangerBtn, { backgroundColor: '#F8717120', borderColor: '#F8717150' }]}
                  onPress={() => setShowConfirmReset(true)}>
                  <Ionicons name="trash-outline" size={16} color={theme.danger} />
                  <Text style={[styles.dangerBtnText, { color: theme.danger }]}>
                    Reset All Data to Factory Defaults
                  </Text>
                </Pressable>
              </View>

              {/* App Info */}
              <View style={styles.appInfo}>
                <Text style={[styles.appName, { color: theme.text }]}>CodeTrack v1.0.0</Text>
                <Text style={[styles.appSub, { color: theme.textMuted }]}>
                  Daily Coding Task Planner & Learning Progress Tracker
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Pressable
                style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  handleSavePomodoro();
                  onClose();
                }}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={showConfirmReset}
        title="Reset All Data?"
        message="This will reset all your tasks, checklist items, study logs, and roadmap progress to default state. This action cannot be undone."
        confirmText="Reset Everything"
        isDestructive={true}
        isDark={isDark}
        onConfirm={async () => {
          setShowConfirmReset(false);
          await resetAllData();
          onClose();
        }}
        onCancel={() => setShowConfirmReset(false)}
      />

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeText: {
    fontSize: 13,
  },
  inputRow: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pomoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  pomoCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  pomoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  pomoInput: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  minText: {
    fontSize: 11,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  testNotifText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
  },
  appSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  doneBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
