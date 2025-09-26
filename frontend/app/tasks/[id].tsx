import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore, Task } from '../../store/taskStore';

interface TaskForm {
  title: string;
  description: string;
}

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const { tasks, updateTask } = useTaskStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<TaskForm>();

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    // Find task in local store first
    const foundTask = tasks.find(t => t.id === id);
    if (foundTask) {
      setTask(foundTask);
      setValue('title', foundTask.title);
      setValue('description', foundTask.description || '');
      setDueDate(foundTask.due_date ? new Date(foundTask.due_date) : null);
    } else {
      // Fetch from server if not found locally
      fetchTask();
    }
  }, [id, tasks]);

  const fetchTask = async () => {
    if (!token || !id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const taskData = await response.json();
        setTask(taskData);
        setValue('title', taskData.title);
        setValue('description', taskData.description || '');
        setDueDate(taskData.due_date ? new Date(taskData.due_date) : null);
      } else if (response.status === 404) {
        Alert.alert('Error', 'Task not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TaskForm) => {
    if (!token || !task) return;

    setIsLoading(true);
    
    try {
      const updates = {
        title: data.title.trim(),
        description: data.description.trim(),
        due_date: dueDate?.toISOString() || null,
      };

      const response = await fetch(`${BACKEND_URL}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
        setTask(updatedTask);
        setIsEditing(false);
        
        Alert.alert('Success', 'Task updated successfully!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!token || !task) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, { completed: !task.completed });
        setTask(prev => prev ? { ...prev, completed: !prev.completed } : null);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!token || !task) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/tasks/${task.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                useTaskStore.getState().removeTask(task.id);
                router.back();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const clearDueDate = () => {
    setDueDate(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const goBack = () => {
    if (isEditing && isDirty) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              reset();
              setIsEditing(false);
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      if (isDirty) {
        Alert.alert(
          'Discard Changes',
          'You have unsaved changes. Are you sure you want to cancel?',
          [
            { text: 'Keep Editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                reset();
                setIsEditing(false);
              },
            },
          ]
        );
      } else {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  if (isLoading && !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Task not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEditing ? 'Edit Task' : 'Task Details'}
          </Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleEdit}>
              <Ionicons 
                name={isEditing ? "close" : "create-outline"} 
                size={24} 
                color="#e2e8f0" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isEditing ? (
            /* Edit Mode */
            <View style={styles.form}>
              <Controller
                control={control}
                name="title"
                rules={{
                  required: 'Task title is required',
                  minLength: { value: 1, message: 'Title cannot be empty' }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Title *</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter task title"
                        placeholderTextColor="#64748b"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        maxLength={100}
                      />
                    </View>
                    {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Add description (optional)"
                        placeholderTextColor="#64748b"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        maxLength={500}
                      />
                    </View>
                  </View>
                )}
              />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                  <Text style={styles.dateButtonText}>
                    {dueDate ? formatDate(dueDate) : 'Set due date (optional)'}
                  </Text>
                  {dueDate && (
                    <TouchableOpacity onPress={clearDueDate} style={styles.clearDateButton}>
                      <Ionicons name="close-circle" size={20} color="#64748b" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          ) : (
            /* View Mode */
            <View style={styles.viewContainer}>
              <View style={styles.taskHeader}>
                <TouchableOpacity 
                  style={[
                    styles.checkbox,
                    task.completed && styles.checkboxCompleted
                  ]}
                  onPress={handleToggleComplete}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
                
                <Text style={[
                  styles.taskTitle,
                  task.completed && styles.completedTitle
                ]}>
                  {task.title}
                </Text>
              </View>

              {task.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{task.description}</Text>
                </View>
              )}

              {task.due_date && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Due Date</Text>
                  <View style={styles.dueDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.dueDate}>
                      {formatDate(new Date(task.due_date))}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.metadataContainer}>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Created</Text>
                    <Text style={styles.metadataValue}>
                      {formatDateTime(task.created_at)}
                    </Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Updated</Text>
                    <Text style={styles.metadataValue}>
                      {formatDateTime(task.updated_at)}
                    </Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>Status</Text>
                    <Text style={[
                      styles.metadataValue,
                      task.completed ? styles.completedStatus : styles.pendingStatus
                    ]}>
                      {task.completed ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        {isEditing && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={toggleEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.disabledButton]} 
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e2e8f0',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e3a8a',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#e2e8f0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#cbd5e1',
  },
  clearDateButton: {
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  viewContainer: {
    padding: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  taskTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 16,
    color: '#cbd5e1',
    marginLeft: 8,
  },
  metadataContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  metadataLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  metadataValue: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  completedStatus: {
    color: '#10b981',
  },
  pendingStatus: {
    color: '#f59e0b',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});