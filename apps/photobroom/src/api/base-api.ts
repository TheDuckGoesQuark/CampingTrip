import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8003/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: 'photobroomApi',
  baseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});
