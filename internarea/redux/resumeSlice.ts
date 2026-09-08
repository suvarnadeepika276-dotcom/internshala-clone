import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Resume } from "../types/resume";

interface ResumeBuilderState {
  draft: Partial<Resume>;
  otpStep: "idle" | "sent" | "verified";
  maskedEmail: string | null;
  paymentStep: "idle" | "order_created" | "paid" | "failed";
  error: string | null;
}

const initialState: ResumeBuilderState = {
  draft: {
    templateId: "classic-ats",
    themeColor: "#1a73e8",
    fontFamily: "Inter",
    versionName: "Version 1",
    education: [],
    skills: [],
    experience: [],
    internships: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    references: [],
    socialLinks: {},
  },
  otpStep: "idle",
  maskedEmail: null,
  paymentStep: "idle",
  error: null,
};

const resumeBuilderSlice = createSlice({
  name: "resumeBuilder",
  initialState,
  reducers: {
    updateDraftField(state, action: PayloadAction<{ field: keyof Resume; value: any }>) {
      (state.draft as any)[action.payload.field] = action.payload.value;
    },
    setDraft(state, action: PayloadAction<Partial<Resume>>) {
      state.draft = action.payload;
    },
    otpSent(state, action: PayloadAction<string>) {
      state.otpStep = "sent";
      state.maskedEmail = action.payload;
      state.error = null;
    },
    otpVerified(state) {
      state.otpStep = "verified";
      state.error = null;
    },
    paymentOrderCreated(state) {
      state.paymentStep = "order_created";
    },
    paymentSucceeded(state) {
      state.paymentStep = "paid";
    },
    paymentFailed(state, action: PayloadAction<string>) {
      state.paymentStep = "failed";
      state.error = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetBuilder() {
      return initialState;
    },
  },
});

export const {
  updateDraftField,
  setDraft,
  otpSent,
  otpVerified,
  paymentOrderCreated,
  paymentSucceeded,
  paymentFailed,
  setError,
  resetBuilder,
} = resumeBuilderSlice.actions;

export default resumeBuilderSlice.reducer;
