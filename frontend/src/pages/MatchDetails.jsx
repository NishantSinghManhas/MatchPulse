import { useParams } from "react-router-dom"

function MatchDetails() {
  const { id } = useParams()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-800 mb-4">
        Match Details
      </h1>

      <p className="text-gray-700">
        Match ID: {id}
      </p>
    </div>
  )
}

export default MatchDetails