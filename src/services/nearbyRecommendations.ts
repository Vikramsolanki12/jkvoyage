export interface NearbyRecommendation {
  id: string;
  name: string;
  type: 'place' | 'restaurant' | 'activity';
  category: string;
  distance: string;
  rating: number;
  estCostINR: number;
  description: string;
  recommendedTime: string;
  address: string;
}

// Curated database of prominent Indian & global locations with nearby spots & restaurants
const KNOWN_DESTINATION_HUBS: Record<string, NearbyRecommendation[]> = {
  // Jaipur / Amer
  amber: [
    {
      id: 'nb_amber_1',
      name: 'Panna Meena ka Kund Geometric Stepwell',
      type: 'place',
      category: 'Sightseeing',
      distance: '1.1 km away',
      rating: 4.8,
      estCostINR: 0,
      description: 'Ancient 16th-century symmetrical stepwell with criss-cross stone stairs.',
      recommendedTime: '08:00 AM',
      address: 'Near Anokhi Museum, Amer'
    },
    {
      id: 'nb_amber_2',
      name: '1135 AD Royal Fine Dining',
      type: 'restaurant',
      category: 'Dining',
      distance: 'Inside Fort complex',
      rating: 4.9,
      estCostINR: 2200,
      description: 'Silver-plated tableware, candle-lit Mughal archways and royal Rajputana curries.',
      recommendedTime: '01:00 PM',
      address: 'Level 2, Jaleb Chowk, Amber Fort'
    },
    {
      id: 'nb_amber_3',
      name: 'Jaigarh Fort & Jaivana Cannon Hill',
      type: 'place',
      category: 'Sightseeing',
      distance: '2.4 km uphill',
      rating: 4.7,
      estCostINR: 200,
      description: 'Fortress housing the worlds largest cannon on wheels with Maota Lake views.',
      recommendedTime: '04:00 PM',
      address: 'Cheel ka Teela, Amer'
    },
    {
      id: 'nb_amber_4',
      name: 'The Stag Rooftop Restro-Cafe',
      type: 'restaurant',
      category: 'Cafe',
      distance: '800 m away',
      rating: 4.6,
      estCostINR: 600,
      description: 'Unobstructed rooftop view facing Amber Palace lights with cold coffee & wraps.',
      recommendedTime: '06:00 PM',
      address: 'Amer Main Road, Opposite Fort'
    }
  ],
  jaipur: [
    {
      id: 'nb_jp_1',
      name: 'LMB (Laxmi Misthan Bhandar) Johari Bazaar',
      type: 'restaurant',
      category: 'Dining',
      distance: '0.5 km from City Palace',
      rating: 4.7,
      estCostINR: 850,
      description: 'Legendary 1727 Rajasthani eatery famous for Ghewar, Pyaaz Kachori and Royal Thali.',
      recommendedTime: '12:30 PM',
      address: 'Johari Bazaar, Pink City'
    },
    {
      id: 'nb_jp_2',
      name: 'Hawa Mahal Palace of Winds Winds & Wind Cafe',
      type: 'place',
      category: 'Sightseeing',
      distance: '1.2 km away',
      rating: 4.8,
      estCostINR: 100,
      description: '953 pink sandstone honeycomb windows designed for royal ladies to view city bazaars.',
      recommendedTime: '09:00 AM',
      address: 'Badi Choupad, J.D.A. Market'
    },
    {
      id: 'nb_jp_3',
      name: 'Bar Palladio Jaipur',
      type: 'restaurant',
      category: 'Cafe & Lounge',
      distance: '3.1 km away',
      rating: 4.8,
      estCostINR: 2000,
      description: 'Stunning cobalt-blue Italian salon inside palace gardens with craft mocktails.',
      recommendedTime: '07:30 PM',
      address: 'Narain Niwas Palace, Kanota Bagh'
    },
    {
      id: 'nb_jp_4',
      name: 'Nahargarh Fort Padao Sunset Ridge',
      type: 'place',
      category: 'Sightseeing',
      distance: '4.5 km away',
      rating: 4.9,
      estCostINR: 250,
      description: 'Panoramic cliff viewpoint gazing down across the illuminated Pink City skyline.',
      recommendedTime: '05:30 PM',
      address: 'Aravalli Hills, Jaipur'
    }
  ],
  udaipur: [
    {
      id: 'nb_ud_1',
      name: 'Ambrai Restaurant at Amet Haveli',
      type: 'restaurant',
      category: 'Dining',
      distance: 'On Lake Pichola Banks',
      rating: 4.9,
      estCostINR: 1800,
      description: 'Waterside dining right opposite the illuminated City Palace and Jag Mandir.',
      recommendedTime: '07:30 PM',
      address: 'Amet Haveli, Naga Nagri'
    },
    {
      id: 'nb_ud_2',
      name: 'Jagdish Temple 1651 Carved Sanctum',
      type: 'place',
      category: 'Culture',
      distance: '400 m from City Palace',
      rating: 4.8,
      estCostINR: 0,
      description: 'Magnificent Indo-Aryan temple with towering spire and intricate marble statues.',
      recommendedTime: '08:30 AM',
      address: 'City Palace Road, Udaipur'
    },
    {
      id: 'nb_ud_3',
      name: 'Bagore Ki Haveli Dharohar Evening Dance',
      type: 'activity',
      category: 'Culture',
      distance: '600 m away',
      rating: 4.8,
      estCostINR: 150,
      description: 'Nightly folk performance with 7-pot balance dance and traditional puppetry.',
      recommendedTime: '07:00 PM',
      address: 'Gangaur Ghat Marg, Udaipur'
    }
  ],
  delhi: [
    {
      id: 'nb_del_1',
      name: 'Karim\'s Jama Masjid & Al Jawahar',
      type: 'restaurant',
      category: 'Dining',
      distance: '300 m from Red Fort',
      rating: 4.8,
      estCostINR: 900,
      description: 'Centuries-old Mughlai kebabs, mutton burra, and buttery roomali rotis.',
      recommendedTime: '01:30 PM',
      address: 'Gali Kababian, Jama Masjid, Old Delhi'
    },
    {
      id: 'nb_del_2',
      name: 'Sunder Nursery Heritage Garden',
      type: 'place',
      category: 'Sightseeing',
      distance: '1.5 km from Humayun Tomb',
      rating: 4.9,
      estCostINR: 100,
      description: 'Restored 16th-century Mughal garden with marble fountains and artisanal weekend market.',
      recommendedTime: '10:00 AM',
      address: 'Nizamuddin West, New Delhi'
    }
  ],
  goa: [
    {
      id: 'nb_goa_1',
      name: 'Fisherman\'s Wharf Heritage Seaport Dining',
      type: 'restaurant',
      category: 'Dining',
      distance: '1.8 km from Cavelossim',
      rating: 4.8,
      estCostINR: 1500,
      description: 'Goan prawn curry, butter garlic lobster, and live acoustic Latin jazz on the riverbank.',
      recommendedTime: '01:00 PM',
      address: 'Mobor, Cavelossim, South Goa'
    },
    {
      id: 'nb_goa_2',
      name: 'Cabo de Rama Cliff Fort & Secret Bay',
      type: 'place',
      category: 'Sightseeing',
      distance: '4.2 km away',
      rating: 4.7,
      estCostINR: 0,
      description: 'Historic coastal fortress ruin with azure 180-degree Arabian Sea panorama.',
      recommendedTime: '04:30 PM',
      address: 'Canacona, South Goa'
    }
  ]
};

// Smart auto-detection engine for nearby places & restaurants
export function detectNearbyPlaces(
  locationQuery: string,
  destination: string = ''
): NearbyRecommendation[] {
  const normalizedQuery = (locationQuery + ' ' + destination).toLowerCase().trim();

  // 1. Direct hub match
  for (const [key, spots] of Object.entries(KNOWN_DESTINATION_HUBS)) {
    if (normalizedQuery.includes(key)) {
      return spots;
    }
  }

  // 2. Synthesize nearby context based on keyword patterns if not specifically indexed
  const baseCity = destination.split(',')[0].trim() || 'Nearby Area';
  return [
    {
      id: 'dyn_nb_1',
      name: `Top Heritage Landmark near ${locationQuery || baseCity}`,
      type: 'place',
      category: 'Sightseeing',
      distance: '1.2 km away',
      rating: 4.7,
      estCostINR: 200,
      description: `Major cultural attraction within walking distance of ${locationQuery || baseCity}.`,
      recommendedTime: '10:00 AM',
      address: `Surrounding district, ${baseCity}`
    },
    {
      id: 'dyn_nb_2',
      name: `Authentic Local Cuisine & Thali near ${locationQuery || baseCity}`,
      type: 'restaurant',
      category: 'Dining',
      distance: '650 m away',
      rating: 4.8,
      estCostINR: 650,
      description: `Popular chef-recommended eatery serving regional specialties near ${locationQuery || baseCity}.`,
      recommendedTime: '01:30 PM',
      address: `Main Market, ${baseCity}`
    },
    {
      id: 'dyn_nb_3',
      name: `Panoramic Viewpoint & Sunset Point near ${locationQuery || baseCity}`,
      type: 'place',
      category: 'Sightseeing',
      distance: '2.5 km away',
      rating: 4.9,
      estCostINR: 100,
      description: `Elevated vantage spot ideal for golden hour photography and scenic vistas.`,
      recommendedTime: '05:30 PM',
      address: `Overlook Trail, ${baseCity}`
    },
    {
      id: 'dyn_nb_4',
      name: `Artisanal Coffee & Restro-Lounge`,
      type: 'restaurant',
      category: 'Cafe',
      distance: '900 m away',
      rating: 4.6,
      estCostINR: 450,
      description: `Relaxing air-conditioned cafe with cold brews, light bites, and outdoor patio.`,
      recommendedTime: '04:00 PM',
      address: `High Street, ${baseCity}`
    }
  ];
}
