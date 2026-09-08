import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../Feature/Userslice";
import resumeBuilderReducer from "../../redux/resumeSlice";   // ADD THIS

export const store = configureStore({
    reducer: {
        user: userReducer,
        resumeBuilder: resumeBuilderReducer,   // ADD THIS
    },
});