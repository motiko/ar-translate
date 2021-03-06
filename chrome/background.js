tracking.ColorTracker.registerColor("grey", function (r, g, b) {
  return r > 200 && g > 200 && b > 200 && r < 220 && g < 220 && b < 220;
});
tracking.ColorTracker.registerColor("lightgrey", function (r, g, b) {
  return r > 190 && g > 190 && b > 170 && r < 205 && g < 205 && b < 180;
});
tracking.ColorTracker.registerColor("idk", function (r, g, b) {
  return r > 95 && g > 95 && b > 95 && r < 110 && g < 110 && b < 110;
});

var colors = new tracking.ColorTracker(["lightgrey", "grey", "idk"]);

chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.command === "GET_SETTINGS") {
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      let settings = translateEngines
        ? translateEngines.find((e) => e.selected)
        : {
            name: "google",
            label: "Google Tranlsate",
            url: "https://translate.google.com/?hl=en#auto/en/",
          };
      sendResponse(settings);
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.command === "grabRegion") {
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      {
        format: "png",
      },
      (dataUrl) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          colors.on("track", function (event) {
            if (event.data.length === 0) {
              console.log("no area detected");
              sendResponse({
                error: "no area detected (check color scheme)",
              });
            } else {
              event.data
                .filter((rect, i) => i == 0)
                .forEach(function (rect, i) {
                  // console.log( i, " - ", rect.x, rect.y, rect.height, rect.width, rect.color);
                  canvas.width = rect.width;
                  canvas.height = rect.height;
                  ctx.drawImage(
                    img,
                    rect.x,
                    rect.y,
                    rect.width,
                    rect.height,
                    0,
                    0,
                    rect.width,
                    rect.height
                  );
                  const regionDataUrl = canvas.toDataURL();
                  sendResponse({ regionDataUrl });
                });
            }
          });

          tracking.track(img, colors);
        };
        img.src = dataUrl;
      }
    );
    return true;
  }
  if (request.command === "ACTIVATE_PAGE_ACTION") {
    chrome.pageAction.show(sender.tab.id);
  }
  if (request.command == "RELOAD_SCRIPT") {
    chrome.tabs.executeScript({
      file: "index.js",
    });
  }
  if (request.command === "GET_SETTINGS") {
    chrome.storage.sync.get("translateEngines", ({ translateEngines }) => {
      let settings = translateEngines
        ? translateEngines.find((e) => e.selected)
        : {
            name: "google",
            label: "Google Tranlsate",
            url: "https://translate.google.com/?hl=en#auto/en/",
            autoread: false,
          };
      sendResponse(settings);
    });
    return true;
  }
});
