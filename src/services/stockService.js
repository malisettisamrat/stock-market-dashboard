import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchStocksData = async (page = 1, limit = 50) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        limit: limit,
        offset: (page - 1) * limit,
        access_key: API_KEY,
      },
    });

    // Return the stocks data...
    return {
      stocks: response?.data?.data,
      totalCount: response?.data?.pagination?.total,
    };
  } catch (error) {
    console.error("Error fetching stock data: ", error);
    throw error;
  }
};
