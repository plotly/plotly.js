// Init the search box
$(function(config) {
  'use strict';

  var searchInput = document.getElementById("search-input");
  var primarySearchResults = document.getElementById('primary-search-results');
  var schemaSearchResults = document.getElementById('schema-search-results');
  var modalBody = document.getElementById('modal-body');
  var lang = window.plotly_doc_language;
  if (lang == "plotly_js"){
    lang = "javascript"
  }

  var emptyResult = '<div class="text-center"><br><br>No results found matching <strong>{{query}}</strong>.<br><br> Click here to <a class="algolia__result-link" target="_blank" href="https://www.google.com/search?q=plotly+' + lang + '+{{query}}">search for "plotly ' + lang + ' {{query}}" on Google</a>.</div>';

  var searches = [];

  for (let i = 0; i < 2; i++){

    searches[i] = instantsearch({
      appId: config.applicationId,
      apiKey: config.apiKey,
      indexName: i == 0 ? config.indexName : "schema",
      urlSync: false,
      searchFunction: function (helper) {
        if (helper.state.query === '') {
          primarySearchResults.innerHTML = '';
          return;
        }
        helper.search();
      }
    });

    searches[i].addWidget(
      instantsearch.widgets.searchBox({
        container: "#search-input",
        magnifier: false,
        reset: false,
        queryHook: function(query, search) {
          if (query === "") {
            search();
          } else {
            search(query);
          }
        }
      })
    );

    searches[i].addWidget(
      instantsearch.widgets.hits({
        container: i == 0 ? '#primary-search-results' : '#schema-search-results',
        templates: {
          empty: emptyResult,
          item: document.getElementById(i == 0 ? 'algolia__template' : 'algolia__secondary-template').innerHTML,
        },
        transformData: {
          item: function(hit) {
            if (hit.permalink.includes("reference")){
              hit.permalink = lang + '/' + hit.permalink;
            }
            hit.raw = JSON.stringify(hit, null, 2);
            return hit;
          }
        }
      })
    );

    searches[i].start();
  }
 
  searchInput.addEventListener("keyup", function (event){
    if (searchInput.value == "" && !navigator.userAgent.match(/Trident.*rv:11\./)){
      modalBody.style.display = "none";

    } else {
      modalBody.style.display = "block";
    }
  });

  $('#myModal').on('shown.bs.modal', function () {
    searchInput.focus();
  });

}(window.ALGOLIA_CONFIG));