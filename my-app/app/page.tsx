import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <img src="/logo.png" alt="logo" height="200" className='logo'/>
      <h1 className="text-3xl font-bold mb-8">Welcome to the TestFlow</h1>
      <div className="flex gap-4">
        <Link href="/teacher" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Teacher Section
        </Link>
        <Link href="/student" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Student Section
        </Link>
      </div>
    </div>
  )
}