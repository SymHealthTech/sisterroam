'use client'

import PusherJs from 'pusher-js'

let pusherClient

export function getPusherClient() {
  if (!pusherClient) {
    pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })
  }
  return pusherClient
}
