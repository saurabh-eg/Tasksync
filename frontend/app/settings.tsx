import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { clearOfflineData } = useTaskStore();
  
  const [darkMode, setDarkMode] = useState(true); // Always true for now
  const [notifications, setNotifications] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear your local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will clear all tasks stored locally on this device. Your data on the server will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearOfflineData();
              Alert.alert('Success', 'Local data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About TaskSync',
      'TaskSync v1.0.0\n\nA modern, cross-platform To-Do application built with React Native and Expo.\n\nFeatures:\n• Cross-platform support\n• Offline functionality\n• Real-time sync\n• Dark mode\n• Task reminders',
      [{ text: 'OK' }]
    );
  };

  const handleFeedback = () => {
    Alert.alert(
      'Feedback',
      'We value your feedback! Please share your thoughts about TaskSync.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Feedback', onPress: () => {
          // Here you would typically open email or feedback form
          Alert.alert('Thank you!', 'Feedback feature coming soon.');
        }},
      ]
    );
  };

  const goBack = () => {
    router.back();
  };

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'Profile',
          subtitle: user?.name || 'User',
          onPress: () => Alert.alert('Profile', 'Profile editing coming soon!'),
        },
        {
          icon: 'mail-outline',
          title: 'Email',
          subtitle: user?.email || '',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: 'Always on for better experience',
          component: (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              disabled={true} // Disabled for now
              trackColor={{ false: '#475569', true: '#3b82f6' }}
              thumbColor={darkMode ? '#ffffff' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Get reminders for due tasks',
          component: (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#475569', true: '#3b82f6' }}
              thumbColor={notifications ? '#ffffff' : '#f4f3f4'}
            />
          ),
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: 'cloud-outline',
          title: 'Sync Status',
          subtitle: 'Connected to server',
          onPress: () => Alert.alert('Sync Status', 'All data is synchronized with the server.'),
        },
        {
          icon: 'trash-outline',
          title: 'Clear Local Data',
          subtitle: 'Remove tasks stored on this device',
          onPress: handleClearData,
          isLoading: isClearing,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'About',
          subtitle: 'App version and info',
          onPress: handleAbout,
        },
        {
          icon: 'chatbubble-outline',
          title: 'Feedback',
          subtitle: 'Share your thoughts',
          onPress: handleFeedback,
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          onPress: handleLogout,
          textColor: '#ef4444',
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.title}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={!item.onPress || item.isLoading}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={item.textColor || '#e2e8f0'} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingTitle,
            item.textColor && { color: item.textColor }
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.component || (
          item.onPress && (
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          )
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>TaskSync v1.0.0</Text>
          <Text style={styles.versionSubtext}>Built with React Native & Expo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e3a8a',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
});