// Loads Paddle.js once (from Paddle's CDN, since it isn't npm-installable —
// it has to run from paddle.com's own origin) and opens its overlay
// checkout for a transaction created server-side by create-paddle-transaction.

let paddleReady = null

function loadPaddle() {
  if (paddleReady) return paddleReady
  paddleReady = new Promise((resolve, reject) => {
    if (window.Paddle) {
      resolve(window.Paddle)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.onload = () => {
      if (import.meta.env.VITE_PADDLE_ENVIRONMENT !== 'production') {
        window.Paddle.Environment.set('sandbox')
      }
      window.Paddle.Initialize({ token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN })
      resolve(window.Paddle)
    }
    script.onerror = () => reject(new Error("Couldn't load Paddle checkout. Check your connection and try again."))
    document.head.appendChild(script)
  })
  return paddleReady
}

// Opens Paddle's overlay checkout for an already-created transaction.
// `successUrl` mirrors what Stripe Checkout's own success_url did — Paddle
// redirects the browser there once payment completes.
export async function openPaddleCheckout(transactionId, successUrl) {
  const Paddle = await loadPaddle()
  Paddle.Checkout.open({
    transactionId,
    settings: { successUrl },
  })
}
