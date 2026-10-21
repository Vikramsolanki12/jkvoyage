export interface GooglePlacePhoto {
  name: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<{
    displayName?: string;
    uri?: string;
    photoUri?: string;
  }>;
}

export interface GooglePlace {
  id: string;

  displayName?: {
    text: string;
    languageCode?: string;
  };

  formattedAddress?: string;

  location?: {
    latitude: number;
    longitude: number;
  };

  rating?: number;

  userRatingCount?: number;

  primaryType?: string;

  types?: string[];

  googleMapsUri?: string;

  websiteUri?: string;

  photos?: GooglePlacePhoto[];
}

interface PlacesResponse {
  places?: GooglePlace[];
}

const GOOGLE_PLACES_API_KEY =
  import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const PLACES_URL =
  "https://places.googleapis.com/v1/places:searchNearby";

export type PlaceSearchCategory =
  | "attraction"
  | "restaurant"
  | "cafe"
  | "hotel";

const categoryTypes: Record<
  PlaceSearchCategory,
  string[]
> = {
  attraction: [
    "tourist_attraction",
    "museum",
    "historical_landmark",
    "monument",
  ],

  restaurant: ["restaurant"],

  cafe: ["cafe"],

  hotel: ["hotel"],
};

export async function fetchGeminiExplorePlaces(
  destination: string,
  category: string = "all",
  coordinates?: { latitude: number; longitude: number },
  userQuery?: string
): Promise<GooglePlace[]> {
  try {
    const res = await fetch("/api/gemini/explore-places", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination,
        category,
        coordinates,
        userQuery,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini explore failed (${res.status})`);
    }

    const data = await res.json();
    const rawPlaces = data.places || [];

    return rawPlaces.map((p: any) => ({
      id: p.id || `gemini_${Math.random().toString(36).slice(2, 9)}`,
      displayName: {
        text: p.title || "Nearby Spot",
      },
      formattedAddress: p.address || destination,
      rating: typeof p.rating === "number" ? p.rating : 4.8,
      userRatingCount: typeof p.reviewCount === "number" ? p.reviewCount : 1450,
      primaryType: p.category || "attraction",
      types: Array.isArray(p.tags) ? p.tags : [p.category || "point_of_interest"],
      googleMapsUri:
        p.googleMapsUri ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (p.title || destination) + " " + destination
        )}`,
      location:
        p.latitude && p.longitude
          ? {
              latitude: p.latitude,
              longitude: p.longitude,
            }
          : undefined,
    }));
  } catch (err) {
    console.warn("Failed to fetch from Gemini explore-places endpoint:", err);
    return [];
  }
}

export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  category: PlaceSearchCategory = "attraction",
  radius = 15000,
  destinationName?: string
): Promise<GooglePlace[]> {
  // If Google Places API key is present, attempt live Google Places API
  if (GOOGLE_PLACES_API_KEY) {
    try {
      const response = await fetch(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.primaryType",
            "places.types",
            "places.googleMapsUri",
            "places.websiteUri",
            "places.photos",
          ].join(","),
        },
        body: JSON.stringify({
          includedTypes: categoryTypes[category],
          maxResultCount: 20,
          rankPreference: "POPULARITY",
          locationRestriction: {
            circle: {
              center: {
                latitude,
                longitude,
              },
              radius,
            },
          },
        }),
      });

      if (response.ok) {
        const data: PlacesResponse = await response.json();
        if (data.places && data.places.length > 0) {
          return data.places;
        }
      }
    } catch (gErr) {
      console.warn("Google Places API live call notice, trying Gemini API:", gErr);
    }
  }

  // Use Gemini API for smart, curated nearby places exploration
  return fetchGeminiExplorePlaces(destinationName || "your destination", category, {
    latitude,
    longitude,
  });
}


/**
 * Get the actual image URL from Google.
 *
 * Google Place Photos returns JSON containing
 * photoUri when skipHttpRedirect=true.
 */
export async function getPlacePhotoUrl(
  photoName?: string
): Promise<string | null> {
  if (
    !photoName ||
    !GOOGLE_PLACES_API_KEY
  ) {
    return null;
  }

  try {
    const url =
      `https://places.googleapis.com/v1/${photoName}/media` +
      `?maxWidthPx=800` +
      `&maxHeightPx=600` +
      `&skipHttpRedirect=true`;

    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key":
          GOOGLE_PLACES_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(
        "Google photo request failed:",
        response.status,
        await response.text()
      );

      return null;
    }

    const data = await response.json();

    console.log(
      "Google photo response:",
      data
    );

    return data.photoUri ?? null;
  } catch (error) {
    console.error(
      "Failed to load Google place photo:",
      error
    );

    return null;
  }
}