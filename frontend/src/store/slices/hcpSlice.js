import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchHCPs = createAsyncThunk('hcp/fetchAll', async () => {
  const res = await api.get('/hcp');
  return res.data;
});

export const searchHCPs = createAsyncThunk('hcp/search', async (q) => {
  const res = await api.get(`/hcp/search?q=${q}`);
  return res.data;
});

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: { list: [], searchResults: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.fulfilled, (s, a) => { s.list = a.payload; })
      .addCase(searchHCPs.fulfilled, (s, a) => { s.searchResults = a.payload; });
  }
});

export default hcpSlice.reducer;
