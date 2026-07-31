# Privacy Policy — Visual Style Editor

**Effective date:** July 31, 2026

Visual Style Editor is designed to work locally in the user’s Chrome browser.

## Data collection

Visual Style Editor does not collect, sell, transmit, or share browsing history, page content, personal information, analytics, advertising identifiers, passwords, payment-card information, or form values.

## Local data

The extension stores the following data in Chrome’s local extension storage:

- CSS selectors and declarations created by the user.
- The hostname and source URL associated with a saved design.
- Responsive breakpoint choices.
- Design enabled/disabled state and timestamps.
- Editor preferences such as language, theme, dock position, width, and UI scale.
- Recently used Google Font family names and the selected font variants required by saved designs.

This information stays in the Chrome profile unless the user explicitly exports a CSS or JSON file. The user can remove saved designs from the extension settings or reset the current domain.

## Website access

The extension requests access only to a website origin after the user activates the editor for that origin. Access is used to inject the visual inspector and the CSS created by the user. It is not used to collect browsing activity.

The inspector intentionally excludes password inputs and recognized payment-card fields.

## External services

The bundled Google Fonts catalog is searched locally. When the user previews or applies a Google Font, the browser requests only that selected family and variant from `fonts.googleapis.com` and `fonts.gstatic.com`. Runtime stylesheet links use a `no-referrer` policy, and page content, selectors, form values, and browsing history are not added to those requests. As with any network request, the service can receive standard connection metadata such as an IP address and browser user agent. Exported CSS can also contain the selected family’s public Google Fonts CSS URL.

A future optional Unsplash image search may contact the Unsplash API only after the user opens that feature and performs a search. Its use will be disclosed in the interface and configured separately.

## Security

Imported projects are validated before use. The extension does not execute imported JavaScript, does not use `eval`, and rejects unsafe CSS values intended to break out of a style rule.

## Data deletion

Users can delete a domain design from the settings page, reset the current domain from the popup, revoke website permission in Chrome, or uninstall the extension. Uninstalling removes extension-local data according to Chrome’s normal behavior.

## Changes

Material changes to this policy will be reflected by a new effective date and included in the extension listing or release notes.

## Contact

Replace this line before publication with the publisher’s support email and website.
