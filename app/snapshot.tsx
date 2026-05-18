import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { captureRef } from 'react-native-view-shot'
import { useWealthStore } from '@/store/wealthStore'
import { generateSnapshotData } from '@/utils/snapshotGenerator'
import SnapshotCard from '@/components/SnapshotCard'

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_WIDTH = SCREEN_WIDTH - 32

export default function SnapshotScreen() {
  const router = useRouter()
  const salary = useWealthStore((s) => s.salary)

  const cardRef = useRef<View>(null)
  const [sharing, setSharing] = useState(false)

  const snapshotData = generateSnapshotData(salary ?? 0)

  const handleShare = async () => {
    if (sharing) return
    try {
      setSharing(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const uri = await captureRef(cardRef, {
        format: 'jpg',
        quality: 0.95,
        result: 'tmpfile',
      })

      await Share.share({ url: uri })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      // User cancelled share — no error to surface
    } finally {
      setSharing(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Wealth Snapshot</Text>
        <Text style={styles.subtitle}>Partage ta richesse sur les réseaux</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardWrapper}>
          <SnapshotCard ref={cardRef} data={snapshotData} width={CARD_WIDTH} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
          onPress={handleShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#0A0A0F" />
          ) : (
            <Text style={styles.shareBtnText}>Partager</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
  },
  back: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
  },

  // Card
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  cardWrapper: {
    shadowColor: '#00FF87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#0A0A0F',
  },
  shareBtn: {
    backgroundColor: '#00FF87',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnPressed: {
    backgroundColor: '#00CC6A',
  },
  shareBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 17,
    color: '#0A0A0F',
    letterSpacing: 0.3,
  },
})
