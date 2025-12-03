import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import ArenaPage from "./components/ArenaPage";
import SettingsPage from "./components/SettingsPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="arena" element={<ArenaPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route
                        path="*"
                        element={
                            <div className="text-center p-10">
                                404 Not Found
                            </div>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
