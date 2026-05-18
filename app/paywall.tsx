import { StyleSheet, Text, View } from 'react-native'

export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Paywall — placeholder</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'flex-end' },
  text: { color: '#FFFFFF' },
})
