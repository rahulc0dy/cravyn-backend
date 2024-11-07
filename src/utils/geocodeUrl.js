const getGeocodeUrl = (address) => {
  if (!address) {
    throw new Error("Geocode address is required");
  }
  return `https://geocode.maps.co/search?q=${address}&api_key=${process.env.GEOCODE_API_KEY}`;
};

const getReverseGeocodeUrl = (latitude, longitude) => {
  if (!latitude || !longitude) {
    throw new Error("Geocode requires latitude and longitude");
  }

  return `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=${process.env.GEOCODE_API_KEY}`;
};

export { getGeocodeUrl, getReverseGeocodeUrl };
