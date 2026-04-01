function Navbar() {
  return (
    <div className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      
      <h1 className="text-2xl font-bold tracking-wide">
        🔴 MatchPulse
      </h1>

      <div className="space-x-6 text-sm font-medium">
        <button className="hover:text-green-400 transition">Home</button>
        <button className="hover:text-green-400 transition">Live Scores</button>
        <button className="hover:text-green-400 transition">Schedule</button>
        <button className="hover:text-green-400 transition">Teams</button>
      </div>

    </div>
  )
}

export default Navbar