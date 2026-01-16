// Dynamically load Google Fonts
export const loadFonts = () => {
  // Check if already loaded
  if (document.getElementById("google-fonts")) {
    return;
  }

  // Preconnect to Google Fonts for faster loading
  const stylesheetPreconnect = document.createElement("link");
  stylesheetPreconnect.rel = "preconnect";
  stylesheetPreconnect.href = "https://fonts.googleapis.com";
  document.head.appendChild(stylesheetPreconnect);

  const fontFilesPreconnect = document.createElement("link");
  fontFilesPreconnect.rel = "preconnect";
  fontFilesPreconnect.href = "https://fonts.gstatic.com";
  fontFilesPreconnect.crossOrigin = "anonymous";
  document.head.appendChild(fontFilesPreconnect);

  // Load Montserrat font
  const link = document.createElement("link");
  link.id = "google-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap";

  document.head.insertBefore(link, document.head.firstChild);
};

