# Copyright, GPLv3 and source-handover reconciliation

**Not legal advice or a signed rights transfer.** This repository already contains a GNU GPL version 3 `LICENSE`. A previously distributed GPL-covered copy remains subject to its original grants; changing a README, removing a file or selling exclusive rights cannot retrospectively revoke those grants. The presence of `LICENSE` alone does not prove ownership/provenance of each file. Verify the authorship of all original and imported material before a customer contract promises exclusivity.

## Inventory and legal boundaries

| Material | Observed license/status | Transfer implication |
|---|---|---|
| Existing project code and prior repository distributions | Top-level GNU GPLv3 license present in current GitHub repository | Clarify which code is GPL-covered; previous grants may remain irrevocable |
| New arena layouts, backup module, server QA tests, docs | Custom project additions | Ownership must be confirmed in writing before an exclusive assignment; no blanket claim for underlying ideas |
| @netlify/blobs 11.1.4 | MIT license | Third-party code remains MIT; do not promise exclusive rights |
| netlify-cli 27.12.0 (build-time only) | MIT license | Not assigned, cannot claim exclusivity |
| Node.js and built-in APIs | Node.js open-source licensing | Runtime is not assigned |
| OBS Studio | GPL and related applicable licenses | Standalone external tool; no relicensing/assignment |
| Zoom, Streamlabs, system fonts, user logo | Vendor/asset-specific | User maintains the needed rights; assets not implicitly assigned |
| Contest screenshots | Third-party reference only | Do not copy third-party contestant artwork or source; the Arena UI is newly coded |

The developer can grant only rights they actually hold. If the client requires **exclusive custom-code rights**, obtain a detailed origin and license audit, consent from relevant owners, and a governing-law-compliant signed assignment. An assignment of remaining custom rights can coexist with older GPL grants but **does not make historic GPL copies exclusive**. A separately developed clean-room alternative may be needed if prior licensing makes the client's desired exclusivity incompatible.

## Delivery checklist

- [x] Readable HTML, CSS, JavaScript, configuration and documentation delivered in Git repository and source archive
- [x] No proprietary connector required for local Node operation; Netlify hosting is optional and owned by the deployment account
- [x] Third-party direct dependencies and licenses listed above; verify transitive licenses and produce SBOM before a commercial handover
- [ ] Identify copyright owner and GPL coverage of each historical commit
- [ ] Confirm which specifically commissioned modules can be exclusively assigned
- [ ] Agree governing jurisdiction, payment and exact rights language
- [ ] Both parties execute the separate rights and delivery agreement

See `RIGHTS-HANDOVER-TEMPLATE-DE-EN.md`. Do **not** check the open legal items based on a CI job.
