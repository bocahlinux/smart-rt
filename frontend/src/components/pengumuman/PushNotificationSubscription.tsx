import { useEffect, useState } from 'react'

import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  urlBase64ToUint8Array,
} from '../../services/pengumumanService'

type State = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export function PushNotificationSubscription() {
  const [state, setState] = useState<State>('loading')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkState()
  }, [])

  async function checkState() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    const permission = Notification.permission
    if (permission === 'denied') {
      setState('denied')
      return
    }
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) {
      setState('unsubscribed')
      return
    }
    const sub = await reg.pushManager.getSubscription()
    setState(sub ? 'subscribed' : 'unsubscribed')
  }

  async function handleSubscribe() {
    setWorking(true)
    setError('')
    try {
      const vapidKey = await getVapidPublicKey()
      if (!vapidKey) {
        setError('Konfigurasi push notification belum siap di server.')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = sub.toJSON()
      const keys = json.keys ?? {}
      await subscribePush({
        endpoint: sub.endpoint,
        p256dh: keys.p256dh ?? '',
        auth: keys.auth ?? '',
      })
      setState('subscribed')
    } catch {
      setError('Gagal mengaktifkan notifikasi.')
    } finally {
      setWorking(false)
    }
  }

  async function handleUnsubscribe() {
    setWorking(true)
    setError('')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await unsubscribePush(sub.endpoint)
          await sub.unsubscribe()
        }
      }
      setState('unsubscribed')
    } catch {
      setError('Gagal menonaktifkan notifikasi.')
    } finally {
      setWorking(false)
    }
  }

  if (state === 'loading') return null
  if (state === 'unsupported') return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Push Notification</h3>

      {state === 'denied' && (
        <p className="text-xs text-rose-600">
          Izin notifikasi ditolak. Ubah pengaturan browser untuk mengizinkan notifikasi.
        </p>
      )}

      {state === 'subscribed' && (
        <div>
          <p className="text-xs text-emerald-700 mb-3">
            Notifikasi push aktif — kamu akan menerima pemberitahuan pengumuman baru.
          </p>
          <button
            onClick={handleUnsubscribe}
            disabled={working}
            className="text-xs text-rose-600 border border-rose-300 rounded px-3 py-1.5 hover:bg-rose-50 disabled:opacity-50"
          >
            {working ? 'Memproses...' : 'Nonaktifkan Notifikasi'}
          </button>
        </div>
      )}

      {state === 'unsubscribed' && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Aktifkan notifikasi push untuk mendapat info pengumuman RT terbaru.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={working}
            className="text-xs text-white bg-blue-600 rounded px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
          >
            {working ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
    </div>
  )
}
