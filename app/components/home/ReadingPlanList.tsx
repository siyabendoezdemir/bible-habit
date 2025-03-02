import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';

interface ReadingPlanItem {
  book: string;
  description: string;
  completed: boolean;
}

interface ReadingPlanListProps {
  items: ReadingPlanItem[];
}

const ReadingPlanList: React.FC<ReadingPlanListProps> = ({ items }) => {
  const theme = useTheme();
  
  // Split items into two columns
  const halfIndex = Math.ceil(items.length / 2);
  const firstColumnItems = items.slice(0, halfIndex);
  const secondColumnItems = items.slice(halfIndex);

  const renderReadingItem = (item: ReadingPlanItem) => (
    <View key={item.book} style={styles.readingPlanItem}>
      <View 
        style={[
          styles.readingCheckbox, 
          item.completed && styles.readingCompleted,
          { borderColor: theme.colors.primary }
        ]}
      >
        <IconButton 
          icon={item.completed ? "check" : "circle-outline"} 
          size={14} 
          iconColor={item.completed ? "#FFFFFF" : theme.colors.primary} 
          style={styles.checkIcon} 
        />
      </View>
      <View style={styles.readingPlanContent}>
        <Text style={[styles.readingPlanBook, { color: theme.colors.primary }]}>
          {item.book}
        </Text>
        <Text style={[styles.readingPlanDescription, { color: theme.colors.secondary }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Today's Reading Plan
      </Text>
      
      <View style={styles.readingPlanContainer}>
        <View style={styles.readingPlanRow}>
          {/* First Column */}
          <View style={styles.readingPlanColumn}>
            {firstColumnItems.map(renderReadingItem)}
          </View>
          
          {/* Second Column */}
          <View style={styles.readingPlanColumn}>
            {secondColumnItems.map(renderReadingItem)}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 0,
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  readingPlanContainer: {
    width: '100%',
  },
  readingPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readingPlanColumn: {
    width: '48%',
  },
  readingPlanItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    width: '100%',
  },
  readingCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  readingCompleted: {
    backgroundColor: '#2C3E50', // This will be theme.colors.primary
  },
  checkIcon: {
    margin: 0,
    padding: 0,
    width: 18,
    height: 18,
  },
  readingPlanContent: {
    flex: 1,
  },
  readingPlanBook: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 0,
  },
  readingPlanDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
});

export default ReadingPlanList; 