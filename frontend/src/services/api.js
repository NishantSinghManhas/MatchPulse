import axios from "axios"

const API_KEY = "f194699c-bb2b-42d8-b276-0bf51c74fd09" // 🔴 replace this

export const getMatches = async () => {
  try {
    const res = await axios.get(
      `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
    )

    return res.data.data
  } catch (error) {
    console.error(error)
    return []
  }
}