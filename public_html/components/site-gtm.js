/* =====================================================================
   Talennexus — Google Tag Manager component
   ---------------------------------------------------------------------
   Usage (as high in <head> as possible, on every page):
     <script src="components/site-gtm.js"></script>     (root pages)
     <script src="../components/site-gtm.js"></script>  (sub-folder pages)

   To change the container, edit GTM_ID below — every page updates.
   ===================================================================== */
(function (w, d) {
  'use strict';

  var GTM_ID = 'GTM-KPCSTLWV';

  // Load only once, even if the script is included twice
  if (w.__siteGtmLoaded) return;
  w.__siteGtmLoaded = true;

  // dataLayer + gtag() helper (as in the original snippet)
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date());

  // Required by GTM: starts the container and fires "All Pages" / Page View triggers
  w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  // Load the GTM container script asynchronously
  var s = d.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
  var first = d.getElementsByTagName('script')[0];
  if (first && first.parentNode) first.parentNode.insertBefore(s, first);
  else (d.head || d.documentElement).appendChild(s);
})(window, document);
