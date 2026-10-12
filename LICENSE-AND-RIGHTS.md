# Source handover, licensing, dependencies and proposed rights clause

## Source supplied

The distributable ZIP contains the unminified/unobfuscated original HTML, CSS, JavaScript, Node.js runtime code, configuration example, batch/shell launchers, example logo asset, source tests and guides. There is **no remote developer account dependency**, licensing callback, tracking script, paid runtime library or mandatory external API.

The source in this delivery may be copied, stored, executed and modified by the recipient for purposes of evaluating and operating the delivered project. No subscription/license fee is imposed by this software's authoring package. The recipient may transfer or deploy the files to its own private computer/server.

## Proposed contractual clause for a signed client agreement

> Upon receipt of the full agreed fixed fee (maximum 200 € for the defined scope), the developer shall deliver all native readable project/source/configuration/asset/documentation files and assign or grant to the client, to the extent permitted by applicable law and only insofar as the developer possesses such rights, the exclusive transferable economic exploitation rights in the **specifically commissioned original custom code**. The client may use, reproduce, modify, adapt, redevelop, maintain, deploy and engage any third party for further development without permission from, ongoing fees to, or accounts controlled by the developer. Any moral rights, statutory restrictions, or other nonassignable rights shall be handled according to the governing law. Existing third-party runtimes, frameworks, libraries, trademarks, third-party content and separately owned components are expressly excluded from any exclusivity claim. No additional licenses or charges are implied without written agreement.

**Important:** This is a **draft contractual formulation**, not a signed transfer certificate, proof of payment, legal opinion, or guarantee of copyright exclusivity in AI-assisted output. For a binding exclusive assignment, the contracting parties must complete and sign a rights agreement according to the applicable jurisdiction and accurately identify what the developer owns and can assign.

## Third-party software and asset inventory

| Item | Bundled? | License/ownership | Cost to core app |
| --- | --- | --- | --- |
| Node.js executable | No | Node.js Open Source project; runtime license at nodejs.org/LICENSE | Free to install |
| Node.js built-in `http`, `fs`, `crypto`, `os`, etc. | Runtime only | Node.js project's license terms | No extra license |
| Web platform APIs: DOM, HTML, CSS, WebAudio, SSE | Browser-provided | Implemented by the browser | No extra license |
| OBS Studio | No | Open-source GPL license, under OBS project's terms | Free |
| Streamlabs Desktop | No | Separate application/provider terms apply | Not required |
| Zoom Desktop | No | Zoom provider/service terms apply | Not required except Zoom delivery |
| `public/sample-logo.png` | Yes | Project-created generic illustration and text | No runtime royalty |
| System fonts (Segoe UI, Arial, Impact, etc.) | Not distributed | OS/platform-provided fonts; existing font licensing applies | No bundled license |
| npm runtime dependencies | None | `package.json` dependencies is `{}` | 0 € |
| Optional Python Playwright in QA | Not bundled | Separately install/test; Playwright project license applies | No runtime role |

No font binary files are included. The user is responsible for rights to any logos, names, screenshots, music, sponsor material or other media **uploaded later**.

## Scope exclusions

The package does not promise copyright transfer in underlying web standards, Node.js, OBS, Zoom, generic ideas, preexisting third-party source, user-supplied logos, or trademarks (including CrossFit). Internet hosting, public authentication, professional audio routing and SaaS accounts are not part of the local-only core deliverable. See `docs/SCOPE-AND-BUDGET-DE.md` for itemized inclusions and limitations.
