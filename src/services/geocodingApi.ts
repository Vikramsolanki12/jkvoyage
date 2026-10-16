export interface LocationResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface TextSearchResponse {
  places?: Array<{
    id?: string;

    displayName?: {
      text: string;
    };

    formattedAddress?: string;

    location?: {
      latitude: number;
      longitude: number;
    };
  }>;
}

const API_KEY =
  import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

export async function findDestinationLocation(
  destination: string
): Promise<LocationResult | null> {
  if (!API_KEY) {
    throw new Error(
      "Google Places API key is missing."
    );
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,

        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
        ].join(","),
      },

      body: JSON.stringify({
        textQuery: destination,
        pageSize: 1,
        regionCode: "IN",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Destination search failed (${response.status}): ${errorText}`
    );
  }

  const data: TextSearchResponse = await response.json();

  const place = data.places?.[0];

  if (!place?.location) {
    return null;
  }

  return {
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    formattedAddress: place.formattedAddress,
  };
}