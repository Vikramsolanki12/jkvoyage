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

export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  category: PlaceSearchCategory = "attraction",
  radius = 15000,
): Promise<GooglePlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error(
      "Google Places API key is missing."
    );
  }

  const response = await fetch(
    PLACES_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "X-Goog-Api-Key":
          GOOGLE_PLACES_API_KEY,

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
        includedTypes:
          categoryTypes[category],

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
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Google Places API failed (${response.status}): ${errorText}`
    );
  }

  const data: PlacesResponse =
    await response.json();

  console.log(
    "Google Places response:",
    data
  );

  return data.places ?? [];
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