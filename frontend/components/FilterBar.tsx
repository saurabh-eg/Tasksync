import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTaskStore } from '../store/taskStore';

const FilterBar: React.FC = () => {
  const { currentFilter, setFilter, filteredTasks, tasks } = useTaskStore();

  const filters = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'pending', label: 'Pending', count: tasks.filter(t => !t.completed).length },
    { key: 'completed', label: 'Completed', count: tasks.filter(t => t.completed).length },
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            currentFilter === filter.key && styles.activeFilter
          ]}
          onPress={() => setFilter(filter.key as 'all' | 'completed' | 'pending')}
        >
          <Text
            style={[
              styles.filterText,
              currentFilter === filter.key && styles.activeFilterText
            ]}
          >
            {filter.label}
          </Text>
          {filter.count > 0 && (
            <View style={[
              styles.badge,
              currentFilter === filter.key && styles.activeBadge
            ]}>
              <Text style={[
                styles.badgeText,
                currentFilter === filter.key && styles.activeBadgeText
              ]}>
                {filter.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#475569',
    minWidth: 20,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  activeBadgeText: {
    color: '#ffffff',
  },
});

export default FilterBar;