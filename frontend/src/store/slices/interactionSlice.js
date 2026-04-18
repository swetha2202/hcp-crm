import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchInteractions = createAsyncThunk('interactions/fetchAll', async () => {
  const res = await api.get('/interactions');
  return res.data;
});

export const createInteraction = createAsyncThunk('interactions/create', async (data) => {
  const res = await api.post('/interactions', data);
  return res.data;
});

export const updateInteraction = createAsyncThunk('interactions/update', async ({ id, field, new_value }) => {
  const res = await api.put(`/interactions/${id}`, { field, new_value });
  return { id, field, new_value };
});

const interactionSlice = createSlice({
  name: 'interactions',
  initialState: {
    list: [],
    loading: false,
    error: null,
    lastCreated: null,
  },
  reducers: {
    clearLastCreated(state) { state.lastCreated = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (s) => { s.loading = true; })
      .addCase(fetchInteractions.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchInteractions.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(createInteraction.fulfilled, (s, a) => { s.lastCreated = a.payload; })
      .addCase(updateInteraction.fulfilled, (s, a) => {
        const { id, field, new_value } = a.payload;
        const item = s.list.find(i => i.id === id);
        if (item) item[field] = new_value;
      });
  }
});

export const { clearLastCreated } = interactionSlice.actions;
export default interactionSlice.reducer;
