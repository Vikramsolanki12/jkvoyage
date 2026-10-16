export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TravellerResponse {
  id: number;
  tripId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  relationship: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTravellerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  relationship?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export type UpdateTravellerRequest = CreateTravellerRequest;

export const getTravellers = async (
  _tripId: number,
): Promise<ApiResponse<TravellerResponse[]>> => {
  return { success: true, data: [] };
};

export const getTraveller = async (
  _tripId: number,
  _travellerId: number,
): Promise<ApiResponse<TravellerResponse | null>> => {
  return { success: true, data: null };
};

export const createTraveller = async (
  tripId: number,
  data: CreateTravellerRequest,
): Promise<ApiResponse<TravellerResponse>> => {
  return {
    success: true,
    data: {
      id: Date.now(),
      tripId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      relationship: data.relationship ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

export const updateTraveller = async (
  tripId: number,
  travellerId: number,
  data: UpdateTravellerRequest,
): Promise<ApiResponse<TravellerResponse>> => {
  return {
    success: true,
    data: {
      id: travellerId,
      tripId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      relationship: data.relationship ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

export const deleteTraveller = async (
  _tripId: number,
  _travellerId: number,
): Promise<ApiResponse<null>> => {
  return { success: true, data: null };
};
