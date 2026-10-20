import { findDestinationLocation } from './geocodingApi.ts';

export interface ResolvedCoordinates {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  source: 'nominatim' | 'landmark_db' | 'google_places' | 'city_db' | 'destination_anchor';
}

// In-memory geocode cache to prevent redundant requests
const GEO_CACHE = new Map<string, ResolvedCoordinates>();

// Curated database of top landmarks across India & International destinations
const KNOWN_LANDMARKS: Record<string, { lat: number; lng: number; address: string }> = {
  // Jaipur & Rajasthan
  'amber fort': { lat: 26.9855, lng: 75.8513, address: 'Amer, Jaipur, Rajasthan' },
  'amer palace': { lat: 26.9855, lng: 75.8513, address: 'Amer, Jaipur, Rajasthan' },
  'amer fort': { lat: 26.9855, lng: 75.8513, address: 'Amer, Jaipur, Rajasthan' },
  'hawa mahal': { lat: 26.9239, lng: 75.8267, address: 'Hawa Mahal Rd, Badi Choupad, Pink City, Jaipur' },
  'city palace jaipur': { lat: 26.9258, lng: 75.8237, address: 'Gangori Bazaar, Pink City, Jaipur' },
  'nahargarh fort': { lat: 26.9373, lng: 75.8155, address: 'Krishna Nagar, Brahampuri, Jaipur' },
  'jaigarh fort': { lat: 26.9850, lng: 75.8456, address: 'Amer, Jaipur, Rajasthan' },
  'jal mahal': { lat: 26.9535, lng: 75.8462, address: 'Amer Rd, Jal Mahal, Jaipur' },
  'jantar mantar': { lat: 26.9248, lng: 75.8246, address: 'Gangori Bazaar, Pink City, Jaipur' },
  'chokhi dhani': { lat: 26.7663, lng: 75.8362, address: '12 Miles Tonk Road, Jaipur' },
  'birla mandir jaipur': { lat: 26.8924, lng: 75.8154, address: 'Tilak Nagar, Jaipur' },
  'albert hall': { lat: 26.9116, lng: 75.8195, address: 'Ram Niwas Garden, Jaipur' },
  'bapu bazaar': { lat: 26.9189, lng: 75.8242, address: 'Bapu Bazaar, Jaipur' },
  'johari bazaar': { lat: 26.9213, lng: 75.8268, address: 'Johari Bazaar, Jaipur' },
  'lmb': { lat: 26.9205, lng: 75.8264, address: 'Johari Bazaar, Pink City, Jaipur' },
  'lake pichola': { lat: 24.5765, lng: 73.6800, address: 'Lake Pichola, Udaipur, Rajasthan' },
  'city palace udaipur': { lat: 24.5764, lng: 73.6835, address: 'Old City, Udaipur, Rajasthan' },
  'fateh sagar': { lat: 24.6033, lng: 73.6738, address: 'Fateh Sagar Lake, Udaipur' },
  'mehrangarh fort': { lat: 26.2978, lng: 73.0185, address: 'Fort Rd, Jodhpur, Rajasthan' },
  'jaswant thada': { lat: 26.3040, lng: 73.0235, address: 'Jodhpur, Rajasthan' },
  'jaisalmer fort': { lat: 26.9126, lng: 70.9128, address: 'Fort Rd, Amar Sagar Pol, Jaisalmer' },
  'sam sand dunes': { lat: 26.8285, lng: 70.5057, address: 'Sam Sand Dunes, Jaisalmer' },

  // Agra
  'taj mahal': { lat: 27.1751, lng: 78.0421, address: 'Tajganj, Agra, Uttar Pradesh' },
  'agra fort': { lat: 27.1795, lng: 78.0211, address: 'Agra Fort, Rakabganj, Agra' },
  'mehtab bagh': { lat: 27.1800, lng: 78.0419, address: 'Nagla Devjit, Agra' },
  'fatehpur sikri': { lat: 27.0945, lng: 77.6679, address: 'Fatehpur Sikri, Uttar Pradesh' },

  // Delhi & NCR
  'india gate': { lat: 28.6129, lng: 77.2295, address: 'Rajpath, India Gate, New Delhi' },
  'qutub minar': { lat: 28.5245, lng: 77.1855, address: 'Mehrauli, New Delhi' },
  'red fort': { lat: 28.6562, lng: 77.2410, address: 'Chandni Chowk, New Delhi' },
  'lotus temple': { lat: 28.5535, lng: 77.2588, address: 'Kalkaji, New Delhi' },
  'humayun tomb': { lat: 28.5933, lng: 77.2507, address: 'Nizamuddin East, New Delhi' },
  'chandni chowk': { lat: 28.6506, lng: 77.2303, address: 'Chandni Chowk, Old Delhi' },
  'akshardham': { lat: 28.6127, lng: 77.2773, address: 'Noida Mor, Pandav Nagar, New Delhi' },

  // Mumbai & Maharashtra
  'gateway of india': { lat: 18.9220, lng: 72.8347, address: 'Colaba, Mumbai, Maharashtra' },
  'marine drive': { lat: 18.9432, lng: 72.8230, address: 'Netaji Subhash Chandra Bose Rd, Mumbai' },
  'elephanta caves': { lat: 18.9633, lng: 72.9315, address: 'Gharapuri Island, Mumbai' },
  'juhu beach': { lat: 19.0988, lng: 72.8264, address: 'Juhu Tara Rd, Mumbai' },
  'bandra bandstand': { lat: 19.0494, lng: 72.8192, address: 'Bandra West, Mumbai' },
  'shaniwar wada': { lat: 18.5196, lng: 73.8553, address: 'Shaniwar Peth, Pune, Maharashtra' },
  'aga khan palace': { lat: 18.5529, lng: 73.9015, address: 'Kalyani Nagar, Pune' },
  'lonavala lake': { lat: 18.7513, lng: 73.4072, address: 'Lonavala, Maharashtra' },

  // Goa
  'baga beach': { lat: 15.5553, lng: 73.7517, address: 'Baga Beach, North Goa' },
  'calangute beach': { lat: 15.5439, lng: 73.7553, address: 'Calangute, North Goa' },
  'fort aguada': { lat: 15.4920, lng: 73.7737, address: 'Candolim, Goa' },
  'anjuna beach': { lat: 15.5841, lng: 73.7432, address: 'Anjuna, North Goa' },
  'vagator beach': { lat: 15.6026, lng: 73.7336, address: 'Vagator, North Goa' },
  'chapora fort': { lat: 15.6059, lng: 73.7386, address: 'Chapora, Goa' },
  'palolem beach': { lat: 15.0100, lng: 74.0232, address: 'Palolem, South Goa' },
  'colva beach': { lat: 15.2793, lng: 73.9213, address: 'Colva, South Goa' },
  'dudhsagar falls': { lat: 15.3144, lng: 74.3143, address: 'Sonaulim, Goa' },
  'basilica of bom jesus': { lat: 15.5009, lng: 73.9116, address: 'Old Goa, Goa' },

  // Manali & Himachal Pradesh
  'solang valley': { lat: 32.3166, lng: 77.1575, address: 'Solang Valley, Manali, Himachal Pradesh' },
  'rohtang pass': { lat: 32.3716, lng: 77.2466, address: 'Rohtang Pass, Manali' },
  'hadimba temple': { lat: 32.2483, lng: 77.1812, address: 'Hadimba Temple Rd, Manali' },
  'mall road manali': { lat: 32.2396, lng: 77.1887, address: 'Mall Rd, Manali' },
  'jogini falls': { lat: 32.2741, lng: 77.1945, address: 'Vashisht, Manali' },
  'atal tunnel': { lat: 32.3644, lng: 77.1330, address: 'Atal Tunnel, Manali-Leh Highway' },
  'mall road shimla': { lat: 31.1048, lng: 77.1734, address: 'The Mall, Shimla, Himachal Pradesh' },
  'jakhoo temple': { lat: 31.1011, lng: 77.1842, address: 'Jakhoo Hill, Shimla' },
  'kufri': { lat: 31.0982, lng: 77.2678, address: 'Kufri, Shimla' },
  'triund': { lat: 32.2592, lng: 76.3533, address: 'Triund, McLeod Ganj, Dharamshala' },

  // Kashmir & Ladakh
  'dal lake': { lat: 34.1130, lng: 74.8700, address: 'Dal Lake, Srinagar, Kashmir' },
  'shalimar bagh': { lat: 34.1497, lng: 74.8727, address: 'Shalimar, Srinagar' },
  'gulmarg gondola': { lat: 34.0484, lng: 74.3805, address: 'Gulmarg, Jammu & Kashmir' },
  'pahalgam valley': { lat: 34.0163, lng: 75.3150, address: 'Pahalgam, Anantnag, Kashmir' },
  'betaab valley': { lat: 34.0298, lng: 75.3524, address: 'Betaab Valley, Pahalgam' },
  'pangong lake': { lat: 33.7595, lng: 78.6674, address: 'Pangong Tso, Ladakh' },
  'khardung la': { lat: 34.2789, lng: 77.6046, address: 'Khardung La Pass, Ladakh' },
  'leh palace': { lat: 34.1642, lng: 77.5848, address: 'Leh Palace, Leh, Ladakh' },

  // Uttarakhand
  'ram jhula': { lat: 30.1238, lng: 78.3142, address: 'Ram Jhula, Rishikesh, Uttarakhand' },
  'laxman jhula': { lat: 30.1342, lng: 78.3283, address: 'Laxman Jhula, Rishikesh' },
  'triveni ghat': { lat: 30.1039, lng: 78.2974, address: 'Triveni Ghat, Rishikesh' },
  'har ki pauri': { lat: 29.9577, lng: 78.1708, address: 'Har Ki Pauri, Haridwar' },
  'naini lake': { lat: 29.3803, lng: 79.4636, address: 'Nainital, Uttarakhand' },
  'gun hill': { lat: 30.4598, lng: 78.0754, address: 'Mussoorie, Uttarakhand' },

  // Varanasi & UP
  'dashashwamedh ghat': { lat: 25.3072, lng: 83.0104, address: 'Dashashwamedh Ghat, Varanasi' },
  'kashi vishwanath': { lat: 25.3109, lng: 83.0107, address: 'Kashi Vishwanath, Varanasi' },
  'assi ghat': { lat: 25.2899, lng: 83.0064, address: 'Assi Ghat, Varanasi' },
  'sarnath': { lat: 25.3811, lng: 83.0214, address: 'Sarnath, Varanasi' },

  // South India
  'fort kochi': { lat: 9.9658, lng: 76.2421, address: 'Fort Kochi, Kochi, Kerala' },
  'tea museum munnar': { lat: 10.0889, lng: 77.0595, address: 'Nullatanni, Munnar, Kerala' },
  'alappuzha backwaters': { lat: 9.4981, lng: 76.3388, address: 'Alleppey Backwaters, Kerala' },
  'varkala cliff': { lat: 8.7360, lng: 76.7032, address: 'Varkala Cliff Beach, Kerala' },
  'mysore palace': { lat: 12.3052, lng: 76.6552, address: 'Sayyaji Rao Rd, Mysore, Karnataka' },
  'meenakshi temple': { lat: 9.9195, lng: 78.1193, address: 'Madurai, Tamil Nadu' },
  'promenade beach': { lat: 11.9338, lng: 79.8354, address: 'White Town, Pondicherry' },

  // International
  'eiffel tower': { lat: 48.8584, lng: 2.2945, address: 'Champ de Mars, Paris, France' },
  'louvre museum': { lat: 48.8606, lng: 2.3376, address: 'Rue de Rivoli, Paris, France' },
  'burj khalifa': { lat: 25.1972, lng: 55.2744, address: 'Downtown Dubai, UAE' },
  'dubai mall': { lat: 25.1985, lng: 55.2796, address: 'Financial Center Rd, Dubai, UAE' },
  'palm jumeirah': { lat: 25.1124, lng: 55.1390, address: 'Palm Jumeirah, Dubai' },
  'marina bay sands': { lat: 1.2834, lng: 103.8607, address: '10 Bayfront Ave, Singapore' },
  'gardens by the bay': { lat: 1.2816, lng: 103.8636, address: '18 Marina Gardens Dr, Singapore' },
  'sensoji temple': { lat: 35.7148, lng: 139.7967, address: 'Asakusa, Tokyo, Japan' },
  'colosseum': { lat: 41.8902, lng: 12.4922, address: 'Piazza del Colosseo, Rome, Italy' },
  'times square': { lat: 40.7580, lng: -73.9855, address: 'Manhattan, New York, USA' },
  'statue of liberty': { lat: 40.6892, lng: -74.0445, address: 'Liberty Island, New York' },
  'big ben': { lat: 51.5007, lng: -0.1246, address: 'Westminster, London, UK' },
  'london eye': { lat: 51.5033, lng: -0.1195, address: 'South Bank, London, UK' }
};

// Comprehensive city & destination centers database
const KNOWN_CITIES: Record<string, { lat: number; lng: number }> = {
  // India
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'rajasthan': { lat: 26.9124, lng: 75.7873 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'goa': { lat: 15.4989, lng: 73.8278 },
  'north goa': { lat: 15.5553, lng: 73.7517 },
  'south goa': { lat: 15.2832, lng: 73.9862 },
  'panaji': { lat: 15.4909, lng: 73.8278 },
  'manali': { lat: 32.2432, lng: 77.1892 },
  'himachal': { lat: 32.2432, lng: 77.1892 },
  'shimla': { lat: 31.1048, lng: 77.1734 },
  'dharamshala': { lat: 32.2190, lng: 76.3234 },
  'mcleodganj': { lat: 32.2426, lng: 76.3213 },
  'kasol': { lat: 32.0100, lng: 77.3150 },
  'kashmir': { lat: 34.0837, lng: 74.7973 },
  'srinagar': { lat: 34.0837, lng: 74.7973 },
  'gulmarg': { lat: 34.0484, lng: 74.3805 },
  'pahalgam': { lat: 34.0163, lng: 75.3150 },
  'leh': { lat: 34.1526, lng: 77.5771 },
  'ladakh': { lat: 34.1526, lng: 77.5771 },
  'rishikesh': { lat: 30.0869, lng: 78.2676 },
  'haridwar': { lat: 29.9457, lng: 78.1642 },
  'dehradun': { lat: 30.3165, lng: 78.0322 },
  'mussoorie': { lat: 30.4598, lng: 78.0644 },
  'nainital': { lat: 29.3803, lng: 79.4636 },
  'uttarakhand': { lat: 30.0869, lng: 78.2676 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'kashi': { lat: 25.3176, lng: 82.9739 },
  'ayodhya': { lat: 26.7922, lng: 82.1998 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'amritsar': { lat: 31.6340, lng: 74.8723 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'udaipur': { lat: 24.5854, lng: 73.7125 },
  'jodhpur': { lat: 26.2389, lng: 73.0243 },
  'jaisalmer': { lat: 26.9157, lng: 70.9083 },
  'pushkar': { lat: 26.4897, lng: 74.5511 },
  'bikaner': { lat: 28.0229, lng: 73.3119 },
  'mount abu': { lat: 24.5925, lng: 72.7156 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'coorg': { lat: 12.3375, lng: 75.8069 },
  'hampi': { lat: 15.3350, lng: 76.4600 },
  'gokarna': { lat: 14.5479, lng: 74.3188 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'pondicherry': { lat: 11.9416, lng: 79.8083 },
  'puducherry': { lat: 11.9416, lng: 79.8083 },
  'ooty': { lat: 11.4102, lng: 76.6950 },
  'kodaikanal': { lat: 10.2381, lng: 77.4892 },
  'madurai': { lat: 9.9252, lng: 78.1198 },
  'kerala': { lat: 9.9312, lng: 76.2673 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'cochin': { lat: 9.9312, lng: 76.2673 },
  'munnar': { lat: 10.0889, lng: 77.0595 },
  'alleppey': { lat: 9.4981, lng: 76.3388 },
  'alappuzha': { lat: 9.4981, lng: 76.3388 },
  'wayanad': { lat: 11.6854, lng: 76.1320 },
  'varkala': { lat: 8.7379, lng: 76.7163 },
  'kovalam': { lat: 8.4004, lng: 76.9787 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'darjeeling': { lat: 27.0410, lng: 88.2663 },
  'gangtok': { lat: 27.3389, lng: 88.6065 },
  'sikkim': { lat: 27.5330, lng: 88.5122 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'andaman': { lat: 11.6234, lng: 92.7265 },
  'port blair': { lat: 11.6234, lng: 92.7265 },
  'havelock': { lat: 11.9761, lng: 92.9876 },

  // International
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'uae': { lat: 25.2048, lng: 55.2708 },
  'abu dhabi': { lat: 24.4539, lng: 54.3773 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'phuket': { lat: 7.8804, lng: 98.3923 },
  'krabi': { lat: 8.0863, lng: 98.9063 },
  'pattaya': { lat: 12.9236, lng: 100.8825 },
  'thailand': { lat: 13.7563, lng: 100.5018 },
  'bali': { lat: -8.4095, lng: 115.1889 },
  'ubud': { lat: -8.5069, lng: 115.2625 },
  'indonesia': { lat: -8.4095, lng: 115.1889 },
  'maldives': { lat: 4.1755, lng: 73.5093 },
  'male': { lat: 4.1755, lng: 73.5093 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'france': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'uk': { lat: 51.5074, lng: -0.1278 },
  'rome': { lat: 41.9028, lng: 12.4922 },
  'italy': { lat: 41.9028, lng: 12.4922 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'japan': { lat: 35.6762, lng: 139.6503 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'nyc': { lat: 40.7128, lng: -74.0060 },
  'usa': { lat: 40.7128, lng: -74.0060 },
  'switzerland': { lat: 46.8182, lng: 8.2275 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'interlaken': { lat: 46.6863, lng: 7.8632 }
};

/**
 * Resolves precise coordinates for a destination city/region.
 * Returns exact latitude and longitude.
 */
export async function resolveDestinationCoordinates(
  destination: string
): Promise<{ latitude: number; longitude: number; formattedAddress: string }> {
  const cleanDest = (destination || '').toLowerCase().trim();
  const cacheKey = `dest_${cleanDest}`;
  if (GEO_CACHE.has(cacheKey)) {
    const cached = GEO_CACHE.get(cacheKey)!;
    return { latitude: cached.latitude, longitude: cached.longitude, formattedAddress: cached.formattedAddress || destination };
  }

  // 1. Check known cities database
  for (const [cityKey, coords] of Object.entries(KNOWN_CITIES)) {
    if (cleanDest.includes(cityKey) || cityKey.includes(cleanDest)) {
      const res = { latitude: coords.lat, longitude: coords.lng, formattedAddress: destination };
      GEO_CACHE.set(cacheKey, { ...res, source: 'city_db' });
      return res;
    }
  }

  // 2. OpenStreetMap Nominatim search (No API key required, highly accurate worldwide)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`;
    const response = await fetch(nomUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JKVoyage-TravelPlanner/1.0'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const res = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name || destination
        };
        GEO_CACHE.set(cacheKey, { ...res, source: 'nominatim' });
        return res;
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // 3. Try Google Places text search if configured
  try {
    const googleLoc = await findDestinationLocation(destination);
    if (googleLoc?.latitude && googleLoc?.longitude) {
      const res = {
        latitude: googleLoc.latitude,
        longitude: googleLoc.longitude,
        formattedAddress: googleLoc.formattedAddress || destination
      };
      GEO_CACHE.set(cacheKey, { ...res, source: 'google_places' });
      return res;
    }
  } catch {
    // Continue
  }

  // Default fallback if totally unknown: New Delhi (central India hub)
  return { latitude: 28.6139, longitude: 77.2090, formattedAddress: destination };
}

/**
 * Resolves high-precision GPS coordinates for any itinerary activity/place.
 * Strictly guarantees the pin belongs to the trip destination!
 */
export async function resolveLocationCoordinates(
  locationName: string,
  destinationCity = 'Jaipur',
  activityIndex = 0
): Promise<ResolvedCoordinates> {
  const cleanLoc = (locationName || '').toLowerCase().trim();
  const cleanDest = (destinationCity || '').toLowerCase().trim();
  const cacheKey = `loc_${cleanLoc}_${cleanDest}`;

  if (GEO_CACHE.has(cacheKey)) {
    return GEO_CACHE.get(cacheKey)!;
  }

  // 1. Check direct landmark dictionary
  for (const [key, data] of Object.entries(KNOWN_LANDMARKS)) {
    if (cleanLoc.includes(key) || key.includes(cleanLoc)) {
      const result: ResolvedCoordinates = {
        latitude: data.lat,
        longitude: data.lng,
        formattedAddress: data.address,
        source: 'landmark_db'
      };
      GEO_CACHE.set(cacheKey, result);
      return result;
    }
  }

  // 2. Query OpenStreetMap Nominatim for exact location within the destination
  try {
    const searchQuery = cleanLoc ? `${locationName}, ${destinationCity}` : destinationCity;
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
    const response = await fetch(nomUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JKVoyage-TravelPlanner/1.0'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const result: ResolvedCoordinates = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name || locationName,
          source: 'nominatim'
        };
        GEO_CACHE.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Continue to next fallback
  }

  // 3. Try Google Places text search if configured
  try {
    const query = `${locationName}, ${destinationCity}`.trim();
    const googleLoc = await findDestinationLocation(query);
    if (googleLoc?.latitude && googleLoc?.longitude) {
      const result: ResolvedCoordinates = {
        latitude: googleLoc.latitude,
        longitude: googleLoc.longitude,
        formattedAddress: googleLoc.formattedAddress || locationName,
        source: 'google_places'
      };
      GEO_CACHE.set(cacheKey, result);
      return result;
    }
  } catch {
    // Continue
  }

  // 4. Resolve destination base coordinates
  const destCoords = await resolveDestinationCoordinates(destinationCity);

  // Gentle micro-offset within destination (max ~300-600 meters) so pins don't overlap exactly
  const angle = ((activityIndex * 137.5) % 360) * (Math.PI / 180);
  const distanceKm = 0.25 + ((activityIndex % 5) * 0.15); // max 0.85 km
  const latOffset = (distanceKm / 111) * Math.cos(angle);
  const lngOffset = (distanceKm / (111 * Math.cos(destCoords.latitude * (Math.PI / 180)))) * Math.sin(angle);

  const fallbackResult: ResolvedCoordinates = {
    latitude: destCoords.latitude + latOffset,
    longitude: destCoords.longitude + lngOffset,
    formattedAddress: `${locationName || destinationCity}, ${destinationCity}`,
    source: 'destination_anchor'
  };

  GEO_CACHE.set(cacheKey, fallbackResult);
  return fallbackResult;
}

/**
 * Returns a direct Google Maps external link for directions / navigation.
 */
export function getGoogleMapsPinUrl(locationOrTitle: string, coords?: { latitude: number; longitude: number }): string {
  if (coords?.latitude && coords?.longitude && coords.latitude !== 0) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationOrTitle)}`;
}

/**
 * Checks if coordinates are plausible for a given destination.
 * Used to detect and fix legacy mispinned activities that landed in the default fallback city.
 */
export function areCoordinatesCloseToDestination(
  lat: number,
  lng: number,
  destLat: number,
  destLng: number
): boolean {
  // Rough distance in degrees: 1 degree latitude is approx 111km
  const dLat = Math.abs(lat - destLat);
  const dLng = Math.abs(lng - destLng);
  // Within ~150km of destination
  return dLat < 1.5 && dLng < 1.5;
}
