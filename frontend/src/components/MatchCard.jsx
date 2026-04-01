import { useNavigate } from "react-router-dom"

function MatchCard({ match }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className="bg-white rounded-2xl shadow-lg p-5 mb-5 hover:shadow-xl transition cursor-pointer"
    >

      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">{match.name}</h2>

        <span className={`px-3 py-1 text-xs font-bold rounded-full 
          ${match.status === "live"
            ? "bg-red-600 text-white animate-pulse"
            : "bg-gray-300 text-black"}`}>
          {match.status}
        </span>
      </div>

      <div className="space-y-1 text-gray-700">
        {match.score && match.score.map((s, i) => (
          <p key={i}>
            {s.inning}: {s.r}/{s.w}
          </p>
        ))}
      </div>

    </div>
  )
}

export default MatchCard