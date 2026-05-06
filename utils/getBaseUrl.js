const axios = require("axios");

// Public ngrok URL
const DEFAULT_BASE_URL = "https://ok-burliest-overpopularly.ngrok-free.dev";

async function getBaseUrl() {
  try {

    const res = await axios.get("http://127.0.0.1:4040/api/tunnels");

    const tunnels = res.data.tunnels;

    if (tunnels && tunnels.length > 0) {
      return tunnels[0].public_url;
    }

    return DEFAULT_BASE_URL;

  } catch (error) {

    return DEFAULT_BASE_URL;

  }
}

module.exports = getBaseUrl;