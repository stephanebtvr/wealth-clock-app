import { StyleSheet, Text, View } from 'react-native'

export default function NegativeTimeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Temps libre en négatif — placeholder</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF' },
})
