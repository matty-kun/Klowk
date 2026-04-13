import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useTracking } from '@/context/TrackingContext';

export default function TabOneScreen() {
  const { activities, currentActivity, startTracker, stopTracker, deleteActivity } = useTracking();
  const [activityTitle, setActivityTitle] = useState('');

  const handleStartTracker = async () => {
    if (currentActivity) return;
    const finalTitle = activityTitle.trim() || 'Untitled Activity';
    await startTracker(finalTitle, 'Uncategorized');
    setActivityTitle('');
  };

  const handleStopTracker = async () => {
    await stopTracker();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Klowk</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <View style={styles.trackerBox}>
        {currentActivity ? (
          <>
            <Text style={styles.trackingText}>Currently tracking: {currentActivity.title}</Text>
            <Pressable onPress={handleStopTracker} style={[styles.button, styles.stopButton]}>
              <Text style={styles.buttonText}>Stop Tracker</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="What are you working on?"
              placeholderTextColor="#9ca3af"
              value={activityTitle}
              onChangeText={setActivityTitle}
            />
            <Pressable onPress={handleStartTracker} style={[styles.button, styles.startButton]}>
              <Text style={styles.buttonText}>Start Tracker</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={styles.listTitle}>Recent Activities:</Text>
      <FlatList
        data={activities}
        keyExtractor={item => item.id.toString()}
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <View style={styles.activityItem}>
            <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
            {item.end_time ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'gray', marginRight: 10 }}>{item.duration} mins</Text>
                <Pressable onPress={() => deleteActivity(item.id)}>
                  <Text style={{ color: 'red', fontSize: 12 }}>Delete</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={{ color: 'green' }}>In Progress...</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
  },
  trackerBox: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackingText: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#3b82f6',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    width: '100%'
  }
});
