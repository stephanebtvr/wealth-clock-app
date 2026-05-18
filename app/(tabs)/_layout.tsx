import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#13131A', borderTopColor: '#1E1E2E' },
        tabBarActiveTintColor: '#00FF87',
        tabBarInactiveTintColor: '#8888AA',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="compare" options={{ title: 'Comparer' }} />
      <Tabs.Screen name="history" options={{ title: 'Historique' }} />
    </Tabs>
  )
}
