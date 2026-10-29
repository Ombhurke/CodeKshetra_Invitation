# Project context

Latest decision: Aurora Night is the sole selected design. Home page opens its ribbon screen directly. Guest selection and guest/event editing belong on that opening screen; the opened invitation hides the header editor. The provided 17 names are seeded into the dropdown with manual additions supported. Main and secondary text brightness was increased slightly. This supersedes earlier requirements to preserve all three themes.

Owner: Om Bhurke. Event: CODEKSHETRA. This is a digital invitation and grand guest welcome for college management.

The senior's brief: a first screen with a ribbon and OPEN; opening reveals personalized invitation content; a white signature board below allows management to sign; a management-name dropdown selects the invitee and personalizes the invitation.

Twelve concepts were generated. User selected 12 Monochrome Sculptural (black/ivory), 09 Aurora Night (dark violet/teal), and 06 Pearl Glass (pearl/icy blue). They requested all three as working pages, smooth animations and scroll reveals, and a ribbon that cuts or splits before opening the next view.

Implemented: one collection and three independently linked pages with a shared dependency-free HTML/CSS/JS interaction layer. CSS/SVG ribbon halves animate away; card doors unfold; the invitation view opens. Signature board stays below the invitation. Static frontend is intentionally portable, with no account setup or external runtime dependencies. Earlier React/Motion/Supabase discussion was a recommendation, not an already installed stack or an instruction to use it.

Current functionality: guest dropdown and add/edit fields, event configuration, separate saved signatures per guest, pointer drawing and typed signature, undo/clear, save/error states, PNG exports, responsive designs, reduced motion, and replay. Settings/signatures are browser-local; a cloud backend has NOT been connected. Do not describe them as synchronized or server-saved.

Missing real inputs: approved invitation wording, management names/designations, event date/time/venue, and official logo. Keep placeholders until supplied. Never reuse the phone number from the original forwarded message as website content.

Latest steering: user is now on their device and wants focus on development, not more handoff guidance. Do not repeat device setup explanations. Continue the actual implementation or revisions from these source files.

Preserve the three themes and the explicit ribbon-splitting opening. Do not regenerate the concept images unless asked. Do not add email, tracking, or public signature sharing without a request.

October 29 update: all three themes now use a compact single invitation sheet, a lower-right signature placeholder, a full-screen native signing dialog, and a snapshot-to-placeholder save animation. Ceremony wording supplied by the user: CODEKSHETRA 2026 inauguration, Rotaract Club of SVPCET under SADC, October 31 2026 at 1:15 PM, 2nd floor auditorium B Block at SVPCET Nagpur. Default event data and prior blank defaults migrate on load. Custom event values are preserved. Physical tablet/stylus testing remains advisable.
