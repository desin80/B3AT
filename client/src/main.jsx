import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <React.Suspense
            fallback={
                <div className="text-center mt-10">Loading Config...</div>
            }
        >
            <App />
        </React.Suspense>
    </React.StrictMode>
);
