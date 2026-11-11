import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { AuthProvider } from "./lib/auth";
import { applyTheme, getStoredTheme } from "./lib/theme";
import { initZoom } from "./lib/zoom";
import App from "./App";
import "./index.css";

applyTheme(getStoredTheme());
initZoom();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </I18nextProvider>
);
