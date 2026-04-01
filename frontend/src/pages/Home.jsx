import { useEffect, useState } from "react"
import MatchCard from "../components/MatchCard"
import { getMatches } from "../services/api"

function Home() {
  const [matches, setMatches] = useState([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)

  // ✅ SAFE FETCH FUNCTION
  const fetchMatches = async () => {
    try {
      const data = await getMatches()

      console.log("Fetched Data:", data) // debug

      if (Array.isArray(data)) {
        setMatches(data)
      } else {
        setMatches([])
      }

    } catch (error) {
      console.error("Fetch Error:", error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ RUN ON LOAD + AUTO REFRESH
  useEffect(() => {
    fetchMatches()

    const interval = setInterval(() => {
      fetchMatches()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // ✅ SAFE FILTER
  const filteredMatches = (matches || []).filter(match => {
    const matchesSearch =
      match?.name?.toLowerCase().includes(search.toLowerCase())

const matchesFilter =
  filter === "ALL" ||
  (filter === "LIVE" && match?.status?.toLowerCase().includes === ("live")) ||
  (filter === "FINISHED" && match?.status?.toLowerCase().includes === ("complete"))

    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-4 text-red-800">
          🔴 Live Cricket Matches
        </h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search teams..."
          className="w-full md:w-1/2 p-2 border rounded-lg mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter */}
        <div className="space-x-2 mb-4">
          {["ALL", "LIVE", "FINISHED"].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                filter === type
                  ? "bg-red-700 text-white"
                  : "bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Matches */}
      <div className="px-6 pb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading matches...</p>
        ) : filteredMatches.length === 0 ? (
          <p>No matches found</p>
        ) : (
          filteredMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))
        )}
      </div>

    </div>
  )
}

export default Home