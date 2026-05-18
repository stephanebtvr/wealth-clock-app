import { StyleSheet, Text, View } from 'react-native'

export default function ValueScannerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Comparateur de valeur — placeholder</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF' },
})
