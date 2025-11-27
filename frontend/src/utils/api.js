const getBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const isBrowser = typeof window !== "undefined";
  const fallbackDev = import.meta.env?.DEV ? "http://localhost:5000" : "";
  if (isBrowser) {
    const origin = window.location.origin.replace(/\/$/, "");
    return origin.includes("localhost:5173") && fallbackDev ? fallbackDev : origin || fallbackDev;
  }

  return fallbackDev;
};

export const API_BASE_URL = getBaseUrl();

export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};
