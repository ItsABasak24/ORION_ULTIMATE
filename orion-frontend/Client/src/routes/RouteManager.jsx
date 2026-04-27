import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import SignupPage from "../pages/SignupPage";
import LoginPage from "../pages/LoginPage";
import UploadPage from "../pages/UplodePage";
import SearchAndAskPage from "../pages/SearchAndAskPage";
import ProtectedRoute from "./ProtectedRoute";

function RouteManager() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
                <Route path="/ask-orion" element={<ProtectedRoute><SearchAndAskPage /></ProtectedRoute>} />
            </Routes>
        </>
    );
};

export default RouteManager;