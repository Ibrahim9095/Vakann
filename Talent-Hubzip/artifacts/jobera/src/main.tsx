import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";

import App from "./App";
import "./index.css";

setBaseUrl(
  import.meta.env.PROD
    ? "https://vakann-api.onrender.com"
    : ""
);

createRoot(document.getElementById("root")!).render(<App />);