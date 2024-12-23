export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Chat Widget Demo</h1>
        <p className="mb-4">Visit <a href="/chat-test" className="text-blue-500 hover:underline">/chat-test</a> to see the chat widget in action.</p>
      </div>
    </main>
  );
}
