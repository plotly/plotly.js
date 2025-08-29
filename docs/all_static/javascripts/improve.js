(function ($) {
  var db = new Object();
  db.menuMobile = function () {
    $('.menu-icon').click(function () {
      $('body').addClass("open-menu");
    });

    $('.close-menu').click(function () {
      $('body').removeClass("open-menu");
    });
  };
  db.switchMode = function () {
    const theme = localStorage.getItem('theme');
    if (theme === "dark-mode") {
      // $("body").addClass("dark-mode");
      javascript: document.querySelectorAll(".js-plotly-plot").forEach(function (gd) {
        Plotly.relayout(gd, {
          "template.layout": {
            annotationdefaults: {
              arrowcolor: "#f2f5fa",
              arrowhead: 0,
              arrowwidth: 1,
            },
            autotypenumbers: "strict",
            coloraxis: {
              colorbar: {
                outlinewidth: 0,
                ticks: ""
              }
            },
            colorscale: {
              diverging: [
                  [0, "#8e0152"],
                  [0.1, "#c51b7d"],
                  [0.2, "#de77ae"],
                  [0.3, "#f1b6da"],
                  [0.4, "#fde0ef"],
                  [0.5, "#f7f7f7"],
                  [0.6, "#e6f5d0"],
                  [0.7, "#b8e186"],
                  [0.8, "#7fbc41"],
                  [0.9, "#4d9221"],
                  [1, "#276419"],
                ],
              sequential: [
                  [0.0, "#0d0887"],
                  [0.1111111111111111, "#46039f"],
                  [0.2222222222222222, "#7201a8"],
                  [0.3333333333333333, "#9c179e"],
                  [0.4444444444444444, "#bd3786"],
                  [0.5555555555555556, "#d8576b"],
                  [0.6666666666666666, "#ed7953"],
                  [0.7777777777777778, "#fb9f3a"],
                  [0.8888888888888888, "#fdca26"],
                  [1.0, "#f0f921"],
                ],
              sequentialminus: [
                  [0.0, "#0d0887"],
                  [0.1111111111111111, "#46039f"],
                  [0.2222222222222222, "#7201a8"],
                  [0.3333333333333333, "#9c179e"],
                  [0.4444444444444444, "#bd3786"],
                  [0.5555555555555556, "#d8576b"],
                  [0.6666666666666666, "#ed7953"],
                  [0.7777777777777778, "#fb9f3a"],
                  [0.8888888888888888, "#fdca26"],
                  [1.0, "#f0f921"],
                ],
            },
            font: {
              color: "#f2f5fa"
            },
            geo: {
              bgcolor: "#161a1d",
              lakecolor: "#161a1d",
              landcolor: "#161a1d",
              showlakes: true,
              showland: true,
              subunitcolor: "#506784",
            },
            hoverlabel: {
              align: "left"
            },
            hovermode: "closest",
            mapbox: {
              style: "dark"
            },
            paper_bgcolor: "#161a1d",
            plot_bgcolor: "#161a1d",
            polar: {
              angularaxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
              bgcolor: "#161a1d",
              radialaxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
            },
            scene: {
              xaxis: {
                backgroundcolor: "#161a1d",
                gridcolor: "#506784",
                gridwidth: 2,
                linecolor: "#506784",
                showbackground: true,
                ticks: "",
                zerolinecolor: "#C8D4E3",
              },
              yaxis: {
                backgroundcolor: "#161a1d",
                gridcolor: "#506784",
                gridwidth: 2,
                linecolor: "#506784",
                showbackground: true,
                ticks: "",
                zerolinecolor: "#C8D4E3",
              },
              zaxis: {
                backgroundcolor: "#161a1d",
                gridcolor: "#506784",
                gridwidth: 2,
                linecolor: "#506784",
                showbackground: true,
                ticks: "",
                zerolinecolor: "#C8D4E3",
              },
            },
            shapedefaults: {
              line: {
                color: "#f2f5fa"
              }
            },
            sliderdefaults: {
              bgcolor: "#C8D4E3",
              bordercolor: "#161a1d",
              borderwidth: 1,
              tickwidth: 0,
            },
            ternary: {
              aaxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
              baxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
              bgcolor: "#161a1d",
              caxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
            },
            title: {
              x: 0.05
            },
            updatemenudefaults: {
              bgcolor: "#506784",
              borderwidth: 0
            },
            xaxis: {
              automargin: true,
              gridcolor: "#283442",
              linecolor: "#506784",
              ticks: "",
              title: {
                standoff: 15
              },
              zerolinecolor: "#283442",
              zerolinewidth: 2,
            },
            yaxis: {
              automargin: true,
              gridcolor: "#283442",
              linecolor: "#506784",
              ticks: "",
              title: {
                standoff: 15
              },
              zerolinecolor: "#283442",
              zerolinewidth: 2,
            },
          },
        });
      });
    }
    else {}
    $(".switch-mode .switch").click(function () {
      $("html").toggleClass("dark-mode");
      if ($("html").hasClass("dark-mode")) {
        window.localStorage.setItem('theme', 'dark-mode');
        javascript: document.querySelectorAll(".js-plotly-plot").forEach(function (gd) {
          Plotly.relayout(gd, {
            "template.layout": {
              annotationdefaults: {
                arrowcolor: "#f2f5fa",
                arrowhead: 0,
                arrowwidth: 1,
              },
              autotypenumbers: "strict",
              coloraxis: {
                colorbar: {
                  outlinewidth: 0,
                  ticks: ""
                }
              },
              colorscale: {
                diverging: [
                    [0, "#8e0152"],
                    [0.1, "#c51b7d"],
                    [0.2, "#de77ae"],
                    [0.3, "#f1b6da"],
                    [0.4, "#fde0ef"],
                    [0.5, "#f7f7f7"],
                    [0.6, "#e6f5d0"],
                    [0.7, "#b8e186"],
                    [0.8, "#7fbc41"],
                    [0.9, "#4d9221"],
                    [1, "#276419"],
                  ],
                sequential: [
                    [0.0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1.0, "#f0f921"],
                  ],
                sequentialminus: [
                    [0.0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1.0, "#f0f921"],
                  ],
              },
              font: {
                color: "#f2f5fa"
              },
              geo: {
                bgcolor: "#161a1d",
                lakecolor: "#161a1d",
                landcolor: "#161a1d",
                showlakes: true,
                showland: true,
                subunitcolor: "#506784",
              },
              hoverlabel: {
                align: "left"
              },
              hovermode: "closest",
              mapbox: {
                style: "dark"
              },
              paper_bgcolor: "#161a1d",
              plot_bgcolor: "#161a1d",
              polar: {
                angularaxis: {
                  gridcolor: "#506784",
                  linecolor: "#506784",
                  ticks: "",
                },
                bgcolor: "#161a1d",
                radialaxis: {
                  gridcolor: "#506784",
                  linecolor: "#506784",
                  ticks: "",
                },
              },
              scene: {
                xaxis: {
                  backgroundcolor: "#161a1d",
                  gridcolor: "#506784",
                  gridwidth: 2,
                  linecolor: "#506784",
                  showbackground: true,
                  ticks: "",
                  zerolinecolor: "#C8D4E3",
                },
                yaxis: {
                  backgroundcolor: "#161a1d",
                  gridcolor: "#506784",
                  gridwidth: 2,
                  linecolor: "#506784",
                  showbackground: true,
                  ticks: "",
                  zerolinecolor: "#C8D4E3",
                },
                zaxis: {
                  backgroundcolor: "#161a1d",
                  gridcolor: "#506784",
                  gridwidth: 2,
                  linecolor: "#506784",
                  showbackground: true,
                  ticks: "",
                  zerolinecolor: "#C8D4E3",
                },
              },
              shapedefaults: {
                line: {
                  color: "#f2f5fa"
                }
              },
              sliderdefaults: {
                bgcolor: "#C8D4E3",
                bordercolor: "#161a1d",
                borderwidth: 1,
                tickwidth: 0,
              },
              ternary: {
                aaxis: {
                  gridcolor: "#506784",
                  linecolor: "#506784",
                  ticks: "",
                },
                baxis: {
                  gridcolor: "#506784",
                  linecolor: "#506784",
                  ticks: "",
                },
                bgcolor: "#161a1d",
                caxis: {
                  gridcolor: "#506784",
                  linecolor: "#506784",
                  ticks: "",
                },
              },
              title: {
                x: 0.05
              },
              updatemenudefaults: {
                bgcolor: "#506784",
                borderwidth: 0
              },
              xaxis: {
                automargin: true,
                gridcolor: "#283442",
                linecolor: "#506784",
                ticks: "",
                title: {
                  standoff: 15
                },
                zerolinecolor: "#283442",
                zerolinewidth: 2,
              },
              yaxis: {
                automargin: true,
                gridcolor: "#283442",
                linecolor: "#506784",
                ticks: "",
                title: {
                  standoff: 15
                },
                zerolinecolor: "#283442",
                zerolinewidth: 2,
              },
            },
          });
        });
      } else {
        window.localStorage.setItem('theme', 'light-mode');
        javascript: document.querySelectorAll(".js-plotly-plot").forEach(function (gd) {
          Plotly.relayout(gd, {
            "template.layout": {
              annotationdefaults: {
                arrowcolor: "#2a3f5f",
                arrowhead: 0,
                arrowwidth: 1,
              },
              autotypenumbers: "strict",
              coloraxis: {
                colorbar: {
                  outlinewidth: 0,
                  ticks: "",
                },
              },
              colorscale: {
                diverging: [
                    [0, "#8e0152"],
                    [0.1, "#c51b7d"],
                    [0.2, "#de77ae"],
                    [0.3, "#f1b6da"],
                    [0.4, "#fde0ef"],
                    [0.5, "#f7f7f7"],
                    [0.6, "#e6f5d0"],
                    [0.7, "#b8e186"],
                    [0.8, "#7fbc41"],
                    [0.9, "#4d9221"],
                    [1, "#276419"],
                  ],
                sequential: [
                    [0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1, "#f0f921"],
                  ],
                sequentialminus: [
                    [0, "#0d0887"],
                    [0.1111111111111111, "#46039f"],
                    [0.2222222222222222, "#7201a8"],
                    [0.3333333333333333, "#9c179e"],
                    [0.4444444444444444, "#bd3786"],
                    [0.5555555555555556, "#d8576b"],
                    [0.6666666666666666, "#ed7953"],
                    [0.7777777777777778, "#fb9f3a"],
                    [0.8888888888888888, "#fdca26"],
                    [1, "#f0f921"],
                  ],
              },
              colorway: [
                  "#1F77B4",
                  "#EF553B",
                  "#00cc96",
                  "#ab63fa",
                  "#FFA15A",
                  "#19d3f3",
                  "#FF6692",
                  "#B6E880",
                  "#FF97FF",
                  "#FECB52",
                ],
              font: {
                color: "#2a3f5f",
              },
              geo: {
                bgcolor: "white",
                lakecolor: "white",
                landcolor: "#E5ECF6",
                showlakes: true,
                showland: true,
                subunitcolor: "white",
              },
              hoverlabel: {
                align: "left",
              },
              hovermode: "closest",
              mapbox: {
                style: "light",
              },
              paper_bgcolor: "white",
              plot_bgcolor: "#fff",
              polar: {
                angularaxis: {
                  gridcolor: "white",
                  linecolor: "#EEEEEE",
                  ticks: "",
                },
                bgcolor: "#E5ECF6",
                radialaxis: {
                  gridcolor: "white",
                  linecolor: "#EEEEEE",
                  ticks: "",
                },
              },
              scene: {
                xaxis: {
                  backgroundcolor: "#E5ECF6",
                  gridcolor: "white",
                  gridwidth: 2,
                  linecolor: "#EEEEEE",
                  showbackground: true,
                  ticks: "",
                  zerolinecolor: "white",
                },
                yaxis: {
                  backgroundcolor: "#E5ECF6",
                  gridcolor: "white",
                  gridwidth: 2,
                  linecolor: "#EEEEEE",
                  showbackground: true,
                  ticks: "",
                  zerolinecolor: "white",
                },
                zaxis: {
                  backgroundcolor: "#E5ECF6",
                  gridcolor: "white",
                  gridwidth: 2,
                  linecolor: "#EEEEEE",
                  showbackground: true,
                  ticks: "",
                  zerolinecolor: "white",
                },
              },
              shapedefaults: {
                line: {
                  color: "#2a3f5f",
                },
              },
              ternary: {
                aaxis: {
                  gridcolor: "white",
                  linecolor: "#EEEEEE",
                  ticks: "",
                },
                baxis: {
                  gridcolor: "white",
                  linecolor: "#EEEEEE",
                  ticks: "",
                },
                bgcolor: "whi",
                caxis: {
                  gridcolor: "white",
                  linecolor: "#EEEEEE",
                  ticks: "",
                },
              },
              title: {
                x: 0.05,
              },
              xaxis: {
                automargin: true,
                gridcolor: "#EEEEEE",
                linecolor: "#EEEEEE",
                ticks: "",
                title: {
                  standoff: 15,
                },
                zerolinecolor: "white",
                zerolinewidth: 2,
              },
              yaxis: {
                automargin: true,
                gridcolor: "#EEEEEE",
                linecolor: "#EEEEEE",
                ticks: "",
                title: {
                  standoff: 15,
                },
                zerolinecolor: "white",
                zerolinewidth: 2,
              },
            },
          });
        });
      }
    });
  };
  $.fn.ignore = function (sel) {
    return this.clone().find(sel || ">*").remove().end();
  };
  db.copyButton = function () {
    setTimeout(function () {
      $(".hljs").each(function () {
        $(this).append("<div class='db-copy'><svg class='SVGInline-svg SVGInline--cleaned-svg SVG-svg Icon-svg Icon--clipboard-svg SVG--color-svg SVG--color--blue200-svg' style='width: 14px;height: 14px;' height='14' viewBox='0 0 16 16'  xmlns='http://www.w3.org/2000/svg'><path d='M7 5h2a3 3 0 0 0 3-3 2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 3 3 0 0 0 3 3zM6 2a2 2 0 1 1 4 0 1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z' fill-rule='evenodd'></path></svg> <div class='db-tooltip'>Click to copy</div> </div>");
      });
    }, 1000);
    $("body").on("click", ".db-copy", function () {
      var $tempElement = $("<textarea>");
      $("body").append($tempElement);
      $tempElement.val($(this).parent(".hljs").ignore(".db-copy").text()).select();
      document.execCommand("Copy");
      $tempElement.remove();
      $(this).find('.db-tooltip').text("Copied!");
      var id = $(this);
      setTimeout(function () {
        $(id).find('.db-tooltip').text("Click to copy");

      }, 3000);
    });
    
    
  }
  db.menuMobile();
  db.switchMode();
  db.copyButton();

})(jQuery);
document.addEventListener("DOMContentLoaded", (event) => {
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightBlock(block);
    // hljs.initLineNumbersOnLoad();
    setTimeout(function () {
      hljsln.initLineNumbersOnLoad();
    }, 1000);
     setTimeout(function () {
      $("code.language-r").each(function () {
        $(this).children('.ln-num').last().hide();
      });
       
      $("code.language-matlab").each(function () {
      $(this).children('.ln-num').last().hide();
      });
    }, 1100);
  });
});
