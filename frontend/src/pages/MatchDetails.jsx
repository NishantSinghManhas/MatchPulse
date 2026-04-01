import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getMatchDetails } from "../services/api"

function MatchDetails() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)

  useEffect(() => {
    const loadDetails = async () => {
      const data = await getMatchDetails(id)
      setMatch(data)
    }
    loadDetails()
  }, [id])

  if (!match) return <p className="p-6">Loading scorecard...</p>

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Title */}
      <h1 className="text-2xl font-bold text-red-800 mb-4">
        {match.name}
      </h1>

      {/* Batting */}
      {match.scorecard?.map((inning, i) => (
        <div key={i} className="mb-6">

          <h2 className="text-lg font-semibold mb-2">
            🏏 {inning.inning}
          </h2>

          <table className="w-full bg-white shadow rounded-lg">
            <thead className="bg-red-700 text-white">
              <tr>
                <th className="p-2 text-left">Batsman</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
              </tr>
            </thead>

            <tbody>
              {inning.batting?.map((b, idx) => (
                <tr key={idx} className="text-center border-b">
                  <td className="text-left p-2">{b.batsman.name}</td>
                  <td>{b.r}</td>
                  <td>{b.b}</td>
                  <td>{b["4s"]}</td>
                  <td>{b["6s"]}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      ))}

    </div>
  )
}

export default MatchDetails