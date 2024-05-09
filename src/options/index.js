async function send_classifier_req(text) {
    const response = await fetch("http://127.0.0.1:5000/classify", {
        method: "POST", 
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
        },
        redirect: "error",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({"text": text}), // body data type must match "Content-Type" header
    });
    return response.json();
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
            background: '#E5E7EB',
          },
          dataLabels: {
            show: false,
          },
          hollow: {
            margin: 0,
            size: "32%",
          }
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
            return value + '%';
          }
        }
      }
    }
}

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name == "fakeai_port") {
        port.onMessage.addListener(function(msg) {
            send_classifier_req(msg.text).then((data) => {
                console.log(data);

                updatePropsByID({
                    "meta_weightedAvg": (Math.round(((data.weighted_avg*100) + Number.EPSILON) * 1000) / 1000) + "%",
                    "meta_lowestPred": (Math.round(((Math.min(...[data.pred_lr, data.pred_dt, data.pred_gbc, data.pred_rfc])*100) + Number.EPSILON) * 100) / 100) + "%",
                    "meta_numArticles": data.weights.num_training_articles,
                    "meta_modelAccuracy": (Math.round(((((data.weights.score_lr + data.weights.score_dt + data.weights.score_gbc + data.weights.score_rfc)/4)*100) + Number.EPSILON) * 1000) / 1000) + "%",
                    "meta_responseTime": (Math.round((data.response_time + Number.EPSILON) * 1000) / 1000) + " s",
                    "meta_modelDate": data.weights.model_date,
                    "meta_descContent": msg.text.slice(0, 250) + " ..."
                })

                if (document.getElementById("radial-chart") && typeof ApexCharts !== 'undefined') {
                    ApexCharts.exec('resultsChart', 'updateSeries', [
                        (Math.round((data.pred_lr + Number.EPSILON) * 100) / 100) * 100,
                        (Math.round((data.pred_dt + Number.EPSILON) * 100) / 100) * 100,
                        (Math.round((data.pred_gbc + Number.EPSILON) * 100) / 100) * 100,
                        (Math.round((data.pred_rfc + Number.EPSILON) * 100) / 100) * 100
                    ], true);
                }
            });
        });
    }
});

document.getElementById('closeButton').addEventListener("click", () => {window.close()});

/* Proper init function is here */
(function(){
    if (document.getElementById("radial-chart") && typeof ApexCharts !== 'undefined') {
        const chart = new ApexCharts(document.querySelector("#radial-chart"), getChartOptions(0, 0, 0, 0));
        chart.render();
    }
})();