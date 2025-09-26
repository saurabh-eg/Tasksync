import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../store/taskStore';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onToggle, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const isOverdue = () => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && !task.completed;
  };

  const isDueToday = () => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString() && !task.completed;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Checkbox and Title */}
        <View style={styles.mainContent}>
          <TouchableOpacity 
            style={[
              styles.checkbox,
              task.completed && styles.checkboxCompleted
            ]}
            onPress={onToggle}
          >
            {task.completed && (
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
          
          <View style={styles.textContent}>
            <Text 
              style={[
                styles.title,
                task.completed && styles.completedTitle
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            
            {task.description && (
              <Text 
                style={[
                  styles.description,
                  task.completed && styles.completedDescription
                ]}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}
            
            {/* Due Date */}
            {task.due_date && (
              <View style={styles.dueDateContainer}>
                <Ionicons 
                  name="calendar-outline" 
                  size={14} 
                  color={
                    isOverdue() ? '#ef4444' :
                    isDueToday() ? '#f59e0b' : 
                    '#64748b'
                  } 
                />
                <Text 
                  style={[
                    styles.dueDate,
                    isOverdue() && styles.overdue,
                    isDueToday() && styles.dueToday
                  ]}
                >
                  {formatDate(task.due_date)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Priority Indicator */}
      {(isOverdue() || isDueToday()) && (
        <View style={[
          styles.priorityIndicator,
          isOverdue() ? styles.overdueIndicator : styles.todayIndicator
        ]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  description: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 8,
  },
  completedDescription: {
    color: '#64748b',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  overdue: {
    color: '#ef4444',
  },
  dueToday: {
    color: '#f59e0b',
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  overdueIndicator: {
    backgroundColor: '#ef4444',
  },
  todayIndicator: {
    backgroundColor: '#f59e0b',
  },
});

export default TaskCard;