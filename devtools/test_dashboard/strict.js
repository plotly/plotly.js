if ((new URLSearchParams(location.search)).get("strict")) {
  const strictDiv = document.createElement("div");
  strictDiv.id = "strict-div";
  strictDiv.textContent = "STRICT MODE";
  document.querySelector("#reload-time").insertAdjacentElement('afterend', strictDiv);
  document.querySelector("title").innerText = "Plotly.js 'strict' Devtools";
}
