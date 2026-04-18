import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const sendChatMessage = createAsyncThunk('chat/send', async ({ message, history, hcp_id }) => {
  const res = await api.post('/chat', { message, history, hcp_id });
  return res.data;
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    loading: false,
    lastToolCalls: [],
    pendingInteractionData: null,
  },
  reducers: {
    addUserMessage(state, action) {
      state.messages.push({ role: 'user', content: action.payload });
    },
    clearChat(state) {
      state.messages = [];
      state.lastToolCalls = [];
      state.pendingInteractionData = null;
    },
    clearPendingData(state) {
      state.pendingInteractionData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (s) => { s.loading = true; })
      .addCase(sendChatMessage.fulfilled, (s, a) => {
        s.loading = false;
        s.messages.push({ role: 'assistant', content: a.payload.response });
        s.lastToolCalls = a.payload.tool_calls || [];
        if (a.payload.interaction_data) {
          s.pendingInteractionData = a.payload.interaction_data;
        }
      })
      .addCase(sendChatMessage.rejected, (s, a) => {
        s.loading = false;
        s.messages.push({ role: 'assistant', content: 'Error: ' + a.error.message });
      });
  }
});

export const { addUserMessage, clearChat, clearPendingData } = chatSlice.actions;
export default chatSlice.reducer;
