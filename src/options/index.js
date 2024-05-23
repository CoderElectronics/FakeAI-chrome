/* classifier server request code */
statusMsgs = [
  "All models predict that the article is true.",
  "Some models have flagged the article as fake, it may exhibit some trends of a fake article.",
  "The article is most likely fake, as all models have predicted it to be so.",
];

truthscoreMsgs = ["True", "Maybe", "Fake"];

serverURLs = [
  "https://fakeai-api.astehneylabs.com/classify", // main public API
  "http://localhost:8003/classify", // local backup API
];

async function send_classifier_req(text) {
  try {
    const response = await fetch(
      document.getElementById("localApiToggle").checked
        ? serverURLs[1]
        : serverURLs[0],
      {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "error",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ text: text }), // body data type must match "Content-Type" header
      },
    );

    return response.json();
  } catch (error) {
    document.getElementById("loadingView").style.display = "none";
    document.getElementById("loadingError").style.display = "block";

    if (error instanceof SyntaxError) {
      // Unexpected token < in JSON
      console.log("There was a SyntaxError in API response:", error);
    } else {
      console.log("There was an error while sending request:", error);
    }
  }
}

function updatePropsByID(props) {
  for (const [key, value] of Object.entries(props)) {
    document.getElementById(key).innerHTML = value;
  }
}

const getChartOptions = (lr, dt, gbc, rfc) => {
  return {
    series: [lr, dt, gbc, rfc],
    colors: ["#E3A008", "#1A56DB", "#E74694", "#046C4E"],
    chart: {
      height: "380px",
      width: "100%",
      type: "radialBar",
      id: "resultsChart",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        track: {
          background: "#E5E7EB",
        },
        dataLabels: {
          show: false,
        },
        hollow: {
          margin: 0,
          size: "32%",
        },
      },
    },
    grid: {
      show: false,
      strokeDashArray: 4,
      padding: {
        left: 2,
        right: 2,
        top: -20,
        bottom: -20,
      },
    },
    labels: ["LR", "DT", "GBC", "RFC"],
    legend: {
      show: true,
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
    tooltip: {
      enabled: true,
      x: {
        show: false,
      },
    },
    yaxis: {
      show: false,
      labels: {
        formatter: function (value) {
          return value + "%";
        },
      },
    },
  };
};

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name == "fakeai_port") {
    port.onMessage.addListener(function (msg) {
      /* add loading overview pre-request */
      document.getElementById("loadingView").style.display = "block";

      send_classifier_req(msg.text).then((data) => {
        /* post-request data processing */
        setTimeout(() => {
          document.getElementById("loadingView").style.display = "none";
        }, 500);

        /* calculate avg and choose msgs */
        weightedAvg =
          Math.round((data.weighted_avg * 100 + Number.EPSILON) * 1000) / 1000;

        if (weightedAvg == 100) {
          truthscoreMsg = truthscoreMsgs[0];
          statusMsg = statusMsgs[0];
        } else if (weightedAvg >= 50) {
          truthscoreMsg = truthscoreMsgs[1];
          statusMsg = statusMsgs[1];
        } else {
          truthscoreMsg = truthscoreMsgs[2];
          statusMsg = statusMsgs[2];
        }

        updatePropsByID({
          meta_weightedAvg: weightedAvg + "%",
          meta_translatedStatus: truthscoreMsg,
          meta_numArticles: data.weights.num_training_articles,
          meta_modelAccuracy:
            Math.round(
              (((data.weights.score_lr +
                data.weights.score_dt +
                data.weights.score_gbc +
                data.weights.score_rfc) /
                4) *
                100 +
                Number.EPSILON) *
                1000,
            ) /
              1000 +
            "%",
          meta_responseTime:
            Math.round((data.response_time + Number.EPSILON) * 1000) / 1000 +
            " s",
          meta_modelDate: data.weights.model_date,
          meta_descContent: `
            <p class="poppins-semibold-italic" id="meta_RO_descHtml">${msg.text.split(" ").slice(0, 15).join(" ")}...</p><br>${statusMsg}
          `,
        });

        if (
          document.getElementById("radial-chart") &&
          typeof ApexCharts !== "undefined"
        ) {
          ApexCharts.exec(
            "resultsChart",
            "updateSeries",
            [
              (Math.round((data.pred_lr + Number.EPSILON) * 100) / 100) * 100,
              (Math.round((data.pred_dt + Number.EPSILON) * 100) / 100) * 100,
              (Math.round((data.pred_gbc + Number.EPSILON) * 100) / 100) * 100,
              (Math.round((data.pred_rfc + Number.EPSILON) * 100) / 100) * 100,
            ],
            true,
          );
        }
      });
    });
  }
});

document.getElementById("closeButton").addEventListener("click", () => {
  window.close();
});

document.getElementById("issueReportingButton").addEventListener("click", () => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {
    errContext = {
      page_url: currentTab.url,
      selection: document.getElementById("meta_RO_descHtml").innerHTML
    }

    console.log(errContext);

    /* open reporting form */
    document.getElementById("reportingForm").style.display = "block";
    document.getElementById("hidden_error_context").value = JSON.stringify(errContext);
  });
});

document.getElementById("closeReportingForm").addEventListener("click", () => {
  document.getElementById("reportingForm").style.display = "none";
});

document.getElementById("errorFormSubmit").addEventListener("click", () => {
  document.getElementById("reportingForm").style.display = "none";
  document.getElementById("loadingSuccess").style.display = "block";
});

document.getElementById("closeErrModel").addEventListener("click", () => {
  document.getElementById("loadingError").style.display = "none";
});

document.getElementById("closeSuccessModel").addEventListener("click", () => {
  document.getElementById("loadingSuccess").style.display = "none";
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  window.close();
});

/* Proper init function is here */
(function () {
  if (
    document.getElementById("radial-chart") &&
    typeof ApexCharts !== "undefined"
  ) {
    const chart = new ApexCharts(
      document.querySelector("#radial-chart"),
      getChartOptions(0, 0, 0, 0),
    );
    chart.render();
  }
})();
