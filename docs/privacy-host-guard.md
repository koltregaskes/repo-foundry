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

Guard parity follows the Ghost PR 48 portable specification. HTMLParser is
not an HTML5 tree builder: after an svg/math start tag, raw-text/RCDATA tags,
HTML integration points, noscript and template are rejected until the end of
that input, even after closing the foreign root. CDATA is rejected everywhere,
including incomplete markers. Namespace local names are compared conservatively
for SVG XML aliases. This deliberately rejects harmless foreign titles and
some scripts/styles after SVG; ordinary SVG shapes/images and previews remain
supported. SMIL set/animation targeting href (any case or namespace prefix)
is rejected rather than interpreting to/from/by/values or animation targets.

Loaded HTML, SVG, CSS, JavaScript and JSON data resources are decoded recursively.
MIME whitespace/case is normalised, including text/css ;charset=utf-8, and all
16 WHATWG JavaScript MIME aliases are recognised. Unsupported potentially
active types fail closed, including XML/XHTML not modelled by this parser.
Only an explicit inert raster/font MIME list can remain opaque. Percent/base64
decoding is strict; invalid textual bytes, NUL, unsupported charset/XML/CSS
encoding declarations, the 16 MiB byte limit and shared depth limit of 32 fail
explicitly. Script elements reject every data URL in src/href/xlink:href or
namespace-equivalent attributes, regardless of MIME or namespace, including
inside srcdoc. Classic scripts can execute data bytes irrespective of MIME.
The complete serialized data URL is decoded excluding its fragment. Query
bytes remain payload: data:text/javascript,1?fetch('https://github.com/pixel'):0
must report github.com as a resource when imported by an ordinary module.

Decoded-data backstop provenance survives recursion and normalisation. Such
hosts cannot use mention exceptions, even when a data body appears outside a
recognised loading attribute, including padded MIME headers and quoted
UTF-8/ASCII charsets. CSS/JS data backstop hosts conservatively need
resource permission; HTML/SVG namespace/metadata hosts retain their distinction
from actual loads. Existing JSON-LD link keys and import-map resource handling
remain in place. Direct static/dynamic JS imports retain resource roles; RF
already conservatively classifies all JS URL literals as resources.

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
