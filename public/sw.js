if (!self.define) {
  let e,
    s = {};
  const c = (c, a) => (
    (c = new URL(c + ".js", a).href),
    s[c] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = c), (e.onload = s), document.head.appendChild(e);
        } else (e = c), importScripts(c), s();
      }).then(() => {
        let e = s[c];
        if (!e) throw new Error(`Module ${c} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, t) => {
    const d =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[d]) return;
    let i = {};
    const n = (e) => c(e, d),
      o = { module: { uri: d }, exports: i, require: n };
    s[d] = Promise.all(a.map((e) => o[e] || n(e))).then((e) => (t(...e), i));
  };
}
define(["./workbox-00a24876"], function (e) {
  "use strict";
  importScripts("fallback-dO-oyQEtLdsf-yRpA8y0Y.js"),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "20127760bc5598f76e5cd7ac52bf971c",
        },
        {
          url: "/_next/static/chunks/4240.9f23772c8c4a08d9.js",
          revision: "9f23772c8c4a08d9",
        },
        {
          url: "/_next/static/chunks/6304.5fd5df2b861ee944.js",
          revision: "5fd5df2b861ee944",
        },
        {
          url: "/_next/static/chunks/7710.3ec1d139f95af6a6.js",
          revision: "3ec1d139f95af6a6",
        },
        {
          url: "/_next/static/chunks/app/about/layout-b51a2e83b9811085.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/about/page-75e390e04f0e5f9f.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/animation-demo/page-462b2fdf782f890b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/auth/success/page-3da2a317feb0932c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/brand/%5Bid%5D/page-c92313bc0feadcf4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/collection/%5Bid%5D/page-3bd62b5c8a328b5e.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/collections/page-258699438a424639.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/contact/page-f6bf9d16777fb62b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/designer/%5Bid%5D/page-fe4522ef458caa79.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/directory/page-c7776e5f304cf089.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/faq/page-d2da3e9d5bd1aa06.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/favourites/favourites/page-c47c785e2c648240.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/favourites/page-8e30e6e9bebcdd76.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/forgot-password/page-981cd94e3fb9890f.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/how-it-works/page-a9e0936b914774bf.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/join/page-5a6dc6cfd935344f.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/layout-590aa8fb5021e137.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/login/page-e1c3bb040e6bac12.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/not-found-89a71de9ac19f24c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/offline/page-f78885f3019d5492.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/page-bde32b0efd2018d1.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/password-gate/page-3b8962e885b5064d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/privacy-policy/page-6d92a9d7bae341e4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/product/%5Bid%5D/page-5617fff3d8c23e43.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/profile/page-c55bc122148bbf80.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/reset-password/page-cef8efb31667bbbc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/signup/page-94f060c77b556079.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/brands/%5Bid%5D/not-found-5d124096fb55d669.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/brands/%5Bid%5D/page-1d53804be66419df.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/brands/create/page-18c1188ec6d14bc6.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/brands/page-d996296b2662b785.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/collections/%5Bid%5D/edit/not-found-0b4071921cb3631b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/collections/%5Bid%5D/edit/page-6ee546ba4c344b68.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/collections/create/page-038c1ef8be80067d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/collections/page-42c498752d6239ba.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/hero/%5Bid%5D/page-af6a2e7439a8d3b2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/hero/create/page-6f2636fccf8e242a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/hero/page-6a5b1b5bf734cd86.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/inbox/page-e9f024df45e03403.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/layout-08b9d8949bc8a0b6.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/leads/page-b6e3387955a9588c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/page-8376c4c148f0df37.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/portfolio/create/page-cdc4b854644bda14.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/portfolio/page-1e09fe8cdb209eaa.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/products/%5Bid%5D/edit/page-e7f0ce8a283afe6e.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/products/create/page-d156d6d8aff9da85.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/products/page-846e4598a4310abb.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/profile/page-464405b51050b101.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/reviews/page-3cd9a3f9ad6494e1.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/services/%5Bid%5D/edit/page-bc588c2bd7bd336a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/services/create/page-0ff88f30ae8b751e.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/services/page-ed3891bec68d8700.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/settings/faqs/page-924e21a14dc37537.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/settings/legal-documents/page-310d5ba5ca283708.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/settings/page-0ed043cfea3eb05a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/spotlight/%5Bid%5D/page-5a1c1f48eab5b675.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/spotlight/create/page-b9e69b6f2b94104b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/spotlight/debug/page-7f46be60749a6697.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/spotlight/page-4e6070df45cfe09a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/tags-demo/page-b2795d1da67102c4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/studio/users/page-d5d96648b36e6711.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/tailor/%5Bid%5D/page-bdbbc0bfd20adda4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/tailored/page-cdc7f5bdf4b93acf.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/tailors/page-30847ff5b29aba74.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/app/terms-of-service/page-a168cfb2a1e8c389.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/charts-08fd062d.95bf076bf34641c3.js",
          revision: "95bf076bf34641c3",
        },
        {
          url: "/_next/static/chunks/charts-163c1d1c.c4d8bd37f9416b7c.js",
          revision: "c4d8bd37f9416b7c",
        },
        {
          url: "/_next/static/chunks/charts-202e516d.7d12955d6c0d5ed3.js",
          revision: "7d12955d6c0d5ed3",
        },
        {
          url: "/_next/static/chunks/charts-20439902.062c262cba0e3c5b.js",
          revision: "062c262cba0e3c5b",
        },
        {
          url: "/_next/static/chunks/charts-2f8e3928.1fb530792eab5a4c.js",
          revision: "1fb530792eab5a4c",
        },
        {
          url: "/_next/static/chunks/charts-6bdbb5f0.d07328d56841361e.js",
          revision: "d07328d56841361e",
        },
        {
          url: "/_next/static/chunks/charts-7dc1e5cd.1c87c2b470adae49.js",
          revision: "1c87c2b470adae49",
        },
        {
          url: "/_next/static/chunks/charts-94ef3c84.b9f56bbd38d962f6.js",
          revision: "b9f56bbd38d962f6",
        },
        {
          url: "/_next/static/chunks/charts-95b14c1b.bbc1be9f03660413.js",
          revision: "bbc1be9f03660413",
        },
        {
          url: "/_next/static/chunks/charts-ad4f17a2.b8e797238b8d2bd6.js",
          revision: "b8e797238b8d2bd6",
        },
        {
          url: "/_next/static/chunks/charts-b91c4ce3.913ebf5130fe4a7e.js",
          revision: "913ebf5130fe4a7e",
        },
        {
          url: "/_next/static/chunks/charts-bcb5ea3a.286a4e3b715d383a.js",
          revision: "286a4e3b715d383a",
        },
        {
          url: "/_next/static/chunks/charts-c2f7a945.14462d867bedc2fb.js",
          revision: "14462d867bedc2fb",
        },
        {
          url: "/_next/static/chunks/charts-c97a8dd8.162442baa2b70d1f.js",
          revision: "162442baa2b70d1f",
        },
        {
          url: "/_next/static/chunks/charts-d598b979.ee2fd3778a4100c7.js",
          revision: "ee2fd3778a4100c7",
        },
        {
          url: "/_next/static/chunks/charts-eef39813.956c7adcb3367353.js",
          revision: "956c7adcb3367353",
        },
        {
          url: "/_next/static/chunks/charts-f3f33cb4.a400e274e27effee.js",
          revision: "a400e274e27effee",
        },
        {
          url: "/_next/static/chunks/charts-f8c876e4.2705a691fdc16efe.js",
          revision: "2705a691fdc16efe",
        },
        {
          url: "/_next/static/chunks/common-05377907-b92faa87e8aece43.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-12792247-812063768bd702eb.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-1287fb2d-417a0e3655a0099d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-1a434f45-defd1793e3665296.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-1dc6d572-cca6fb4421489958.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-1f389510-7e2b9632e39cb312.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-2d6f1fce-94ebefb7f2e424ae.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-2d721a96-190c90d73d429ee7.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-31dba3be-c958cf3b91e00d2d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-40bb67c1-85ca3b146a16e40a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-46f3b832-6a015aea75c1b59f.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-478f13d8-cc9f2cc9f22d4ab6.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-4a3f317c-955dfaa929b10e94.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-61cda47a-3a51b233a29cd8ed.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-b7453e08-27067b5a2f7843fc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-be7d1d88-0539cf3ad437683d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-cd83cdca-33c7e6d288229b9d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-e0f145fd-b43510176345b27b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-f305c6b9-223d831656bcfd00.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/common-f72b9a2c-8eebf5493082f1d8.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-1daae666-0575203e1863dd85.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-2e72d244-eae7f8f8c7f5b58a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-4c6b37ae-858cca87fa2dc3bd.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-518ca55f-e13e22f9496d80ad.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-7ec938a2-8fbf73ee698188fc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-a10800a4-e29d7a2693aa6df7.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-ae080475-00384c69fde57078.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/framer-motion-dfc0d3ba-9c39d6e4aa54c81a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-01b3defb-e105c157a8b24cc3.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-25c32afd-ec0b4ce7ff13eaa2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-2aaa0532-5b6386ab6b446c5a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-2ab36678-1c04feac2cce643d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-4aa96b5c-7066c9014652ec77.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-63043dca-c2c3fb0ba8c60a4c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-6879598d-61aa72d40b920ded.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-82e27e53-ad247aa2d04b989e.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-8b9b2362-e45b441cff3b47a2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-8ba570f0-53fe634b888bd8db.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-914498d2-8cf00f1513c5b26e.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-966e6d57-5e3c0f51e08f6e4a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-96c215dc-30e95d5e589fcb69.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-abda2f14-21ea4647ff915fbe.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-bd076b32-04fd55b986d32ec1.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-caaede9c-ffae2cd4510f3928.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-d05fc8d1-15f1d2ca2e029412.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/large-packages-fdcf1366-c5922d5101e0c84c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-091c4608-162e684fa7f79e90.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-25263c99-89b56a5e6761690c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-2fa08c5b-32a0ae182faaef01.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-33232fd2-e335a99d5acd3273.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-39d2ad2a-173eba7df676edf2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-3adc3316-a4251a6f5a8cb021.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-3bc885c6-156eeba03ea4cd66.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-4960d216-34e847bf36db885d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-516842ce-28c654605d6de5c5.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-604f0ce3-d474fcf4cee25e94.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-65313677-f023efb02f4ed67d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-6560ccd6-0b6a0e72be897008.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-6ae7ede4-1caa3f3eef9804b2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-8085acfe-a89e9cae10698906.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-86de3880-73a120f9596efac1.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-89e2f893-c140c0edbe4cd4cc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-8c963552-003f8317c13179bc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-96043337-854bc7aeb0b27b52.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-964081ab-051862555b299fa2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-9e792328-d8431d410e9712d5.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-9f9c73c0-71a7e6ccf0b94cb1.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-a36bcda6-a5dc4661cf532374.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-a3f1008c-736b89e1053bcfb7.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-a49bac1f-99e8fe6e4b790917.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-a919e975-98e8dfb4df87fcfc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-b17bd27d-5632d0b030f947be.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-b1fff649-a1c19d1b1350a981.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-ba83b90e-d18f42d665665b68.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-c4a5776d-5b5f3a895c72e912.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-ccd9d928-23abcc29b3b00f4a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-ebfdb3fb-f91c6d901c86e856.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/lucide-icons-fedbac13-c6049141425cb70e.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/main-app-db9d7b5b814c53fe.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/main-ba44bd6d1384d49c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-15f16aba-7301794144d7f254.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-2248f4c3-34051d25bb621cdd.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-2ac4632b-e6f3332dc8ddb89f.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-3d3a1b23-3c33fe660ecd3ec1.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-42bbf998-f3658ae6f7b69efb.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-4497f2ad-d78c43992a93cedc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-45adea4d-33b3fe5d27ba52c4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-4aa88247-931eedfaeaf7921c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-4e8e7ca0-cd9aa7040639c94f.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-5265a0af-b45d60d3b4698d16.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-598664bd-bed175bee6d8cfa5.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-62c09e19-b4aa3fb8fc402ff7.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-6b1f2c03-61be6ce3889f39c8.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-74690118-af02c53eefe5aec3.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-74752c39-1df0e4e84f52e13c.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-7de78548-efda3dee8a021b84.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-82831f5c-eb22c54871f9758b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-9a66d3c2-4a96ced903c571b3.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-9c587c8a-345dc1e06295901b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-a73e2f95-c1e6360887879601.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-c10ef05f-ba29f5a0c840a795.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/next-vendor-fc2d4738-99cdf98d5bc601a2.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/pages/_app-cf67dcf18f9aa633.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/pages/_error-ce9801028f057e9d.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",
          revision: "837c0df77fd5009c9e46d446188ecfd0",
        },
        {
          url: "/_next/static/chunks/react-vendor-1c437e24026d27bc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/runtime-9704290a7f17bf4b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-0d08456b-929127caa2b0f8dc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-3dcaadb3-df8fd4a53c960901.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-431b97bb-63687bf5a5d41a5a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-8db31629-d197858eec7e6bbc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-a7fc1f72-9d5ff9c0971f66c4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-ab106095-8a0da5c56f216819.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-c29d2891-4efc45d7aa86a0ad.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/supabase-cc01fe6b-a145567c38e72a05.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/utils-0d4dc254.86e274f86e92031b.js",
          revision: "86e274f86e92031b",
        },
        {
          url: "/_next/static/chunks/utils-2285aa12.28b81cd5ace0b936.js",
          revision: "28b81cd5ace0b936",
        },
        {
          url: "/_next/static/chunks/utils-532e75a1.598bb0ce17d98764.js",
          revision: "598bb0ce17d98764",
        },
        {
          url: "/_next/static/chunks/utils-687d5bd9.2a0332b9cd81cba6.js",
          revision: "2a0332b9cd81cba6",
        },
        {
          url: "/_next/static/chunks/utils-7829f87a.c2f33abc43eb1150.js",
          revision: "c2f33abc43eb1150",
        },
        {
          url: "/_next/static/chunks/utils-7a5d1693.e4ebfcaa57f84260.js",
          revision: "e4ebfcaa57f84260",
        },
        {
          url: "/_next/static/chunks/utils-854fa707.b9aa268b70c81958.js",
          revision: "b9aa268b70c81958",
        },
        {
          url: "/_next/static/chunks/utils-b2806f16.0bdad8539c2f4291.js",
          revision: "0bdad8539c2f4291",
        },
        {
          url: "/_next/static/chunks/utils-babdeffe.7b100ab608c47dad.js",
          revision: "7b100ab608c47dad",
        },
        {
          url: "/_next/static/chunks/utils-fc41781b.706591285a83b893.js",
          revision: "706591285a83b893",
        },
        {
          url: "/_next/static/chunks/vendors-00833fa6-6b586b8c07216c11.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-09438033-1ae4e8e74b025177.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-238a3b35-631fd12cdbdab743.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-377fed06-6489b6dcdf456b37.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-3c9b6905-ee37479a03747d05.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-84a2dd45-ad2ed54d3e65593a.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-88153be5-839d61a6402a2ac5.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-8cbd2506-ecb1a92f6a97cfc4.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-904c28d2-af705b0736a987b9.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-a0de3438-68e2fd12da6dbfeb.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-a3b83636-aba4764b218dcab7.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-abbc7793-6369b5ac9c0b78cc.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-b49fab05-845d6a23acbc55c8.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-bf6e8d65-c7882ceacdea6935.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-c0d76f48-44152990a666285b.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-c5c6856a-37860f0215c1d299.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-c8689bc3-2174fba6def95661.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-dbef7665-3e89aec858e25fdb.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-eb2fbf4c-399ca6513fc1cea5.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-fa3b980b-4347b19fb300b919.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/chunks/vendors-fa70753b-6171eef77bedf6d8.js",
          revision: "dO-oyQEtLdsf-yRpA8y0Y",
        },
        {
          url: "/_next/static/css/051a1cf2ee47bcd2.css",
          revision: "051a1cf2ee47bcd2",
        },
        {
          url: "/_next/static/css/4058cc5838625185.css",
          revision: "4058cc5838625185",
        },
        {
          url: "/_next/static/css/b7efc80fdd9b9d6b.css",
          revision: "b7efc80fdd9b9d6b",
        },
        {
          url: "/_next/static/css/d1ff6614b8687149.css",
          revision: "d1ff6614b8687149",
        },
        {
          url: "/_next/static/dO-oyQEtLdsf-yRpA8y0Y/_buildManifest.js",
          revision: "f189854457602d9cb1ad021f4d94a940",
        },
        {
          url: "/_next/static/dO-oyQEtLdsf-yRpA8y0Y/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/media/5d1e0bde8da55f41-s.p.otf",
          revision: "edeef840a04313998a35e2d570ce1b18",
        },
        {
          url: "/_next/static/media/9a5816853ef5b8f7-s.p.ttf",
          revision: "eb270b13b84d5a43462737e3fb0a268d",
        },
        {
          url: "/brand/omahub-logo.png",
          revision: "bdfd3eb229d6d6cee89034780261d84b",
        },
        { url: "/bridal.jpg", revision: "616331fa140ce04fd72a7210dc57d4fd" },
        {
          url: "/clear-session.html",
          revision: "ae2a0fb07e8cac9d7e6e558e881ab07b",
        },
        { url: "/community.jpg", revision: "99b7442af7fdbba15b6e3f91500c4d99" },
        { url: "/favicon.ico", revision: "787bd87572da1e4a538f327e8dcf1a0b" },
        { url: "/favicon.png", revision: "f854cb320b7b123c7304db5bd23ab1c0" },
        { url: "/file.svg", revision: "d09f95206c3fa0bb9bd9fefabfd0ea71" },
        {
          url: "/fonts/Canela-Regular-Trial.otf",
          revision: "edeef840a04313998a35e2d570ce1b18",
        },
        {
          url: "/fonts/SuisseIntl-SemiBold.ttf",
          revision: "653d9381828e9577fb1e417dc047f89d",
        },
        {
          url: "/fonts/suisse-intl-regular.ttf",
          revision: "eb270b13b84d5a43462737e3fb0a268d",
        },
        { url: "/globe.svg", revision: "2aaafa6a49b6563925fe440891e32717" },
        {
          url: "/lovable-uploads/020cb90b-2fee-4db4-a7ee-538515580ef2.png",
          revision: "8599212315f6a4a66201866a830767b9",
        },
        {
          url: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
          revision: "4973dd042e2aba908532ab90ad9fcb2d",
        },
        {
          url: "/lovable-uploads/06da949c-c4cd-44da-a58a-8ca60675ec6f.png",
          revision: "8d0c8ae88f54e53e394f2895a75fb51d",
        },
        {
          url: "/lovable-uploads/1afe2e3f-334c-4c45-8626-a7feeda1b726.png",
          revision: "76cfe7bfa344bc9cbb88b6309a7df00c",
        },
        {
          url: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
          revision: "57f4e695cb46435c6d652faa9bb588cc",
        },
        {
          url: "/lovable-uploads/39df6a45-ac17-439d-a75e-d5e290d3076a.png",
          revision: "150ff79899c14ba4cdffb36f39400fc8",
        },
        {
          url: "/lovable-uploads/41fa65eb-36f2-4987-8c7b-a267b4d0e938.png",
          revision: "fab3cb2d24571fabbe27347f896c619c",
        },
        {
          url: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
          revision: "2e9c87b82b6765f2e26073078f95738e",
        },
        {
          url: "/lovable-uploads/4f01c882-4b82-47ba-abfc-ce5e9b778ad1.png",
          revision: "abda3e550a8a5eddd240e380f015d68e",
        },
        {
          url: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
          revision: "323e935a7a538d9cdefd4e5b3c028d41",
        },
        {
          url: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
          revision: "8b7a196e85f39fd666de1f7ce50c71d7",
        },
        {
          url: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
          revision: "9eaebeb07f94e329c239cccb407f1e6b",
        },
        {
          url: "/lovable-uploads/5daa129b-ed11-4932-b7bd-aeb2b4e598f3.png",
          revision: "78d289fb5e4cc0c72fceeca43176a38b",
        },
        {
          url: "/lovable-uploads/67421e80-f8e4-4576-a738-f45b1a439c5e.png",
          revision: "7fd89a2b43cc7dd33101da88c3211fe5",
        },
        {
          url: "/lovable-uploads/6bb91631-9e7a-4200-be24-dd1b56cde590.png",
          revision: "59a6eeab934e8290b904863dca6dead9",
        },
        {
          url: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
          revision: "fcbeed2115b8408765c7b67ab77e135b",
        },
        {
          url: "/lovable-uploads/808be60f-e4ee-4c4c-9544-6f704576f710.png",
          revision: "0108c61b53ceada8037d2e6afed6bed5",
        },
        {
          url: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
          revision: "0b65b4cf265fe2dce4a06fba2020d2bf",
        },
        {
          url: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
          revision: "a7a491df40e2cbebc056c09eaeb75ff3",
        },
        {
          url: "/lovable-uploads/882a0fa9-6672-4dec-97a7-b2caaddb0fa0.png",
          revision: "4fd84f4c3dc2e19f753bccc17117be66",
        },
        {
          url: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
          revision: "5ce03b55bad89bbc1d19b63b944b26d6",
        },
        {
          url: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
          revision: "9ca3eeaaf0a0d5b6dd7d6708e67b2859",
        },
        {
          url: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
          revision: "762f5fa52b4200521f1461d54a54240b",
        },
        {
          url: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
          revision: "091b35830ab356e3966056b26a18053f",
        },
        {
          url: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
          revision: "93bb5f2b62756a23c0a5add894c4ef82",
        },
        {
          url: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
          revision: "b611d30e46cb071ccdeafd1164639451",
        },
        {
          url: "/lovable-uploads/dc25584e-502c-48aa-bcd9-42a356c77c1c.png",
          revision: "9260663a527b44aad59dbe1afbdfd512",
        },
        {
          url: "/lovable-uploads/de2841a8-58d1-4fd4-adfa-8c9aa09e9bb2.png",
          revision: "1e15729af061d5044bd34d8e9d3b4b8f",
        },
        {
          url: "/lovable-uploads/e0e57209-1802-453b-a78e-7c7090a85e58.png",
          revision: "0108c61b53ceada8037d2e6afed6bed5",
        },
        {
          url: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
          revision: "ac805a619629d2b80cce4b3d433a7cd8",
        },
        {
          url: "/lovable-uploads/ecd30635-4578-4835-8c10-63882603a3f1.png",
          revision: "d3dc63b0533c22ab34346c4ab47b08d5",
        },
        {
          url: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
          revision: "7fd89a2b43cc7dd33101da88c3211fe5",
        },
        {
          url: "/lovable-uploads/fd9289e6-2522-48c1-9fe4-42842504e746.png",
          revision: "c008ffa544178e0c6e92a92d53605ae7",
        },
        {
          url: "/lovable-uploads/omahub-logo.png",
          revision: "8e6f2701b0a1da53eb11b64aaede760f",
        },
        {
          url: "/lovable-uploads/tailored-image.jpg",
          revision: "053cbea967275e8601df60cd8d46deed",
        },
        { url: "/manifest.json", revision: "9433699555a106ea6776670c6b347505" },
        { url: "/meet-me.PNG", revision: "2af1a7193bb2c5fdd5422694e754aa75" },
        { url: "/next.svg", revision: "8e061864f388b47f33a1c3780831193e" },
        { url: "/offline", revision: "dO-oyQEtLdsf-yRpA8y0Y" },
        {
          url: "/omahub-perspective.PNG",
          revision: "f50d90e9075c9136d7c45f4a84a9af1d",
        },
        {
          url: "/placeholder-image.jpg",
          revision: "7215ee9c7d9dc229d2921a40e899ec5f",
        },
        {
          url: "/placeholder.svg",
          revision: "35707bd9960ba5281c72af927b79291f",
        },
        { url: "/robots.txt", revision: "17818cb834ea74e680e6228e5f8f61bf" },
        {
          url: "/tailored-image.webp",
          revision: "9ec6cf84a007b12581eb7c3a9959047e",
        },
        { url: "/vercel.svg", revision: "c0af2f507b369b085b35ef4bbe3bcf1e" },
        { url: "/window.svg", revision: "a2760511c65806022ad20adf74370ff3" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: c,
              state: a,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "gstatic-fonts-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js|css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 2592e3 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 300 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /.*/i,
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          { handlerDidError: async ({ request: e }) => self.fallback(e) },
        ],
      }),
      "GET"
    );
});
