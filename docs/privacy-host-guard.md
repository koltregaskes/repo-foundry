# Privacy host guard

The guard is adapted from KT Photography's hardened privacy design at
cf0cabbfe2e4bc0ab1e1b5dc4679ec26d75b93df. It runs at the end of the public
build and is also available through `npm run verify:privacy-hosts`.

Threat model: accidental or concealed literal external references in the
generated HTML, SVG, JSON, JavaScript and CSS, including encoded authorities,
userinfo, control characters, srcset, refresh destinations, nested srcdoc,
data URL documents, image-set and template expressions. Complete references
are extracted before WHATWG URL parsing. The independent backstop uses
`(?<![A-Za-z0-9+.-])`, retaining normalisation views so decoding cannot erase
an earlier reference. Python's HTML5 entity table handles attribute decoding.
Helper output is strictly validated; malformed input, unsupported refresh
syntax, excessive nesting, invalid data documents and parser failure fail closed.
No network requests or JavaScript evaluation are used by the guard.

Resource and navigation permissions are separate. In particular, img, SVG
image href, link icon/preload/modulepreload/manifest, ping, JavaScript literals
and CSS loads require a resource host, even if the same host is permitted
for navigation. Resource checks run before mention exceptions. Nested
documents retain their resource classification. JSON-LD and page data use
explicit known link keys; image and other resource keys remain resources.

The optional `privacy-non-request-mentions.json` has exactly
`{"version":1,"mentions":[{"kind":"non-request mention","file":"page.html","host":"example.org","reason":"why this is not a request"}]}`.
Each entry is exact to one file and host. It can exempt only a backstop
mention with no active reference in that file. Invalid, duplicate, unused
or active entries fail. No mention exceptions are currently shipped.

This is a build disclosure guard, not a JavaScript interpreter or a network
firewall. Arbitrary computed URLs assembled without literal URL evidence,
runtime user input, remote stylesheet responses, provider logs and previously
installed workers on the shared origin need separate source or live review.
Templates and code remain trusted, reviewed build inputs. The fixed disclosure
list is never expanded automatically from new output. The Google font-file
host is declared explicitly because its requests are selected by Google's
remote stylesheet. This offline guard cannot establish provider retention,
legal acceptance, live account configuration or deployment parity.
