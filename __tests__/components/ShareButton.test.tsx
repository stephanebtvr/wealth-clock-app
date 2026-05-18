import React, { createRef } from 'react'
import { View, Share } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import ShareButton from '../../src/components/ShareButton'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCaptureRef = jest.fn()
jest.mock('react-native-view-shot', () => ({
  captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}))

const mockShare = jest.spyOn(Share, 'share')

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ShareMode = 'counter' | 'value' | 'meeting' | 'negative' | 'compare'

function renderBtn(mode: ShareMode = 'counter') {
  const ref = createRef<View | null>()
  return { ref, ...render(<ShareButton mode={mode} targetRef={ref} />) }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockCaptureRef.mockResolvedValue('/tmp/capture.png')
  mockShare.mockResolvedValue({ action: 'sharedAction' })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ShareButton', () => {
  describe('rendering', () => {
    it('renders a pressable FAB with correct accessibility label', () => {
      const { getByLabelText } = renderBtn()
      expect(getByLabelText('Partager')).toBeTruthy()
    })
  })

  describe('capture options', () => {
    it('always uses quality 1 and png format', async () => {
      const { getByLabelText } = renderBtn('counter')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(mockCaptureRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ quality: 1, format: 'png' }),
      )
    })

    it('uses result tmpfile so Share.share receives a file uri', async () => {
      const { getByLabelText } = renderBtn('counter')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(mockCaptureRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ result: 'tmpfile' }),
      )
    })
  })

  describe('share payload', () => {
    it('includes WealthClock in the share message', async () => {
      const { getByLabelText } = renderBtn('counter')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('WealthClock') }),
      )
    })

    it('passes captured uri as url to Share.share', async () => {
      mockCaptureRef.mockResolvedValue('/tmp/img.png')
      const { getByLabelText } = renderBtn('value')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/tmp/img.png' }),
      )
    })
  })

  describe('haptics', () => {
    it('fires medium impact haptic on press', async () => {
      const { getByLabelText } = renderBtn('counter')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
    })

    it('fires success notification haptic after share completes', async () => {
      const { getByLabelText } = renderBtn('meeting')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success,
      )
    })
  })

  describe('loading guard', () => {
    it('ignores a second press while capture is in progress', async () => {
      let resolveCapture!: (v: string) => void
      mockCaptureRef.mockReturnValue(new Promise<string>((r) => (resolveCapture = r)))

      const { getByLabelText } = renderBtn('counter')

      act(() => {
        fireEvent.press(getByLabelText('Partager'))
      })
      act(() => {
        fireEvent.press(getByLabelText('Partager'))
      })

      await act(async () => {
        resolveCapture('/tmp/img.png')
      })

      expect(mockCaptureRef).toHaveBeenCalledTimes(1)
    })
  })

  describe('mode behaviour', () => {
    it.each(['meeting', 'negative'] as const)(
      'mode %s does not throw and still shares',
      async (mode) => {
        const { getByLabelText } = renderBtn(mode)
        await act(async () => {
          fireEvent.press(getByLabelText('Partager'))
        })
        expect(mockShare).toHaveBeenCalled()
      },
    )

    it.each(['counter', 'value', 'compare'] as const)(
      'mode %s does not throw and still shares',
      async (mode) => {
        const { getByLabelText } = renderBtn(mode)
        await act(async () => {
          fireEvent.press(getByLabelText('Partager'))
        })
        expect(mockShare).toHaveBeenCalled()
      },
    )
  })

  describe('error handling', () => {
    it('does not rethrow when user cancels the share sheet', async () => {
      mockShare.mockRejectedValue(new Error('User cancelled'))
      const { getByLabelText } = renderBtn('counter')
      await expect(
        act(async () => {
          fireEvent.press(getByLabelText('Partager'))
        }),
      ).resolves.not.toThrow()
    })

    it('resets loading state after capture failure', async () => {
      mockCaptureRef.mockRejectedValue(new Error('capture failed'))
      const { getByLabelText } = renderBtn('counter')

      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })

      // After failure, pressing again should trigger a new capture
      mockCaptureRef.mockResolvedValue('/tmp/ok.png')
      await act(async () => {
        fireEvent.press(getByLabelText('Partager'))
      })
      expect(mockCaptureRef).toHaveBeenCalledTimes(2)
    })
  })
})
