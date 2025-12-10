export const metadata = {
  title: 'Email Agent',
  description: 'AI-powered email monitoring and auto-reply agent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
