// NO API KEY DEPENDENCY VERSION

export const getMatches = async () => {
  try {
    // 🔥 TEMP FAKE DATA (ALWAYS WORKS)
    const data = [
      {
        id: "1",
        name: "India vs Australia",
        status: "Live"
      },
      {
        id: "2",
        name: "England vs Pakistan",
        status: "Completed"
      },
      {
        id: "3",
        name: "South Africa vs New Zealand",
        status: "Live"
      }
    ]
    return data
  } catch (error) {
    console.error("ERROR:", error)
    return []
  }
}

// ALSO KEEP THIS (for details page)
export const getMatchDetails = async () => {
  return {
    name: "India vs Australia",
    scorecard: [
      {
        inning: "India",
        batting: [
          { batsman: { name: "Rohit" }, r: 45, b: 30, "4s": 5, "6s": 2 },
          { batsman: { name: "Kohli" }, r: 60, b: 42, "4s": 6, "6s": 1 }
        ]
      }
    ]
  }
}