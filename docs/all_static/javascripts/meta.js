!function(){
  var meta = new Keen({
    projectId: "5368fa5436bf5a5623000000",
    writeKey: "725f3a571824d9c29f6e4d1c39af349a114d9034f8e493f95d39802529e2ccbb174033077bdcf10b541dbb50c20105922c59bbe1fe7741cb4b632dd0bc84fe98c0b591e17da3d429ef867cc674be0ad20ad768a5210662d2d18ff5492f37a1f91ce697a5489064bb3fa95c827b6cb394"
  });
  meta.addEvent("visits", {
    page: {
      title: document.title,
      host: document.location.host,
      href: document.location.href,
      path: document.location.pathname,
      protocol: document.location.protocol.replace(/:/g, ""),
      query: document.location.search
    },
    visitor: {
      referrer: document.referrer,
      ip_address: "${keen.ip}",
      // tech: {} //^ created by ip_to_geo add-on
      user_agent: "${keen.user_agent}"
      // visitor: {} //^ created by ua_parser add-on
    },
    keen: {
      timestamp: new Date().toISOString(),
      addons: [
        { name:"keen:ip_to_geo", input: { ip:"visitor.ip_address" }, output:"visitor.geo" },
        { name:"keen:ua_parser", input: { ua_string:"visitor.user_agent" }, output:"visitor.tech" }
      ]
    }
  });
  // More data modeling examples here:
  // https://github.com/keenlabs/data-modeling-guide/
}();
