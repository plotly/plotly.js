# plotly.js Security Policy

The open source plotly.js library is provided "AS IS", with no security guarantees.  Please see our
[license](https://raw.githubusercontent.com/plotly/plotly.js/master/LICENSE) for more information.

In the 1.x releases of plotly.js, we attempt to protect against XSS attacks (and similar issues) resulting from
untrusted data being graphed by plotly.js.  However, XSS or other issues may still exist.

If you require a higher degree of assurance, please consider purchasing our
[Plotly On-Premise](https://plot.ly/product/enterprise/) product, or [contact the Plotly sales team](mailto:sales@plot.ly)
for more options.

## Reports

To report a security vulnerability, please email security@plot.ly with steps to reproduce the problem. Please allow up to
24 hours for an initial response.

## Bounties

In some cases, we offer monetary compensation (bounties) for reports of security vulnerabilities.  Please see the [Plotly Security Vulnerability Bounty Program](http://help.plot.ly/security/) page for more information.

## Release Process

plotly.js security fixes are normally released as "patch" releases on top of the current plotly.js version.  For example if the current plotly.js version is 1.14.0 and we fix a security issue, we will release 1.14.1 with the fix.  Security fixes may also be made as part of a major or minor plotly.js release, if the fix coincides with our normal release cycle.  For example if the current plotly.js version is 1.14.0, we may release version 1.15.0 with the fix.

Security fixes are also backported to older versions of plotly.js as required by paying Plotly On-Premise or Plotly Cloud customers.  These fixes are released as "patch" releases, and are made available to the community once affected customers have upgraded.  We also accept backports to older versions contributed by community members.

## Advisories

All plotly.js security advisories released after August 1, 2016 are available at the [Plotly Security Advisories](http://help.plot.ly/security-advisories/) page.
